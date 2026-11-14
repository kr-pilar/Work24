const { Pool } = require('pg');
require('dotenv').config();

let configuracion;

if (process.env.DATABASE_URL) {
    configuracion = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    configuracion = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    };
}

const pool = new Pool(configuracion);

module.exports = pool;
