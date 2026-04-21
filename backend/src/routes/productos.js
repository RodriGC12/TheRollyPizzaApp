const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const {
    getMenuDisponible,
    getProductosPorCategoria,
    crearProducto,
    actualizarProducto
} = require('../controllers/productosController');

router.get('/',             auth, getMenuDisponible);
router.get('/categorias',   auth, getProductosPorCategoria);
router.post('/',            auth, crearProducto);
router.put('/:id',          auth, actualizarProducto);

module.exports = router;