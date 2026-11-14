
const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: __dirname + '/.env' });

const pool = require('./db');

const authRoutes = require('./auth');
const trabajosRoutes = require('./trabajos');
const solicitudesRoutes = require('./solicitudes');
const pagosRoutes = require('./pagos');
const profesionalesRoutes = require('./profesionales');
const ubicacionesRoutes = require('./ubicaciones');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    throw new Error('Falta configurar JWT_SECRET en backend/.env');
}

// Configuración de la API
app.use(cors());
app.use(express.json());

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas de trabajos
app.use('/trabajos', trabajosRoutes);

// Rutas de solicitudes
app.use('/solicitudes', solicitudesRoutes);
app.use('/pagos', pagosRoutes);
app.use('/profesionales', profesionalesRoutes);
app.use('/ubicaciones', ubicacionesRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de Work24 funcionando'
    });
});

// Comprobar conexión con PostgreSQL
app.get('/prueba-db', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT NOW() AS fecha'
        );

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

// Obtener todas las profesiones
app.get('/profesiones', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nombre
            FROM profesiones
            ORDER BY nombre
        `);

        res.json(resultado.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'No se pudieron obtener las profesiones'
        });
    }
});

// Obtener profesionales registrados
app.get('/profesionales', async (req, res) => {
    try {
        const resultado = await pool.query(`
            WITH trabajos_completados AS (
                SELECT
                    s.profesional_id,
                    COUNT(DISTINCT t.id)::integer AS total
                FROM solicitudes s
                JOIN trabajos t
                    ON t.id = s.trabajo_id
                WHERE t.estado = 'finalizado'
                GROUP BY s.profesional_id
            ),
            resumen_calificaciones AS (
                SELECT
                    profesional_id,
                    ROUND(
                        AVG(
                            (calidad + precio + trato)::numeric / 3
                        ),
                        1
                    ) AS promedio_calificacion,
                    COUNT(*)::integer AS cantidad_valoraciones
                FROM calificaciones
                GROUP BY profesional_id
            )
            SELECT
                p.id AS profesional_id,
                u.nombre,
                u.apellido,
                p.descripcion,
                p.estado_disponibilidad,
                pr.nombre AS profesion,
                pp.tiene_matricula,
                COALESCE(tc.total, 0) AS trabajos_completados,
                rc.promedio_calificacion,
                COALESCE(rc.cantidad_valoraciones, 0)
                    AS cantidad_valoraciones
            FROM profesionales p
            JOIN usuarios u
                ON u.id = p.usuario_id
            LEFT JOIN profesional_profesion pp
                ON pp.profesional_id = p.id
            LEFT JOIN profesiones pr
                ON pr.id = pp.profesion_id
            LEFT JOIN trabajos_completados tc
                ON tc.profesional_id = p.id
            LEFT JOIN resumen_calificaciones rc
                ON rc.profesional_id = p.id
            ORDER BY u.apellido, u.nombre, pr.nombre
        `);

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener profesionales:', error);

        res.status(500).json({
            error: 'No se pudieron obtener los profesionales'
        });
    }
});


// Obtener el perfil completo de un profesional
app.get('/profesionales/:id', async (req, res) => {
    try {
        const profesionalId = Number(req.params.id);

        if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
            return res.status(400).json({
                error: 'Identificador de profesional inválido'
            });
        }

        const resultado = await pool.query(`
            SELECT
                p.id AS profesional_id,
                u.nombre,
                u.apellido,
                p.descripcion,
                p.estado_disponibilidad,

                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'nombre', pr.nombre,
                                'tiene_matricula', pp.tiene_matricula,
                                'matricula',
                                    CASE
                                        WHEN pp.tiene_matricula = true
                                        THEN pp.matricula
                                        ELSE NULL
                                    END
                            )
                            ORDER BY pr.nombre
                        )
                        FROM profesional_profesion pp
                        JOIN profesiones pr
                            ON pr.id = pp.profesion_id
                        WHERE pp.profesional_id = p.id
                    ),
                    '[]'::json
                ) AS profesiones,

                COALESCE(
                    (
                        SELECT COUNT(DISTINCT t.id)::integer
                        FROM solicitudes s
                        JOIN trabajos t
                            ON t.id = s.trabajo_id
                        WHERE s.profesional_id = p.id
                          AND t.estado = 'finalizado'
                    ),
                    0
                ) AS trabajos_completados,

                (
                    SELECT ROUND(
                        AVG(
                            (c.calidad + c.precio + c.trato)::numeric / 3
                        ),
                        1
                    )
                    FROM calificaciones c
                    WHERE c.profesional_id = p.id
                ) AS promedio_calificacion,

                (
                    SELECT COUNT(*)::integer
                    FROM calificaciones c
                    WHERE c.profesional_id = p.id
                ) AS cantidad_valoraciones,

                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'calidad', c.calidad,
                                'precio', c.precio,
                                'trato', c.trato,
                                'comentario', c.comentario,
                                'fecha_creacion', c.fecha_creacion
                            )
                            ORDER BY c.fecha_creacion DESC
                        )
                        FROM calificaciones c
                        WHERE c.profesional_id = p.id
                    ),
                    '[]'::json
                ) AS calificaciones

            FROM profesionales p
            JOIN usuarios u
                ON u.id = p.usuario_id
            WHERE p.id = $1
        `, [profesionalId]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró el profesional'
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error('Error al obtener perfil:', error);

        res.status(500).json({
            error: 'No se pudo obtener el perfil del profesional'
        });
    }
});

// Iniciar servidor accesible desde la red local
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Work24 iniciado en el puerto ${PORT}`);
    console.log(`API local: http://localhost:${PORT}`);
});
