const pool = require('../config/db');

const getMenuDisponible = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM vw_menu_disponible`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo menú' });
    }
};

const getProductosPorCategoria = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.nombre AS categoria,
                    json_agg(json_build_object(
                        'producto_id', p.producto_id,
                        'nombre',      p.nombre,
                        'descripcion', p.descripcion,
                        'precio',      p.precio
                    ) ORDER BY p.nombre) AS productos
             FROM productos p
             JOIN categorias_menu c ON p.categoria_id = c.categoria_id
             WHERE p.disponible = TRUE AND c.activo = TRUE
             GROUP BY c.nombre
             ORDER BY c.nombre`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
};

const crearProducto = async (req, res) => {
    const { categoria_id, nombre, descripcion, precio } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO productos (categoria_id, nombre, descripcion, precio)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [categoria_id, nombre, descripcion, precio]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando producto' });
    }
};

const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, disponible } = req.body;
    try {
        const result = await pool.query(
            `UPDATE productos 
             SET nombre = $1, descripcion = $2, precio = $3, disponible = $4
             WHERE producto_id = $5 RETURNING *`,
            [nombre, descripcion, precio, disponible, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando producto' });
    }
};

module.exports = {
    getMenuDisponible,
    getProductosPorCategoria,
    crearProducto,
    actualizarProducto
};