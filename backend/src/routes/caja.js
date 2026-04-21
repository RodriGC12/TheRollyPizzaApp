const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const {
    getEstadoCaja,
    abrirCaja,
    cerrarCaja,
    getHistorialOrdenesDia,
    reabrirCaja
} = require('../controllers/cajaController');

router.get('/',          auth, getEstadoCaja);
router.get('/historial', auth, getHistorialOrdenesDia);
router.post('/abrir',    auth, abrirCaja);
router.post('/cerrar',   auth, cerrarCaja);
router.post('/reabrir',  auth, reabrirCaja);

module.exports = router;