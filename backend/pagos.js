
const express = require('express');
const crypto = require('crypto');
const pool = require('./db');
const autenticar = require('./middleware/autenticar');

const router = express.Router();

const MP_API = 'https://api.mercadopago.com';
const MONTO_PRUEBA = Number(process.env.MP_MONTO_SOLICITUD || 5000);

// ==========================================
// CREAR ORDEN DE PAGO
// ==========================================

router.post('/crear', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden realizar pagos'
        });
    }

    const solicitudId = Number(req.body.solicitudId);

    if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
        return res.status(400).json({
            error: 'El identificador de solicitud no es válido'
        });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
        return res.status(500).json({
            error: 'Mercado Pago no está configurado en el servidor'
        });
    }

    if (!Number.isFinite(MONTO_PRUEBA) || MONTO_PRUEBA <= 0) {
        return res.status(500).json({
            error: 'El importe de pago no está configurado correctamente'
        });
    }

    try {
        // Bloquear nuevos cobros durante el lanzamiento
        const configuracionCobros = await pool.query(
            `SELECT valor
             FROM configuracion_work24
             WHERE clave = 'cobros_habilitados'`
        );

        const cobrosHabilitados =
            configuracionCobros.rows.length > 0 &&
            configuracionCobros.rows[0].valor === true;

        if (!cobrosHabilitados) {
            return res.status(403).json({
                error: 'Los cobros están desactivados durante el lanzamiento de Work24'
            });
        }

        // Verificar que la solicitud pertenezca al cliente
        const solicitud = await pool.query(
            `SELECT s.id, s.estado
             FROM solicitudes s
             INNER JOIN trabajos t ON t.id = s.trabajo_id
             INNER JOIN clientes c ON c.id = t.cliente_id
             WHERE s.id = $1
               AND c.usuario_id = $2`,
            [solicitudId, req.usuario.id]
        );

        if (solicitud.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró la solicitud de este cliente'
            });
        }

        if (solicitud.rows[0].estado !== 'pendiente') {
            return res.status(409).json({
                error: 'La solicitud ya no está pendiente'
            });
        }

        // Crear el pago local si todavía no existe
        await pool.query(
            `INSERT INTO pagos (solicitud_id, monto, estado)
             VALUES ($1, $2, 'pendiente')
             ON CONFLICT (solicitud_id) DO NOTHING`,
            [solicitudId, MONTO_PRUEBA]
        );

        const resultadoPago = await pool.query(
            `SELECT id, monto, estado, pago_externo_id
             FROM pagos
             WHERE solicitud_id = $1`,
            [solicitudId]
        );

        const pago = resultadoPago.rows[0];

        if (pago.estado === 'aprobado') {
            return res.status(409).json({
                error: 'Esta solicitud ya tiene un pago aprobado'
            });
        }

        // Recuperar una orden existente
        if (pago.pago_externo_id) {
            const consulta = await fetch(
                `${MP_API}/v1/orders/${encodeURIComponent(pago.pago_externo_id)}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
                    }
                }
            );

            const ordenExistente = await consulta.json();

            if (consulta.ok && ordenExistente.checkout_url) {
                return res.json({
                    mensaje: 'Orden de pago recuperada',
                    pagoId: pago.id,
                    monto: pago.monto,
                    checkoutUrl: ordenExistente.checkout_url
                });
            }

            console.error(
                'Error recuperando orden:',
                JSON.stringify(ordenExistente, null, 2)
            );

            return res.status(502).json({
                error: 'No se pudo recuperar la orden existente de Mercado Pago'
            });
        }

        // Mercado Pago recibe los importes como texto decimal
        const monto = Number(pago.monto).toFixed(2);

        // Clave de idempotencia estable para este pago
        const hash = crypto
            .createHash('sha256')
            .update(`work24-pago-${pago.id}`)
            .digest('hex');

        const claveIdempotencia = [
            hash.slice(0, 8),
            hash.slice(8, 12),
            '5' + hash.slice(13, 16),
            'a' + hash.slice(17, 20),
            hash.slice(20, 32)
        ].join('-');

        // Crear la orden en Mercado Pago
        const respuestaMP = await fetch(`${MP_API}/v1/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': claveIdempotencia
            },
            body: JSON.stringify({
                type: 'online',
                processing_mode: 'manual',
                capture_mode: 'automatic_async',
                total_amount: monto,
                external_reference: `work24-pago-${pago.id}`,
                description: 'Pago de solicitud Work24',
                items: [
                    {
                        title: 'Solicitud de servicio Work24',
                        quantity: 1,
                        unit_price: monto
                    }
                ]
            })
        });

        const orden = await respuestaMP.json();

        if (!respuestaMP.ok) {
            // Mostrar el detalle devuelto por Mercado Pago
            console.error(
                'Mercado Pago rechazó la creación de la orden:',
                JSON.stringify(orden, null, 2)
            );

            return res.status(502).json({
                error: 'Mercado Pago no pudo crear la orden de pago',
                detalle: orden.message || orden.error || 'Error del proveedor'
            });
        }

        if (!orden.id || !orden.checkout_url) {
            console.error(
                'Respuesta incompleta de Mercado Pago:',
                JSON.stringify(orden, null, 2)
            );

            return res.status(502).json({
                error: 'Mercado Pago no devolvió los datos necesarios para pagar'
            });
        }

        // Guardar el identificador de la orden
        await pool.query(
            `UPDATE pagos
             SET pago_externo_id = $1
             WHERE id = $2`,
            [orden.id, pago.id]
        );

        return res.status(201).json({
            mensaje: 'Orden de pago creada correctamente',
            pagoId: pago.id,
            monto: pago.monto,
            checkoutUrl: orden.checkout_url
        });

    } catch (error) {
        console.error('Error al crear pago:', error.message);

        return res.status(500).json({
            error: 'No se pudo crear el pago'
        });
    }
});


