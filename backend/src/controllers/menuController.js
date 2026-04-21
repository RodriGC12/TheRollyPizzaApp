const pool = require('../config/db');

const getCategorias = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM categorias_menu ORDER BY nombre`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo categorías' });
    }
};

const getProductos = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.producto_id, p.nombre, p.descripcion, p.precio,
                    p.disponible, p.fecha_creacion,
                    c.categoria_id, c.nombre AS categoria
             FROM productos p
             JOIN categorias_menu c ON p.categoria_id = c.categoria_id
             ORDER BY c.nombre, p.nombre`
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
        if (!nombre || !precio || !categoria_id)
            return res.status(400).json({ error: 'Nombre, precio y categoría son requeridos' });

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

const editarProducto = async (req, res) => {
    const { id } = req.params;
    const { categoria_id, nombre, descripcion, precio, disponible } = req.body;
    try {
        const result = await pool.query(
            `UPDATE productos
             SET categoria_id = $1,
                 nombre       = $2,
                 descripcion  = $3,
                 precio       = $4,
                 disponible   = $5
             WHERE producto_id = $6
             RETURNING *`,
            [categoria_id, nombre, descripcion, precio, disponible, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error editando producto' });
    }
};

const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        const enUso = await pool.query(
            `SELECT COUNT(*) FROM orden_detalle WHERE producto_id = $1`, [id]
        );
        if (parseInt(enUso.rows[0].count) > 0)
            return res.status(400).json({ error: 'No se puede eliminar un producto que tiene órdenes registradas' });

        await pool.query(`DELETE FROM productos WHERE producto_id = $1`, [id]);
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando producto' });
    }
};

const crearCategoria = async (req, res) => {
    const { nombre } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO categorias_menu (nombre) VALUES ($1) RETURNING *`,
            [nombre]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando categoría' });
    }
};

module.exports = {
    getCategorias,
    getProductos,
    crearProducto,
    editarProducto,
    eliminarProducto,
    crearCategoria
};