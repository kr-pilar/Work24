const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de Work24 funcionando'
    });
});

app.get('/prueba-db', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT NOW() AS fecha');

        res.json({
            mensaje: 'Conexión con PostgreSQL funcionando',
            fecha: resultado.rows[0].fecha
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'No se pudo conectar con PostgreSQL'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Work24 iniciado en http://localhost:${PORT}`);
});
