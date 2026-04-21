const pool = require('../config/db');

const getMesas = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.mesa_id, m.numero, m.capacidad, m.estado,
                    m.pos_x, m.pos_y,
                    o.orden_id, o.total,
                    COUNT(od.detalle_id) AS total_items
             FROM mesas m
             LEFT JOIN ordenes o ON o.mesa_id = m.mesa_id
                AND o.estado NOT IN ('Cerrada', 'Cancelada')
             LEFT JOIN orden_detalle od ON od.orden_id = o.orden_id
             GROUP BY m.mesa_id, m.numero, m.capacidad, m.estado, m.pos_x, m.pos_y, o.orden_id, o.total
             ORDER BY m.numero`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo mesas' });
    }
};

const actualizarPosicion = async (req, res) => {
    const { id } = req.params;
    const { pos_x, pos_y } = req.body;
    try {
        await pool.query(
            `UPDATE mesas SET pos_x = $1, pos_y = $2 WHERE mesa_id = $3`,
            [pos_x, pos_y, id]
        );
        res.json({ mensaje: 'Posición actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando posición' });
    }
};

const crearMesa = async (req, res) => {
    const { numero, capacidad } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO mesas (numero, capacidad, estado, pos_x, pos_y)
             VALUES ($1, $2, 'Disponible', 50, 50) RETURNING *`,
            [numero, capacidad]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505')
            return res.status(400).json({ error: `Ya existe la mesa número ${numero}` });
        res.status(500).json({ error: 'Error creando mesa' });
    }
};

const eliminarMesa = async (req, res) => {
    const { id } = req.params;
    try {
        const ordenActiva = await pool.query(
            `SELECT orden_id FROM ordenes WHERE mesa_id = $1 AND estado NOT IN ('Cerrada', 'Cancelada')`,
            [id]
        );
        if (ordenActiva.rows.length > 0)
            return res.status(400).json({ error: 'La mesa tiene una orden activa' });

        const result = await pool.query(
            `DELETE FROM mesas WHERE mesa_id = $1 RETURNING mesa_id`, [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Mesa no encontrada' });

        res.json({ mensaje: 'Mesa eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando mesa' });
    }
};

module.exports = { getMesas, actualizarPosicion, crearMesa, eliminarMesa };