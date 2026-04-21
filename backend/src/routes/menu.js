const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const {
    getCategorias,
    getProductos,
    crearProducto,
    editarProducto,
    eliminarProducto,
    crearCategoria
} = require('../controllers/menuController');

router.get('/categorias',      auth, getCategorias);
router.post('/categorias',     auth, crearCategoria);
router.get('/productos',       auth, getProductos);
router.post('/productos',      auth, crearProducto);
router.put('/productos/:id',   auth, editarProducto);
router.delete('/productos/:id', auth, eliminarProducto);

module.exports = router;