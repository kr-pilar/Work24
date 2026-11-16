const express = require('express');
const pool = require('./db');

const router = express.Router();

const VIGENCIA_CACHE_DIAS = 30;
const INTERVALO_CONSULTAS_MS = 1100;

function normalizarConsulta(consulta) {
    return consulta
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-AR')
        .replace(/\s+/g, ' ')
        .trim();
}

async function consultarCache(consultaNormalizada) {
    const resultado = await pool.query(
        `SELECT resultados
         FROM public.cache_ubicaciones
         WHERE consulta_normalizada = $1
           AND vence_en > CURRENT_TIMESTAMP`,
        [consultaNormalizada]
    );

    return resultado.rows.length > 0
        ? resultado.rows[0].resultados
        : null;
}

async function reservarConsulta() {
    const reserva = await pool.query(
        `UPDATE public.control_consultas_ubicaciones
         SET proxima_consulta_en =
             clock_timestamp() + ($1 * INTERVAL '1 millisecond')
         WHERE id = 1
           AND proxima_consulta_en <= clock_timestamp()
         RETURNING id`,
        [INTERVALO_CONSULTAS_MS]
    );

    return reserva.rows.length > 0;
}

async function obtenerEspera() {
    const resultado = await pool.query(
        `SELECT GREATEST(
            1,
            CEIL(EXTRACT(
                EPOCH FROM (
                    proxima_consulta_en - clock_timestamp()
                )
            ))
        )::INTEGER AS segundos
         FROM public.control_consultas_ubicaciones
         WHERE id = 1`
    );

    return resultado.rows[0]?.segundos || 1;
}

async function guardarCache(consultaNormalizada, consulta, resultados) {
    await pool.query(
        `INSERT INTO public.cache_ubicaciones (
            consulta_normalizada,
            consulta_original,
            resultados,
            creado_en,
            vence_en
        )
        VALUES (
            $1,
            $2,
            $3::JSONB,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP + ($4 * INTERVAL '1 day')
        )
        ON CONFLICT (consulta_normalizada)
        DO UPDATE SET
            consulta_original = EXCLUDED.consulta_original,
            resultados = EXCLUDED.resultados,
            creado_en = CURRENT_TIMESTAMP,
            vence_en = CURRENT_TIMESTAMP + ($4 * INTERVAL '1 day')`,
        [
            consultaNormalizada,
            consulta,
            JSON.stringify(resultados),
            VIGENCIA_CACHE_DIAS
        ]
    );
}

router.get('/buscar', async (req, res) => {
    try {
        const consulta = String(req.query.q || '').trim();

        if (consulta.length < 3 || consulta.length > 120) {
            return res.status(400).json({
                error: 'Ingresá una dirección de al menos 3 caracteres'
            });
        }

        const consultaNormalizada = normalizarConsulta(consulta);

        // Primera comprobación: evitar consultar al proveedor si hay caché.
        const resultadosCache = await consultarCache(
            consultaNormalizada
        );

        if (resultadosCache !== null) {
            return res.json(resultadosCache);
        }

        // Reserva atómica compartida entre todas las instancias.
        const reserva = await reservarConsulta();

        if (!reserva) {
            // Una búsqueda concurrente podría haber guardado el resultado.
            const cacheActualizada = await consultarCache(
                consultaNormalizada
            );

            if (cacheActualizada !== null) {
                return res.json(cacheActualizada);
            }

            const espera = await obtenerEspera();

            res.set('Retry-After', String(espera));

            return res.status(429).json({
                error: `Hay otra búsqueda en curso. Esperá ${espera} segundo(s) e intentá nuevamente.`
            });
        }

        // Segunda comprobación para evitar consultas duplicadas.
        const cachePosterior = await consultarCache(
            consultaNormalizada
        );

        if (cachePosterior !== null) {
            return res.json(cachePosterior);
        }

        const parametros = new URLSearchParams({
            q: consulta,
            format: 'jsonv2',
            limit: '5',
            addressdetails: '1',
            countrycodes: 'ar'
        });

        const respuesta = await fetch(
            `https://nominatim.openstreetmap.org/search?${parametros}`,
            {
                headers: {
                    'User-Agent': 'Work24/1.0 (aplicacion de servicios)',
                    'Accept-Language': 'es'
                },
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!respuesta.ok) {
            const detalle = await respuesta.text();

            console.error(
                'Error de Nominatim:',
                'HTTP', respuesta.status,
                detalle.slice(0, 300)
            );

            if (respuesta.status === 429) {
                const esperaProveedor =
                    respuesta.headers.get('retry-after');

                if (esperaProveedor) {
                    res.set('Retry-After', esperaProveedor);
                }

                return res.status(503).json({
                    error: 'El servicio de mapas está temporalmente saturado. Intentá nuevamente más tarde.'
                });
            }

            return res.status(502).json({
                error: 'El servicio de mapas no pudo realizar la búsqueda'
            });
        }

        const lugares = await respuesta.json();

        const resultados = lugares.map((lugar) => ({
            nombre: lugar.display_name,
            latitud: Number(lugar.lat),
            longitud: Number(lugar.lon)
        }));

        if (resultados.some((lugar) =>
            !Number.isFinite(lugar.latitud) ||
            !Number.isFinite(lugar.longitud)
        )) {
            throw new Error('Nominatim devolvió coordenadas inválidas');
        }

        // Si falla la caché, no impedimos devolver la búsqueda exitosa.
        try {
            await guardarCache(
                consultaNormalizada,
                consulta,
                resultados
            );
        } catch (errorCache) {
            console.error(
                'No se pudo guardar la caché de ubicaciones:',
                errorCache.message
            );
        }

        return res.json(resultados);

    } catch (error) {
        console.error('Error al buscar ubicación:', error);

        return res.status(500).json({
            error: 'No se pudo buscar la dirección'
        });
    }
});

module.exports = router;
