const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { nombre_usuario, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT u.usuario_id, u.nombre_completo, u.nombre_usuario,
                    u.password_hash, u.activo, r.nombre AS rol
             FROM usuarios u
             JOIN roles r ON u.rol_id = r.rol_id
             WHERE u.nombre_usuario = $1`,
            [nombre_usuario]
        );

        if (result.rows.length === 0)
            return res.status(401).json({ error: 'Usuario no encontrado' });

        const usuario = result.rows[0];

        if (!usuario.activo)
            return res.status(401).json({ error: 'Usuario inactivo' });

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido)
            return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            {
                usuario_id: usuario.usuario_id,
                nombre_completo: usuario.nombre_completo,
                nombre_usuario: usuario.nombre_usuario,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                usuario_id: usuario.usuario_id,
                nombre_completo: usuario.nombre_completo,
                nombre_usuario: usuario.nombre_usuario,
                rol: usuario.rol
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = { login };