const pool = require('../config/db');

const getOrdenesActivas = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM vw_ordenes_activas ORDER BY fecha_creacion DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo órdenes' });
    }
};

const getDetalleOrden = async (req, res) => {
    const { id } = req.params;
    try {
        const orden = await pool.query(
            `SELECT o.orden_id, o.estado, o.observaciones, o.total,
                    o.fecha_creacion, o.fecha_envio_cocina,
                    m.numero AS nro_mesa, u.nombre_completo AS mesero
             FROM ordenes o
             JOIN mesas m    ON o.mesa_id   = m.mesa_id
             JOIN usuarios u ON o.mesero_id = u.usuario_id
             WHERE o.orden_id = $1`,
            [id]
        );
        if (orden.rows.length === 0)
            return res.status(404).json({ error: 'Orden no encontrada' });

        const detalle = await pool.query(
            `SELECT od.detalle_id, p.nombre AS producto,
                    od.cantidad, od.precio_unitario,
                    od.subtotal, od.observacion
             FROM orden_detalle od
             JOIN productos p ON od.producto_id = p.producto_id
             WHERE od.orden_id = $1`,
            [id]
        );
        res.json({ ...orden.rows[0], productos: detalle.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo detalle' });
    }
};

const crearOrden = async (req, res) => {
    const { mesa_id, observaciones } = req.body;
    const mesero_id = req.usuario.usuario_id;

    try {
        // Verificar que haya caja abierta
        const hoy = new Date().toISOString().split('T')[0]
        const caja = await pool.query(
            `SELECT caja_id FROM cierre_caja 
             WHERE fecha = $1 AND estado = 'Abierta'`,
            [hoy]
        )
        if (caja.rows.length === 0)
            return res.status(400).json({ error: 'No hay caja abierta. El administrador debe abrir la caja primero.' })

        await pool.query(
            `UPDATE mesas SET estado = 'Ocupada' WHERE mesa_id = $1`,
            [mesa_id]
        );
        const result = await pool.query(
            `INSERT INTO ordenes (mesa_id, mesero_id, observaciones)
             VALUES ($1, $2, $3) RETURNING *`,
            [mesa_id, mesero_id, observaciones]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando orden' });
    }
};

const agregarProducto = async (req, res) => {
    const { id } = req.params;
    const { producto_id, cantidad, observacion } = req.body;
    try {
        const producto = await pool.query(
            `SELECT precio FROM productos WHERE producto_id = $1`,
            [producto_id]
        );
        if (producto.rows.length === 0)
            return res.status(404).json({ error: 'Producto no encontrado' });

        const precio = producto.rows[0].precio;
        const result = await pool.query(
            `INSERT INTO orden_detalle (orden_id, producto_id, cantidad, precio_unitario, observacion)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, producto_id, cantidad, precio, observacion]
        );

        // Gestionar estado según dónde esté la orden
        const { rows } = await pool.query(`SELECT estado FROM ordenes WHERE orden_id = $1`, [id]);
        const estado = rows[0]?.estado;
        let reenviada = false;

        if (estado === 'Pendiente') {
            await pool.query(
                `UPDATE ordenes SET estado = 'EnCocina', fecha_envio_cocina = NOW() WHERE orden_id = $1`, [id]
            );
            reenviada = true;
        } else if (estado === 'EnCocina') {
            // Resetea el timer para que cocina note la actualización
            await pool.query(
                `UPDATE ordenes SET fecha_envio_cocina = NOW() WHERE orden_id = $1`, [id]
            );
            reenviada = true;
        } else if (estado === 'Lista') {
            // El cliente pidió algo más después de que cocina lo marcó listo
            await pool.query(
                `UPDATE ordenes SET estado = 'EnCocina', fecha_envio_cocina = NOW() WHERE orden_id = $1`, [id]
            );
            reenviada = true;
        }

        res.status(201).json({ ...result.rows[0], reenviada });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error agregando producto' });
    }
};

const cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['Pendiente', 'EnCocina', 'Lista', 'PorCobrar', 'Cerrada', 'Cancelada'];
    if (!estadosValidos.includes(estado))
        return res.status(400).json({ error: 'Estado inválido' });
    try {
        const campos = {
            EnCocina:  ', fecha_envio_cocina = NOW()',
            Lista:     ', fecha_lista = NOW()',
            Cerrada:   ', fecha_cierre = NOW()',
        };
        await pool.query(
            `UPDATE ordenes SET estado = $1 ${campos[estado] || ''} WHERE orden_id = $2`,
            [estado, id]
        );

        if (estado === 'PorCobrar') {
            await pool.query(
                `UPDATE mesas SET estado = 'EnProcesoDePago'
                 WHERE mesa_id = (SELECT mesa_id FROM ordenes WHERE orden_id = $1)`,
                [id]
            );
        } else if (estado === 'Cerrada') {
            await pool.query(
                `UPDATE mesas SET estado = 'Disponible'
                 WHERE mesa_id = (SELECT mesa_id FROM ordenes WHERE orden_id = $1)`,
                [id]
            );
        }

        res.json({ mensaje: `Orden actualizada a ${estado}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando orden' });
    }
};

const eliminarOrden = async (req, res) => {
    const { id } = req.params;
    try {
        const orden = await pool.query(
            `SELECT estado, mesa_id FROM ordenes WHERE orden_id = $1`, [id]
        );
        if (orden.rows.length === 0)
            return res.status(404).json({ error: 'Orden no encontrada' });
        if (orden.rows[0].estado !== 'Pendiente')
            return res.status(400).json({ error: 'Solo se pueden eliminar órdenes Pendientes' });

        await pool.query(`DELETE FROM orden_detalle WHERE orden_id = $1`, [id]);
        await pool.query(`DELETE FROM ordenes WHERE orden_id = $1`, [id]);
        await pool.query(
            `UPDATE mesas SET estado = 'Disponible' WHERE mesa_id = $1`,
            [orden.rows[0].mesa_id]
        );
        res.json({ mensaje: 'Orden eliminada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando orden' });
    }
};

const eliminarProductoOrden = async (req, res) => {
    const { id, detalleId } = req.params;
    try {
        const orden = await pool.query(
            `SELECT estado FROM ordenes WHERE orden_id = $1`, [id]
        );
        if (!['Pendiente', 'EnCocina', 'Lista'].includes(orden.rows[0].estado))
            return res.status(400).json({ error: 'Solo se puede modificar una orden activa' });

        await pool.query(
            `DELETE FROM orden_detalle WHERE detalle_id = $1 AND orden_id = $2`,
            [detalleId, id]
        );
        res.json({ mensaje: 'Producto eliminado de la orden' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando producto' });
    }
};

const getOrdenesCocinero = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.orden_id, m.numero AS nro_mesa, o.fecha_envio_cocina,
                    (o.fecha_lista IS NOT NULL) AS reagendada,
                    json_agg(
                        json_build_object(
                            'detalle_id', od.detalle_id,
                            'producto',   p.nombre,
                            'cantidad',   od.cantidad,
                            'observacion', od.observacion
                        ) ORDER BY od.detalle_id
                    ) AS productos
             FROM ordenes o
             JOIN mesas        m  ON m.mesa_id       = o.mesa_id
             JOIN orden_detalle od ON od.orden_id     = o.orden_id
             JOIN productos     p  ON p.producto_id  = od.producto_id
             WHERE o.estado = 'EnCocina'
             GROUP BY o.orden_id, m.numero, o.fecha_envio_cocina, o.fecha_lista
             ORDER BY o.fecha_envio_cocina ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo órdenes de cocina' });
    }
};

module.exports = {
    getOrdenesActivas,
    getOrdenesCocinero,
    getDetalleOrden,
    crearOrden,
    agregarProducto,
    cambiarEstado,
    eliminarOrden,
    eliminarProductoOrden
};