// ==========================================
// CONSULTAR ESTADO DEL PAGO
// ==========================================

router.get('/:id/estado', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
            error: 'Solo los clientes pueden consultar sus pagos'
        });
    }

    const pagoId = Number(req.params.id);

    if (!Number.isInteger(pagoId) || pagoId <= 0) {
        return res.status(400).json({
            error: 'El identificador de pago no es válido'
        });
    }

    try {
        const resultado = await pool.query(
            `SELECT p.id, p.monto, p.estado, p.pago_externo_id
             FROM pagos p
             INNER JOIN solicitudes s ON s.id = p.solicitud_id
             INNER JOIN trabajos t ON t.id = s.trabajo_id
             INNER JOIN clientes c ON c.id = t.cliente_id
             WHERE p.id = $1
               AND c.usuario_id = $2`,
            [pagoId, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró el pago'
            });
        }

        const pago = resultado.rows[0];

        if (pago.estado === 'aprobado') {
            return res.json({
                pagoId: pago.id,
                estado: 'aprobado',
                mensaje: 'El pago ya está aprobado'
            });
        }

        if (!pago.pago_externo_id) {
            return res.json({
                pagoId: pago.id,
                estado: pago.estado,
                mensaje: 'Todavía no existe una orden de Mercado Pago'
            });
        }

        const respuestaMP = await fetch(
            `${MP_API}/v1/orders/${encodeURIComponent(pago.pago_externo_id)}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
                }
            }
        );

        const orden = await respuestaMP.json();

        if (!respuestaMP.ok) {
            console.error(
                'Error consultando orden en Mercado Pago:',
                JSON.stringify(orden, null, 2)
            );

            return res.status(502).json({
                error: 'No se pudo consultar el estado en Mercado Pago'
            });
        }

        const montoPagado = Number(orden.total_paid_amount || 0);
        const montoEsperado = Number(pago.monto);

        if (
            orden.status === 'processed' &&
            montoPagado >= montoEsperado
        ) {
            await pool.query(
                `UPDATE pagos
                 SET estado = 'aprobado'
                 WHERE id = $1`,
                [pago.id]
            );

            return res.json({
                pagoId: pago.id,
                estado: 'aprobado',
                mensaje: 'Mercado Pago confirmó el pago'
            });
        }

        return res.json({
            pagoId: pago.id,
            estado: 'pendiente',
            mensaje: 'Mercado Pago todavía no confirmó el pago'
        });

    } catch (error) {
        console.error('Error al consultar pago:', error.message);

        return res.status(500).json({
            error: 'No se pudo consultar el estado del pago'
        });
    }
});

module.exports = router;
