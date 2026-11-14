
const express = require('express');
const pool = require('./db');
const autenticar = require('./middleware/autenticar');

const router = express.Router();

function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

// PUBLICAR UN TRABAJO (SOLO CLIENTES)
router.post('/', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden publicar trabajos'
        });
    }

    const titulo = texto(req.body.titulo);
    const descripcion = texto(req.body.descripcion);
    const ubicacion = texto(req.body.ubicacion);
    const urgencia = texto(req.body.urgencia).toLowerCase();
    const profesionId = Number(req.body.profesionId);

    const latitud = req.body.latitud ?? null;
    const longitud = req.body.longitud ?? null;

    const ubicacionGpsValida =
        (latitud === null && longitud === null) ||
        (
            typeof latitud === 'number' &&
            typeof longitud === 'number' &&
            Number.isFinite(latitud) &&
            Number.isFinite(longitud) &&
            latitud >= -90 &&
            latitud <= 90 &&
            longitud >= -180 &&
            longitud <= 180
        );

    if (!ubicacionGpsValida) {
        return res.status(400).json({
            error: 'Las coordenadas GPS no son válidas'
        });
    }

    if (!titulo || !descripcion || !ubicacion || !urgencia) {
        return res.status(400).json({
            error: 'Debés completar todos los campos'
        });
    }

    if (!Number.isInteger(profesionId) || profesionId <= 0) {
        return res.status(400).json({
            error: 'Debés seleccionar una profesión'
        });
    }

    if (titulo.length > 150 || ubicacion.length > 200) {
        return res.status(400).json({
            error: 'El título o la ubicación superan el límite permitido'
        });
    }

    if (!['baja', 'media', 'alta'].includes(urgencia)) {
        return res.status(400).json({
            error: 'La urgencia debe ser baja, media o alta'
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();

        await conexion.query('BEGIN');

        const cliente = await conexion.query(
            `SELECT id
             FROM clientes
             WHERE usuario_id = $1
             FOR UPDATE`,
            [req.usuario.id]
        );

        if (cliente.rows.length === 0) {
            await conexion.query('ROLLBACK');

            return res.status(404).json({
                error: 'No se encontró el perfil del cliente'
            });
        }

        const clienteId = cliente.rows[0].id;

        // Límite de 3 trabajos activos por cliente.
        // El bloqueo del perfil del cliente evita publicaciones simultáneas
        // que puedan superar el límite.
        const trabajosActivos = await conexion.query(
            `SELECT COUNT(*)::integer AS cantidad
             FROM trabajos
             WHERE cliente_id = $1
               AND estado IN ('pendiente', 'aceptado', 'en_proceso')`,
            [clienteId]
        );

        const cantidadActiva = trabajosActivos.rows[0].cantidad;

        if (cantidadActiva >= 3) {
            await conexion.query('ROLLBACK');

            return res.status(409).json({
                error: 'Ya tenés 3 trabajos pendientes o en curso. Finalizá o cancelá uno para poder publicar otro.',
                limite: 3,
                trabajosActivos: cantidadActiva
            });
        }

        const profesion = await conexion.query(
            `SELECT id
             FROM profesiones
             WHERE id = $1`,
            [profesionId]
        );

        if (profesion.rows.length === 0) {
            await conexion.query('ROLLBACK');

            return res.status(400).json({
                error: 'La profesión seleccionada no existe'
            });
        }

        const resultado = await conexion.query(
            `INSERT INTO trabajos
                (
                    cliente_id,
                    profesion_id,
                    titulo,
                    descripcion,
                    ubicacion,
                    urgencia,
                    latitud,
                    longitud
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING
                id, cliente_id, profesion_id,
                titulo, descripcion, ubicacion,
                urgencia, estado, fecha_creacion`,
            [
                clienteId,
                profesionId,
                titulo,
                descripcion,
                ubicacion,
                urgencia,
                latitud,
                longitud
            ]
        );

        const trabajo = resultado.rows[0];

        // Crear o asociar el beneficio del primer trabajo.
        // Nunca reactivar un beneficio consumido.
        await conexion.query(
            `INSERT INTO beneficios_primer_trabajo (
                cliente_id,
                trabajo_id,
                contactos_usados,
                activo
             )
             VALUES ($1, $2, 0, TRUE)
             ON CONFLICT (cliente_id)
             DO UPDATE SET
                trabajo_id = EXCLUDED.trabajo_id
             WHERE beneficios_primer_trabajo.activo = TRUE
               AND beneficios_primer_trabajo.trabajo_id IS NULL`,
            [clienteId, trabajo.id]
        );

        // Consultar el beneficio real después de la operación.
        const resultadoBeneficio = await conexion.query(
            `SELECT trabajo_id, contactos_usados, activo
             FROM beneficios_primer_trabajo
             WHERE cliente_id = $1`,
            [clienteId]
        );

        const configuracion = await conexion.query(
            `SELECT valor
             FROM configuracion_work24
             WHERE clave = 'beneficio_primer_trabajo_habilitado'`
        );

        const beneficioHabilitado =
            configuracion.rows.length > 0 &&
            configuracion.rows[0].valor === true;

        const beneficio = resultadoBeneficio.rows[0];

        const beneficioDisponible =
            beneficioHabilitado &&
            beneficio &&
            beneficio.activo === true &&
            Number(beneficio.trabajo_id) === Number(trabajo.id);

        const contactosDisponibles = beneficioDisponible
            ? Math.max(0, 3 - Number(beneficio.contactos_usados))
            : 0;

        await conexion.query('COMMIT');

        return res.status(201).json({
            mensaje: 'Trabajo publicado correctamente',
            trabajo,
            beneficioPrimerTrabajo: Boolean(beneficioDisponible),
            contactosGratuitosDisponibles: contactosDisponibles
        });

    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK').catch(() => {});
        }

        console.error('Error al publicar trabajo:', error);

        return res.status(500).json({
            error: 'No se pudo publicar el trabajo'
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

// OBTENER LOS TRABAJOS DEL CLIENTE AUTENTICADO
router.get('/mis-trabajos', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden consultar sus trabajos'
        });
    }

    try {
        const resultado = await pool.query(
            `SELECT
                t.id,
                t.titulo,
                t.descripcion,
                t.ubicacion,
                t.urgencia,
                t.estado,
                t.fecha_creacion
             FROM trabajos t
             INNER JOIN clientes c
                ON c.id = t.cliente_id
             WHERE c.usuario_id = $1
             ORDER BY t.fecha_creacion DESC`,
            [req.usuario.id]
        );

        res.json({
            trabajos: resultado.rows
        });

    } catch (error) {
        console.error('Error al consultar trabajos:', error);

        res.status(500).json({
            error: 'No se pudieron obtener los trabajos'
        });
    }
});

