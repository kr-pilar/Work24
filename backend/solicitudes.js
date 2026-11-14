
const express = require('express');
const pool = require('./db');
const autenticar = require('./middleware/autenticar');

const router = express.Router();

// Convierte teléfonos celulares argentinos a formato internacional de WhatsApp.
function normalizarWhatsappArgentina(telefono) {
    const digitos = String(telefono || '').replace(/\D/g, '');

    if (/^\d{10}$/.test(digitos)) {
        return '549' + digitos;
    }

    if (/^54\d{10}$/.test(digitos)) {
        return '549' + digitos.substring(2);
    }

    if (/^549\d{10}$/.test(digitos)) {
        return digitos;
    }

    return null;
}

// CREAR SOLICITUD CON BENEFICIOS GRATUITOS
router.post('/', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden crear solicitudes'
        });
    }

    const trabajoId = Number(req.body.trabajoId);
    const profesionalId = Number(req.body.profesionalId);

    if (
        !Number.isInteger(trabajoId) ||
        trabajoId <= 0 ||
        !Number.isInteger(profesionalId) ||
        profesionalId <= 0
    ) {
        return res.status(400).json({
            error: 'El trabajo o el profesional no son válidos'
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        // Obtener y bloquear el perfil del cliente.
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

        // Comprobar que el trabajo pertenece al cliente.
        const trabajo = await conexion.query(
            `SELECT t.id, t.estado
             FROM trabajos t
             INNER JOIN clientes c ON c.id = t.cliente_id
             WHERE t.id = $1
               AND c.id = $2
             FOR UPDATE OF t`,
            [trabajoId, clienteId]
        );

        if (trabajo.rows.length === 0) {
            await conexion.query('ROLLBACK');

            return res.status(404).json({
                error: 'No se encontró el trabajo de este cliente'
            });
        }

        // No permitir solicitudes para trabajos cancelados o finalizados.
        if (
            trabajo.rows[0].estado === 'cancelado' ||
            trabajo.rows[0].estado === 'finalizado'
        ) {
            await conexion.query('ROLLBACK');

            return res.status(400).json({
                error: 'Este trabajo ya no admite nuevas solicitudes'
            });
        }

        // Impedir que un cliente se contacte a sí mismo como profesional.
        const propioPerfil = await conexion.query(
            `SELECT id
             FROM profesionales
             WHERE id = $1
               AND usuario_id = $2`,
            [profesionalId, req.usuario.id]
        );

        if (propioPerfil.rows.length > 0) {
            await conexion.query('ROLLBACK');

            return res.status(403).json({
                error: 'No podés contratarte a vos mismo como profesional'
            });
        }

        // Bloquear el profesional para evitar contactos gratuitos duplicados.
        const profesional = await conexion.query(
            `SELECT
                p.id,
                p.autoriza_contacto_whatsapp,
                u.telefono
             FROM profesionales p
             INNER JOIN usuarios u ON u.id = p.usuario_id
             WHERE p.id = $1
               AND p.estado_disponibilidad = TRUE
             FOR UPDATE OF p`,
            [profesionalId]
        );

        if (profesional.rows.length === 0) {
            await conexion.query('ROLLBACK');

            return res.status(404).json({
                error: 'El profesional no existe o no está disponible'
            });
        }

        if (profesional.rows[0].autoriza_contacto_whatsapp !== true) {
            await conexion.query('ROLLBACK');

            return res.status(403).json({
                error: 'Este profesional todavía no autorizó compartir su teléfono por WhatsApp'
            });
        }

        const telefonoWhatsapp = normalizarWhatsappArgentina(
            profesional.rows[0].telefono
        );

        if (!telefonoWhatsapp) {
            await conexion.query('ROLLBACK');

            return res.status(400).json({
                error: 'El teléfono del profesional no tiene un formato celular argentino válido. No se realizó el contacto ni se consumió el beneficio.'
            });
        }

        // Consultar si el profesional es nuevo:
        // 0 trabajos finalizados y 0 calificaciones formales.
        const actividad = await conexion.query(
            `SELECT
                (
                    SELECT COUNT(DISTINCT t.id)
                    FROM solicitudes s
                    INNER JOIN trabajos t
                        ON t.id = s.trabajo_id
                    WHERE s.profesional_id = $1
                      AND t.estado = 'finalizado'
                )::integer AS trabajos_completados,

                (
                    SELECT COUNT(*)
                    FROM calificaciones c
                    WHERE c.profesional_id = $1
                )::integer AS cantidad_calificaciones`,
            [profesionalId]
        );

        const esProfesionalNuevo =
            actividad.rows[0].trabajos_completados === 0 &&
            actividad.rows[0].cantidad_calificaciones === 0;

        // Comprobar si el cliente ya contactó alguna vez a este profesional.
        // También se consideran los contactos históricos.
        const contactoAnterior = await conexion.query(
            `SELECT id
             FROM contactos_work24
             WHERE cliente_id = $1
               AND profesional_id = $2
             LIMIT 1`,
            [clienteId, profesionalId]
        );

        const yaLoContacto = contactoAnterior.rows.length > 0;

        // Consultar y bloquear el beneficio del primer trabajo.
        const beneficio = await conexion.query(
            `SELECT
                trabajo_id,
                contactos_usados,
                activo
             FROM beneficios_primer_trabajo
             WHERE cliente_id = $1
             FOR UPDATE`,
            [clienteId]
        );

        let tipoContacto = '';

        // PRIORIDAD 1: CONTACTO GRATUITO A PROFESIONAL NUEVO.
        if (
            esProfesionalNuevo &&
            !yaLoContacto
        ) {
            const configuracion = await conexion.query(
                `SELECT valor
                 FROM configuracion_work24
                 WHERE clave = 'contacto_profesional_nuevo_habilitado'`
            );

            const habilitado =
                configuracion.rows.length > 0 &&
                configuracion.rows[0].valor === true;

            if (habilitado) {
                tipoContacto = 'profesional_nuevo_gratis';
            }
        }

        // PRIORIDAD 2: PRIMER TRABAJO GRATIS, HASTA 3 CONTACTOS.
        if (!tipoContacto && beneficio.rows.length > 0) {
            const datosBeneficio = beneficio.rows[0];

            const configuracion = await conexion.query(
                `SELECT valor
                 FROM configuracion_work24
                 WHERE clave = 'beneficio_primer_trabajo_habilitado'`
            );

            const habilitado =
                configuracion.rows.length > 0 &&
                configuracion.rows[0].valor === true;

            if (
                habilitado &&
                datosBeneficio.activo &&
                Number(datosBeneficio.trabajo_id) === trabajoId &&
                datosBeneficio.contactos_usados < 3
            ) {
                tipoContacto = 'primer_trabajo_gratis';
            }
        }

        // Durante el lanzamiento no se habilitan contactos pagos.
        if (!tipoContacto) {
            await conexion.query('ROLLBACK');

            return res.status(403).json({
                error:
                    'No tenés contactos gratuitos disponibles para este caso. ' +
                    'Los paquetes pagos todavía no están habilitados durante el lanzamiento.'
            });
        }

        // Crear la solicitud.
        const resultado = await conexion.query(
            `INSERT INTO solicitudes
                (trabajo_id, profesional_id)
             VALUES ($1, $2)
             RETURNING
                id, trabajo_id, profesional_id, estado, fecha_creacion`,
            [trabajoId, profesionalId]
        );

        const solicitud = resultado.rows[0];

        // Registrar el contacto y su beneficio.
        await conexion.query(
            `INSERT INTO contactos_work24 (
                solicitud_id,
                cliente_id,
                profesional_id,
                tipo_contacto,
                beneficio_profesional_nuevo_consumido
             )
             VALUES ($1, $2, $3, $4, $5)`,
            [
                solicitud.id,
                clienteId,
                profesionalId,
                tipoContacto,
                tipoContacto === 'profesional_nuevo_gratis'
            ]
        );

        // Descontar un lugar solamente si se usó el primer trabajo gratis.
        if (tipoContacto === 'primer_trabajo_gratis') {
            await conexion.query(
                `UPDATE beneficios_primer_trabajo
                 SET contactos_usados = contactos_usados + 1,
                     activo = CASE
                         WHEN contactos_usados + 1 >= 3 THEN FALSE
                         ELSE TRUE
                     END
                 WHERE cliente_id = $1
                   AND trabajo_id = $2
                   AND activo = TRUE
                   AND contactos_usados < 3`,
                [clienteId, trabajoId]
            );
        }

        await conexion.query('COMMIT');

        res.status(201).json({
            mensaje: 'Solicitud gratuita creada correctamente',
            solicitud,
            contactoGratis: true,
            tipoContacto,
            requierePago: false,
            telefonoWhatsapp
        });

    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK').catch(() => {});
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Ya existe una solicitud o un contacto registrado para esta operación'
            });
        }

        console.error('Error al crear solicitud:', error);

        res.status(500).json({
            error: 'No se pudo crear la solicitud'
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

module.exports = router;
