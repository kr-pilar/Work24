const express = require('express');
const pool = require('./db');
const autenticar = require('./middleware/autenticar');

const router = express.Router();

// ACTIVAR O DESACTIVAR DISPONIBILIDAD DEL PROFESIONAL
router.patch('/disponibilidad', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'profesional') {
        return res.status(403).json({
            error: 'Solo los profesionales pueden modificar su disponibilidad'
        });
    }

    const disponible = req.body.estadoDisponibilidad;

    if (typeof disponible !== 'boolean') {
        return res.status(400).json({
            error: 'El estado de disponibilidad no es válido'
        });
    }

    let latitud = null;
    let longitud = null;

    if (disponible) {
        latitud = req.body.latitud;
        longitud = req.body.longitud;

        if (
            typeof latitud !== 'number' ||
            typeof longitud !== 'number' ||
            !Number.isFinite(latitud) ||
            !Number.isFinite(longitud) ||
            latitud < -90 ||
            latitud > 90 ||
            longitud < -180 ||
            longitud > 180
        ) {
            return res.status(400).json({
                error: 'Se necesita una ubicación GPS válida para activar la disponibilidad'
            });
        }
    }

    try {
        const resultado = await pool.query(
            `UPDATE profesionales
             SET estado_disponibilidad = $1,
                 latitud = $2,
                 longitud = $3,
                 ubicacion_actualizada = CASE
                    WHEN $1 = TRUE THEN NOW()
                    ELSE NULL
                 END
             WHERE usuario_id = $4
             RETURNING estado_disponibilidad, ubicacion_actualizada`,
            [
                disponible,
                latitud,
                longitud,
                req.usuario.id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró el perfil profesional'
            });
        }

        return res.json({
            mensaje: disponible
                ? 'Ahora estás disponible para recibir consultas'
                : 'Dejaste de estar disponible',
            estado_disponibilidad: resultado.rows[0].estado_disponibilidad,
            ubicacion_actualizada: resultado.rows[0].ubicacion_actualizada
        });

    } catch (error) {
        console.error('Error al cambiar disponibilidad:', error);

        return res.status(500).json({
            error: 'No se pudo actualizar la disponibilidad'
        });
    }
});

// BUSCAR PROFESIONALES PARA UN TRABAJO
router.get('/', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden buscar profesionales'
        });
    }

    const trabajoId = Number(req.query.trabajoId);

    if (!Number.isInteger(trabajoId) || trabajoId <= 0) {
        return res.status(400).json({
            error: 'El identificador del trabajo no es válido'
        });
    }

    try {
        const resultadoTrabajo = await pool.query(
            `SELECT
                t.id,
                t.latitud,
                t.longitud,
                t.urgencia,
                t.profesion_id
             FROM trabajos t
             INNER JOIN clientes c ON c.id = t.cliente_id
             WHERE t.id = $1
               AND c.usuario_id = $2`,
            [trabajoId, req.usuario.id]
        );

        if (resultadoTrabajo.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró el trabajo o no pertenece a este cliente'
            });
        }

        const trabajo = resultadoTrabajo.rows[0];

        const resultado = await pool.query(
            `WITH trabajos_completados AS (
                SELECT
                    s.profesional_id,
                    COUNT(DISTINCT t.id)::integer AS total
                FROM solicitudes s
                INNER JOIN trabajos t ON t.id = s.trabajo_id
                WHERE t.estado = 'finalizado'
                GROUP BY s.profesional_id
            ),
            resumen_calificaciones AS (
                SELECT
                    profesional_id,
                    ROUND(
                        AVG((calidad + precio + trato)::numeric / 3),
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
                    AS cantidad_valoraciones,

                CASE
                    WHEN p.latitud IS NULL
                      OR p.longitud IS NULL
                      OR $1::double precision IS NULL
                      OR $2::double precision IS NULL
                    THEN NULL
                    ELSE ROUND(
                        (
                            6371 * 2 * ASIN(
                                SQRT(
                                    LEAST(
                                        1,
                                        POWER(
                                            SIN(
                                                RADIANS(
                                                    p.latitud - $1::double precision
                                                ) / 2
                                            ),
                                            2
                                        )
                                        +
                                        COS(RADIANS($1::double precision))
                                        * COS(RADIANS(p.latitud))
                                        * POWER(
                                            SIN(
                                                RADIANS(
                                                    p.longitud - $2::double precision
                                                ) / 2
                                            ),
                                            2
                                        )
                                    )
                                )
                            )
                        )::numeric,
                        1
                    )
                END AS distancia_km

            FROM profesionales p
            INNER JOIN usuarios u ON u.id = p.usuario_id
            LEFT JOIN profesional_profesion pp
                ON pp.profesional_id = p.id
            LEFT JOIN profesiones pr
                ON pr.id = pp.profesion_id
            LEFT JOIN trabajos_completados tc
                ON tc.profesional_id = p.id
            LEFT JOIN resumen_calificaciones rc
                ON rc.profesional_id = p.id

            WHERE (
                $3::varchar = 'baja'
                OR p.estado_disponibilidad = TRUE
            )
            AND (
                $4::integer IS NULL
                OR EXISTS (
                    SELECT 1
                    FROM profesional_profesion pp2
                    WHERE pp2.profesional_id = p.id
                      AND pp2.profesion_id = $4::integer
                )
            )
            AND p.usuario_id <> $5

            ORDER BY distancia_km ASC NULLS LAST,
                     u.apellido,
                     u.nombre,
                     pr.nombre`,
            [
                trabajo.latitud,
                trabajo.longitud,
                trabajo.urgencia,
                trabajo.profesion_id,
                req.usuario.id
            ]
        );

        const agrupados = new Map();

        resultado.rows.forEach((item) => {
            let profesional = agrupados.get(item.profesional_id);

            if (!profesional) {
                profesional = {
                    profesional_id: item.profesional_id,
                    nombre: item.nombre,
                    apellido: item.apellido,
                    descripcion: item.descripcion,
                    estado_disponibilidad: item.estado_disponibilidad,
                    tiene_matricula: item.tiene_matricula === true,
                    trabajos_completados: Number(item.trabajos_completados),
                    promedio_calificacion: item.promedio_calificacion,
                    cantidad_valoraciones: Number(item.cantidad_valoraciones),
                    distancia_km: item.distancia_km,
                    profesiones: []
                };

                agrupados.set(item.profesional_id, profesional);
            }

            if (
                item.profesion &&
                !profesional.profesiones.includes(item.profesion)
            ) {
                profesional.profesiones.push(item.profesion);
            }

            if (item.tiene_matricula === true) {
                profesional.tiene_matricula = true;
            }
        });

        const lista = Array.from(agrupados.values());

        const profesionales = lista.filter((item) =>
            item.trabajos_completados > 0 ||
            item.cantidad_valoraciones > 0
        );

        const nuevos = lista.filter((item) =>
            item.trabajos_completados === 0 &&
            item.cantidad_valoraciones === 0
        );

        return res.json({
            trabajoId: trabajo.id,
            urgencia: trabajo.urgencia,
            profesionId: trabajo.profesion_id,
            profesionales,
            nuevos
        });

    } catch (error) {
        console.error('Error al buscar profesionales:', error);

        return res.status(500).json({
            error: 'No se pudieron obtener los profesionales'
        });
    }
});

module.exports = router;