// OBTENER EL DETALLE DE UN TRABAJO Y SUS PROFESIONALES CONTACTADOS
router.get('/mis-trabajos/:id', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden consultar sus trabajos'
        });
    }

    const trabajoId = Number(req.params.id);

    if (!Number.isInteger(trabajoId) || trabajoId <= 0) {
        return res.status(400).json({
            error: 'El identificador del trabajo no es válido'
        });
    }

    try {
        const resultadoTrabajo = await pool.query(
            `SELECT
                t.id,
                t.titulo,
                t.descripcion,
                t.ubicacion,
                t.urgencia,
                t.estado,
                t.fecha_creacion,
                t.solicitud_finalizada_id
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

        const resultadoProfesionales = await pool.query(
            `SELECT
                s.id AS solicitud_id,
                s.estado AS solicitud_estado,
                s.fecha_creacion AS fecha_solicitud,
                p.id AS profesional_id,
                u.nombre,
                u.apellido,
                p.descripcion AS descripcion_profesional,
                p.estado_disponibilidad,
                cal.id AS calificacion_id
             FROM solicitudes s
             INNER JOIN profesionales p
                ON p.id = s.profesional_id
             INNER JOIN usuarios u
                ON u.id = p.usuario_id
             LEFT JOIN calificaciones cal
                ON cal.solicitud_id = s.id
             WHERE s.trabajo_id = $1
             ORDER BY s.fecha_creacion DESC`,
            [trabajoId]
        );

        res.json({
            trabajo: resultadoTrabajo.rows[0],
            profesionales: resultadoProfesionales.rows
        });

    } catch (error) {
        console.error('Error al consultar el detalle del trabajo:', error);

        res.status(500).json({
            error: 'No se pudo consultar el detalle del trabajo'
        });
    }
});



// FINALIZAR UN TRABAJO Y ELEGIR AL ÚNICO PROFESIONAL QUE LO REALIZÓ
router.post('/:id/finalizar', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo el cliente puede finalizar su trabajo'
        });
    }

    const trabajoId = Number(req.params.id);
    const solicitudId = Number(req.body.solicitudId);

    if (
        !Number.isInteger(trabajoId) || trabajoId <= 0 ||
        !Number.isInteger(solicitudId) || solicitudId <= 0
    ) {
        return res.status(400).json({
            error: 'El trabajo o el profesional seleccionado no son válidos'
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const resultadoTrabajo = await conexion.query(
            `SELECT t.id, t.estado, t.solicitud_finalizada_id, c.id AS cliente_id
             FROM trabajos t
             INNER JOIN clientes c ON c.id = t.cliente_id
             WHERE t.id = $1
               AND c.usuario_id = $2
             FOR UPDATE OF t`,
            [trabajoId, req.usuario.id]
        );

        if (resultadoTrabajo.rows.length === 0) {
            await conexion.query('ROLLBACK');
            return res.status(404).json({
                error: 'No se encontró el trabajo o no pertenece a tu cuenta'
            });
        }

        const trabajo = resultadoTrabajo.rows[0];

        if (trabajo.estado === 'finalizado') {
            await conexion.query('ROLLBACK');
            return res.status(409).json({
                error: 'Este trabajo ya fue finalizado'
            });
        }

        if (trabajo.estado === 'cancelado') {
            await conexion.query('ROLLBACK');
            return res.status(400).json({
                error: 'No se puede finalizar un trabajo cancelado'
            });
        }

        const resultadoSolicitud = await conexion.query(
            `SELECT s.id, s.profesional_id
             FROM solicitudes s
             INNER JOIN profesionales p
                ON p.id = s.profesional_id
             WHERE s.id = $1
               AND s.trabajo_id = $2
               AND p.usuario_id <> $3`,
            [solicitudId, trabajoId, req.usuario.id]
        );

        if (resultadoSolicitud.rows.length === 0) {
            await conexion.query('ROLLBACK');
            return res.status(400).json({
                error: 'El profesional seleccionado no fue contactado para este trabajo'
            });
        }

        await conexion.query(
            `UPDATE trabajos
             SET estado = 'finalizado',
                 solicitud_finalizada_id = $1
             WHERE id = $2`,
            [solicitudId, trabajoId]
        );

        await conexion.query('COMMIT');

        return res.json({
            mensaje: 'Trabajo finalizado correctamente',
            trabajoId,
            solicitudFinalizadaId: solicitudId,
            profesionalId: resultadoSolicitud.rows[0].profesional_id
        });

    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK').catch(() => {});
        }

        console.error('Error al finalizar trabajo:', error);

        return res.status(500).json({
            error: 'No se pudo finalizar el trabajo'
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});


// CALIFICAR AL ÚNICO PROFESIONAL ELEGIDO AL FINALIZAR EL TRABAJO
router.post('/:id/calificar', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo el cliente puede calificar el trabajo'
        });
    }

    const trabajoId = Number(req.params.id);
    const calidad = Number(req.body.calidad);
    const precio = Number(req.body.precio);
    const trato = Number(req.body.trato);
    const comentario = typeof req.body.comentario === 'string'
        ? req.body.comentario.trim()
        : null;

    if (!Number.isInteger(trabajoId) || trabajoId <= 0) {
        return res.status(400).json({
            error: 'El identificador del trabajo no es válido'
        });
    }

    if (
        !Number.isInteger(calidad) || calidad < 1 || calidad > 5 ||
        !Number.isInteger(precio) || precio < 1 || precio > 5 ||
        !Number.isInteger(trato) || trato < 1 || trato > 5
    ) {
        return res.status(400).json({
            error: 'Las calificaciones deben ser números enteros entre 1 y 5'
        });
    }

    if (comentario && comentario.length > 1000) {
        return res.status(400).json({
            error: 'El comentario no puede superar los 1000 caracteres'
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const resultadoTrabajo = await conexion.query(
            `SELECT
                t.id,
                t.estado,
                t.solicitud_finalizada_id,
                c.id AS cliente_id
             FROM trabajos t
             INNER JOIN clientes c ON c.id = t.cliente_id
             WHERE t.id = $1
               AND c.usuario_id = $2
             FOR UPDATE OF t`,
            [trabajoId, req.usuario.id]
        );

        if (resultadoTrabajo.rows.length === 0) {
            await conexion.query('ROLLBACK');
            return res.status(404).json({
                error: 'No se encontró el trabajo o no pertenece a tu cuenta'
            });
        }

        const trabajo = resultadoTrabajo.rows[0];

        if (trabajo.estado !== 'finalizado' || !trabajo.solicitud_finalizada_id) {
            await conexion.query('ROLLBACK');
            return res.status(400).json({
                error: 'Primero tenés que finalizar el trabajo y elegir al profesional'
            });
        }

        const resultadoSolicitud = await conexion.query(
            `SELECT profesional_id
             FROM solicitudes
             WHERE id = $1
               AND trabajo_id = $2`,
            [trabajo.solicitud_finalizada_id, trabajoId]
        );

        if (resultadoSolicitud.rows.length === 0) {
            await conexion.query('ROLLBACK');
            return res.status(400).json({
                error: 'No se encontró al profesional seleccionado'
            });
        }

        const profesionalId = resultadoSolicitud.rows[0].profesional_id;

        const existente = await conexion.query(
            `SELECT id
             FROM calificaciones
             WHERE solicitud_id = $1`,
            [trabajo.solicitud_finalizada_id]
        );

        if (existente.rows.length > 0) {
            await conexion.query('ROLLBACK');
            return res.status(409).json({
                error: 'Este profesional ya fue calificado por este trabajo'
            });
        }

        const resultadoCalificacion = await conexion.query(
            `INSERT INTO calificaciones (
                solicitud_id,
                cliente_id,
                profesional_id,
                calidad,
                precio,
                trato,
                comentario
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, calidad, precio, trato, comentario, fecha_creacion`,
            [
                trabajo.solicitud_finalizada_id,
                trabajo.cliente_id,
                profesionalId,
                calidad,
                precio,
                trato,
                comentario || null
            ]
        );

        await conexion.query('COMMIT');

        return res.status(201).json({
            mensaje: 'Calificación registrada correctamente',
            calificacion: resultadoCalificacion.rows[0]
        });

    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK').catch(() => {});
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Este profesional ya fue calificado por este trabajo'
            });
        }

        console.error('Error al calificar trabajo:', error);

        return res.status(500).json({
            error: 'No se pudo registrar la calificación'
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});


module.exports = router;
