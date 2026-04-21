const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.usuario_id, u.nombre_completo, u.nombre_usuario,
                    u.activo, u.fecha_creacion, r.nombre AS rol
             FROM usuarios u
             JOIN roles r ON u.rol_id = r.rol_id
             ORDER BY u.fecha_creacion DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
};

const crearUsuario = async (req, res) => {
    const { rol_id, nombre_completo, nombre_usuario, password } = req.body;
    try {
        const existe = await pool.query(
            `SELECT usuario_id FROM usuarios WHERE nombre_usuario = $1`,
            [nombre_usuario]
        );
        if (existe.rows.length > 0)
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO usuarios (rol_id, nombre_completo, nombre_usuario, password_hash)
             VALUES ($1, $2, $3, $4) RETURNING usuario_id, nombre_completo, nombre_usuario`,
            [rol_id, nombre_completo, nombre_usuario, hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando usuario' });
    }
};

const editarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, nombre_usuario, rol_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE usuarios
             SET nombre_completo = $1,
                 nombre_usuario  = $2,
                 rol_id          = $3
             WHERE usuario_id = $4
             RETURNING usuario_id, nombre_completo, nombre_usuario`,
            [nombre_completo, nombre_usuario, rol_id, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error editando usuario' });
    }
};

const cambiarPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        if (!password || password.length < 4)
            return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });

        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `UPDATE usuarios SET password_hash = $1 WHERE usuario_id = $2`,
            [hash, id]
        );
        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cambiando contraseña' });
    }
};

const toggleUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE usuarios SET activo = NOT activo
             WHERE usuario_id = $1
             RETURNING usuario_id, nombre_usuario, activo`,
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
};

const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const tieneOrdenes = await pool.query(
            `SELECT COUNT(*) FROM ordenes WHERE mesero_id = $1`, [id]
        );
        if (parseInt(tieneOrdenes.rows[0].count) > 0)
            return res.status(400).json({ error: 'No se puede eliminar un usuario con órdenes registradas' });

        await pool.query(`DELETE FROM usuarios WHERE usuario_id = $1`, [id]);
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
};

const getRoles = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM roles ORDER BY rol_id`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo roles' });
    }
};

module.exports = {
    getUsuarios,
    crearUsuario,
    editarUsuario,
    cambiarPassword,
    toggleUsuario,
    eliminarUsuario,
    getRoles
};;