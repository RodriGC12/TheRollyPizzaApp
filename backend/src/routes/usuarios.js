const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const {
    getUsuarios,
    crearUsuario,
    editarUsuario,
    cambiarPassword,
    toggleUsuario,
    eliminarUsuario,
    getRoles
} = require('../controllers/usuariosController');

router.get('/',              auth, getUsuarios);
router.get('/roles',         auth, getRoles);
router.post('/',             auth, crearUsuario);
router.put('/:id',           auth, editarUsuario);
router.patch('/:id/password', auth, cambiarPassword);
router.patch('/:id',         auth, toggleUsuario);
router.delete('/:id',        auth, eliminarUsuario);

module.exports = router;