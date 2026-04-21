const pool = require('../config/db');

const getEstadoCaja = async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];

        const caja = await pool.query(
            `SELECT * FROM cierre_caja WHERE fecha = $1`,
            [hoy]
        );

        const ventas = await pool.query(
            `SELECT COALESCE(SUM(total), 0) AS total_ventas,
                    COUNT(*) AS total_ordenes
             FROM ordenes
             WHERE estado = 'Cerrada'
               AND DATE(fecha_cierre) = $1`,
            [hoy]
        );

        res.json({
            caja:   caja.rows[0] || null,
            ventas: ventas.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo estado de caja' });
    }
};

const abrirCaja = async (req, res) => {
    const { monto_apertura } = req.body;
    const usuario_id = req.usuario.usuario_id;
    const hoy = new Date().toISOString().split('T')[0];

    try {
        const existe = await pool.query(
            `SELECT caja_id FROM cierre_caja WHERE fecha = $1`, [hoy]
        );
        if (existe.rows.length > 0)
            return res.status(400).json({ error: 'Ya existe una caja abierta hoy' });

        const result = await pool.query(
            `INSERT INTO cierre_caja (usuario_id, fecha, monto_apertura, hora_apertura, estado)
             VALUES ($1, $2, $3, NOW(), 'Abierta') RETURNING *`,
            [usuario_id, hoy, monto_apertura]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error abriendo caja' });
    }
};

const cerrarCaja = async (req, res) => {
    const { monto_fisico_contado, observaciones } = req.body;
    const hoy = new Date().toISOString().split('T')[0];

    try {
        const totalVentas = await pool.query(
            `SELECT COALESCE(SUM(total), 0) AS total
             FROM ordenes
             WHERE estado = 'Cerrada' AND DATE(fecha_cierre) = $1`,
            [hoy]
        );

        const total = totalVentas.rows[0].total;

        const result = await pool.query(
            `UPDATE cierre_caja
             SET total_ventas_registradas = $1,
                 monto_fisico_contado     = $2,
                 hora_cierre              = NOW(),
                 estado                   = 'Cerrada',
                 observaciones            = $3
             WHERE fecha = $4 AND estado = 'Abierta'
             RETURNING *`,
            [total, monto_fisico_contado, observaciones, hoy]
        );

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'No hay caja abierta hoy' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cerrando caja' });
    }
};

const getHistorialOrdenesDia = async (req, res) => {
    try {
        const { fecha } = req.query
        const fechaFiltro = fecha || new Date().toISOString().split('T')[0]

        const result = await pool.query(
            `SELECT o.orden_id, m.numero AS nro_mesa, o.total,
                    o.fecha_creacion, o.fecha_cierre,
                    u.nombre_completo AS mesero
             FROM ordenes o
             JOIN mesas    m ON o.mesa_id   = m.mesa_id
             JOIN usuarios u ON o.mesero_id = u.usuario_id
             WHERE o.estado = 'Cerrada'
               AND DATE(o.fecha_cierre) = $1
             ORDER BY o.fecha_cierre DESC`,
            [fechaFiltro]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo historial' });
    }
};

const PIN_REABRIR = 'caja123';

const reabrirCaja = async (req, res) => {
    const { pin } = req.body;
    const hoy = new Date().toISOString().split('T')[0];

    if (pin !== PIN_REABRIR)
        return res.status(403).json({ error: 'PIN incorrecto' });

    try {
        const result = await pool.query(
            `UPDATE cierre_caja
             SET estado = 'Abierta'
             WHERE fecha = $1 AND estado = 'Cerrada'
             RETURNING *`,
            [hoy]
        );

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'No hay caja cerrada hoy para reabrir' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error reabriendo caja' });
    }
};

module.exports = { getEstadoCaja, abrirCaja, cerrarCaja, getHistorialOrdenesDia, reabrirCaja };