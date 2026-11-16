const express = require('express');

const router = express.Router();

let ultimaConsulta = 0;

router.get('/buscar', async (req, res) => {
    try {
        const consulta = String(req.query.q || '').trim();

        if (consulta.length < 3 || consulta.length > 120) {
            return res.status(400).json({
                error: 'Ingresá una dirección de al menos 3 caracteres'
            });
        }

        const ahora = Date.now();

        if (ahora - ultimaConsulta < 1100) {
            return res.status(429).json({
                error: 'Esperá un segundo antes de realizar otra búsqueda'
            });
        }

        ultimaConsulta = ahora;

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

            return res.status(502).json({
                error: 'El servicio de mapas no pudo realizar la búsqueda'
            });
        }

        const resultados = await respuesta.json();

        res.json(
            resultados.map((lugar) => ({
                nombre: lugar.display_name,
                latitud: Number(lugar.lat),
                longitud: Number(lugar.lon)
            }))
        );
    } catch (error) {
        console.error('Error al buscar ubicación:', error);

        res.status(500).json({
            error: 'No se pudo buscar la dirección'
        });
    }
});

module.exports = router;
