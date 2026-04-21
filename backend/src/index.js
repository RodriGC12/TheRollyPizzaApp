require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express         = require('express');
const cors            = require('cors');
require('./config/db');

const authRoutes      = require('./routes/auth');
const ordenesRoutes   = require('./routes/ordenes');
const productosRoutes = require('./routes/productos');
const usuariosRoutes  = require('./routes/usuarios');
const cajaRoutes      = require('./routes/caja');
const menuRoutes      = require('./routes/menu');
const mesasRoutes     = require('./routes/mesas');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/ordenes',   ordenesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/caja',      cajaRoutes);
app.use('/api/menu',      menuRoutes);
app.use('/api/mesas',     mesasRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: 'Paris Rolly Pizza API funcionando ✅' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});