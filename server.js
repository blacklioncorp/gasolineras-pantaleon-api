// Carga las variables de entorno primero
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Importa las rutas
const apiRoutes = require('./src/routes'); 
// Importa la función de conexión a la DB
const { connectDB } = require('./src/config/db.config');

const app = express();

// --- Configuraciones de Seguridad y Middleware ---

// Middleware de seguridad HTTP
app.use(helmet());

// CORS: Permite que el frontend (Vercel) acceda al backend (Render)
// Reemplaza '*' con el dominio de tu frontend en Vercel cuando esté disponible.
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}));

// Body-parser para manejar datos JSON
app.use(express.json());

// --- Rutas ---

// Ruta de Bienvenida simple
app.get('/', (req, res) => {
    res.status(200).send('API Gasolineras Pantaleon v1.0 - Estado: OK');
});

// Rutas de la API (importadas de src/routes/index.js)
app.use('/api/v1', apiRoutes);

// --- Manejo de Errores Global (se configurará en src/middlewares/errorHandler.js) ---
// app.use(errorHandler);

// --- Inicialización del Servidor ---

// --- Inicialización del Servidor ---

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Esto permite conexiones desde fuera del proceso

// Primero intenta conectar la DB y luego inicia el servidor
connectDB()
    .then(() => {
        // CORRECCIÓN: ¡Asegúrate de que HOST esté escrito aquí! 👇
        app.listen(PORT, HOST, () => {
            console.log(`✅ Base de datos conectada.`);
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('❌ Error al iniciar la aplicación:', error.message);
        process.exit(1); 
    });