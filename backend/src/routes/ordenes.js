const express     = require('express');
const router      = express.Router();
const auth        = require('../middleware/auth');
const {
    getOrdenesActivas,
    getOrdenesCocinero,
    getDetalleOrden,
    crearOrden,
    agregarProducto,
    cambiarEstado,
    eliminarOrden,
    eliminarProductoOrden
} = require('../controllers/ordenesController');

router.get('/',         auth, getOrdenesActivas);
router.get('/cocina',   auth, getOrdenesCocinero);
router.get('/:id',      auth, getDetalleOrden);
router.post('/',                       auth, crearOrden);
router.post('/:id/producto',           auth, agregarProducto);
router.patch('/:id/estado',            auth, cambiarEstado);
router.delete('/:id',                  auth, eliminarOrden);
router.delete('/:id/producto/:detalleId', auth, eliminarProductoOrden);

module.exports = router;