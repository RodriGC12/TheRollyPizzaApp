const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const { getMesas, actualizarPosicion, crearMesa, eliminarMesa } = require('../controllers/mesasController');

router.get('/',        auth, getMesas);
router.post('/',       auth, crearMesa);
router.patch('/:id',   auth, actualizarPosicion);
router.delete('/:id',  auth, eliminarMesa);

module.exports = router;