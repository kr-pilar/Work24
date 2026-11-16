const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('./db');
const autenticar = require('./middleware/autenticar');

const router = express.Router();

const clienteGoogle = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// FUNCIONES AUXILIARES

function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

function generarToken(usuario) {
    return jwt.sign(
        {
            tipo: usuario.tipo
        },
        process.env.JWT_SECRET,
        {
            subject: String(usuario.id),
            expiresIn: '7d'
        }
    );
}

function generarTokenRegistroGoogle(datos) {
    return jwt.sign(
        {
            purpose: 'google_registration',
            google_sub: datos.google_sub,
            email: datos.email,
            nombre: datos.nombre,
            apellido: datos.apellido,
            tipo: datos.tipo
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '15m'
        }
    );
}

function verificarTokenRegistroGoogle(token, tipoEsperado) {
    const datos = jwt.verify(token, process.env.JWT_SECRET);

    if (
        datos.purpose !== 'google_registration' ||
        datos.tipo !== tipoEsperado ||
        !datos.google_sub ||
        !datos.email ||
        !datos.nombre ||
        !datos.apellido
    ) {
        throw new Error('Token de registro Google inválido');
    }

    return datos;
}

// VALIDAR PROFESIONES

function prepararProfesiones(profesiones) {
    if (!Array.isArray(profesiones) || profesiones.length === 0) {
        throw new Error('Debés seleccionar al menos una profesión');
    }

    const profesionesPreparadas = [];
    const nombresProfesiones = new Set();

    for (const item of profesiones) {
        const profesion = texto(item.profesion);
        const tieneMatricula = item.tieneMatricula === true;
        const matricula = texto(item.matricula);

        if (!profesion || profesion.length > 100) {
            throw new Error(
                'Hay una profesión vacía o demasiado extensa'
            );
        }

        const nombreNormalizado = profesion.toLowerCase();

        if (nombresProfesiones.has(nombreNormalizado)) {
            throw new Error('No podés repetir una profesión');
        }

        nombresProfesiones.add(nombreNormalizado);

        if (tieneMatricula && !matricula) {
            throw new Error(
                `Debés indicar la matrícula de ${profesion}`
            );
        }

        if (matricula.length > 100) {
            throw new Error(
                'La matrícula supera el límite permitido'
            );
        }

        profesionesPreparadas.push({
            profesion,
            tieneMatricula,
            matricula: tieneMatricula ? matricula : null
        });
    }

    return profesionesPreparadas;
}

// REGISTRO DE CLIENTES

router.post('/registro-cliente', async (req, res) => {
    const nombre = texto(req.body.nombre);
    const apellido = texto(req.body.apellido);
    const dni = texto(req.body.dni);
    const email = texto(req.body.email).toLowerCase();
    const telefono = texto(req.body.telefono);

    const contrasena =
        typeof req.body.contrasena === 'string'
            ? req.body.contrasena
            : '';

    if (!nombre || !apellido || !dni || !email || !telefono || !contrasena) {
        return res.status(400).json({
            error: 'Todos los campos son obligatorios'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            error: 'El correo electrónico no es válido'
        });
    }

    if (contrasena.length < 8) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    if (
        nombre.length > 100 ||
        apellido.length > 100 ||
        dni.length > 20 ||
        email.length > 150 ||
        telefono.length > 30
    ) {
        return res.status(400).json({
            error: 'Uno o más campos superan el límite permitido'
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const passwordHash = await bcrypt.hash(contrasena, 12);

        const resultadoUsuario = await conexion.query(
            `INSERT INTO usuarios
                (nombre, apellido, dni, email, telefono, password_hash, tipo)
             VALUES ($1, $2, $3, $4, $5, $6, 'cliente')
             RETURNING id, nombre, apellido, dni, email, telefono, tipo`,
            [nombre, apellido, dni, email, telefono, passwordHash]
        );

        const usuario = resultadoUsuario.rows[0];

        const resultadoCliente = await conexion.query(
            `INSERT INTO clientes (usuario_id)
             VALUES ($1)
             RETURNING id`,
            [usuario.id]
        );

        await conexion.query('COMMIT');

        const token = generarToken(usuario);

        res.status(201).json({
            mensaje: 'Cliente registrado correctamente',
            token,
            usuario: {
                ...usuario,
                cliente_id: resultadoCliente.rows[0].id
            }
        });
    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK');
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'El DNI o el correo electrónico ya están registrados'
            });
        }

        console.error('Error al registrar cliente:', error);

        res.status(500).json({
            error: 'No se pudo registrar el cliente'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

// REGISTRO DE PROFESIONALES

router.post('/registro-profesional', async (req, res) => {
    const nombre = texto(req.body.nombre);
    const apellido = texto(req.body.apellido);
    const dni = texto(req.body.dni);
    const email = texto(req.body.email).toLowerCase();
    const telefono = texto(req.body.telefono);

    const contrasena =
        typeof req.body.contrasena === 'string'
            ? req.body.contrasena
            : '';

    const descripcion = texto(req.body.descripcion);
    const ubicacionHabitual = texto(req.body.ubicacionHabitual);

    const coordenadasPresentes =
        req.body.latitudHabitual !== null &&
        req.body.latitudHabitual !== undefined &&
        req.body.latitudHabitual !== '' &&
        req.body.longitudHabitual !== null &&
        req.body.longitudHabitual !== undefined &&
        req.body.longitudHabitual !== '';

    const latitudHabitual = Number(req.body.latitudHabitual);
    const longitudHabitual = Number(req.body.longitudHabitual);

    if (req.body.autorizaContactoWhatsapp !== true) {
        return res.status(400).json({
            error: 'Debés autorizar el contacto por WhatsApp para crear una cuenta profesional'
        });
    }

    if (!nombre || !apellido || !dni || !email || !telefono || !contrasena) {
        return res.status(400).json({
            error: 'Todos los campos personales son obligatorios'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            error: 'El correo electrónico no es válido'
        });
    }

    if (contrasena.length < 8) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    if (
        nombre.length > 100 ||
        apellido.length > 100 ||
        dni.length > 20 ||
        email.length > 150 ||
        telefono.length > 30
    ) {
        return res.status(400).json({
            error: 'Uno o más campos personales superan el límite permitido'
        });
    }

    if (descripcion.length > 10000) {
        return res.status(400).json({
            error: 'La descripción es demasiado extensa'
        });
    }

    if (
        !ubicacionHabitual ||
        !coordenadasPresentes ||
        !Number.isFinite(latitudHabitual) ||
        !Number.isFinite(longitudHabitual) ||
        latitudHabitual < -90 ||
        latitudHabitual > 90 ||
        longitudHabitual < -180 ||
        longitudHabitual > 180
    ) {
        return res.status(400).json({
            error: 'Debés seleccionar un lugar habitual de trabajo válido en el mapa'
        });
    }

    let profesionesPreparadas;

    try {
        profesionesPreparadas = prepararProfesiones(req.body.profesiones);
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const passwordHash = await bcrypt.hash(contrasena, 12);

        const resultadoUsuario = await conexion.query(
            `INSERT INTO usuarios
                (nombre, apellido, dni, email, telefono, password_hash, tipo)
             VALUES ($1, $2, $3, $4, $5, $6, 'profesional')
             RETURNING id, nombre, apellido, dni, email, telefono, tipo`,
            [nombre, apellido, dni, email, telefono, passwordHash]
        );

        const usuario = resultadoUsuario.rows[0];

        const resultadoProfesional = await conexion.query(
            `INSERT INTO profesionales (
                usuario_id,
                descripcion,
                autoriza_contacto_whatsapp,
                fecha_autorizacion_whatsapp,
                ubicacion_habitual,
                latitud_habitual,
                longitud_habitual
             )
             VALUES ($1, $2, TRUE, NOW(), $3, $4, $5)
             RETURNING id`,
            [
                usuario.id,
                descripcion || null,
                ubicacionHabitual,
                latitudHabitual,
                longitudHabitual
            ]
        );

        const profesionalId = resultadoProfesional.rows[0].id;

        for (const item of profesionesPreparadas) {
            const resultadoProfesion = await conexion.query(
                `INSERT INTO profesiones (nombre)
                 VALUES ($1)
                 ON CONFLICT (nombre)
                 DO UPDATE SET nombre = EXCLUDED.nombre
                 RETURNING id`,
                [item.profesion]
            );

            const profesionId = resultadoProfesion.rows[0].id;

            await conexion.query(
                `INSERT INTO profesional_profesion
                    (profesional_id, profesion_id, tiene_matricula, matricula)
                 VALUES ($1, $2, $3, $4)`,
                [
                    profesionalId,
                    profesionId,
                    item.tieneMatricula,
                    item.matricula
                ]
            );
        }

        await conexion.query('COMMIT');

        const token = generarToken(usuario);

        res.status(201).json({
            mensaje: 'Profesional registrado correctamente',
            token,
            usuario: {
                ...usuario,
                profesional_id: profesionalId
            }
        });
    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK');
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'El DNI o el correo electrónico ya están registrados'
            });
        }

        console.error('Error al registrar profesional:', error);

        res.status(500).json({
            error: 'No se pudo registrar el profesional'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

// INICIO DE SESIÓN TRADICIONAL

router.post('/login', async (req, res) => {
    const email = texto(req.body.email).toLowerCase();

    const contrasena =
        typeof req.body.contrasena === 'string'
            ? req.body.contrasena
            : '';

    const tipo = texto(req.body.tipo);

    if (!email || !contrasena) {
        return res.status(400).json({
            error: 'Ingresá tu correo y contraseña'
        });
    }

    if (!['cliente', 'profesional'].includes(tipo)) {
        return res.status(400).json({
            error: 'El tipo de usuario no es válido'
        });
    }

    try {
        const resultado = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.dni,
                u.email,
                u.telefono,
                u.tipo,
                u.password_hash,
                u.proveedor_login,
                c.id AS cliente_id,
                p.id AS profesional_id
             FROM usuarios u
             LEFT JOIN clientes c ON c.usuario_id = u.id
             LEFT JOIN profesionales p ON p.usuario_id = u.id
             WHERE LOWER(u.email) = LOWER($1)
               AND u.tipo = $2`,
            [email, tipo]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                error: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = resultado.rows[0];

        if (
            usuario.proveedor_login !== 'local' ||
            !usuario.password_hash
        ) {
            return res.status(401).json({
                error: 'Esta cuenta no utiliza inicio de sesión con contraseña'
            });
        }

        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuario.password_hash
        );

        if (!contrasenaValida) {
            return res.status(401).json({
                error: 'Correo o contraseña incorrectos'
            });
        }

        delete usuario.password_hash;
        delete usuario.proveedor_login;

        const token = generarToken(usuario);

        res.json({
            mensaje: 'Inicio de sesión correcto',
            token,
            usuario
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);

        res.status(500).json({
            error: 'No se pudo iniciar sesión'
        });
    }
});

// INICIO DE SESIÓN Y VALIDACIÓN CON GOOGLE

router.post('/google', async (req, res) => {
    const idToken = texto(req.body.idToken);
    const tipo = texto(req.body.tipo);

    if (!idToken || !['cliente', 'profesional'].includes(tipo)) {
        return res.status(400).json({
            error: 'Falta el token de Google o el tipo de usuario no es válido'
        });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({
            error: 'La autenticación con Google no está configurada'
        });
    }

    let datosGoogle;

    try {
        const ticket = await clienteGoogle.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        datosGoogle = ticket.getPayload();

        if (
            !datosGoogle ||
            !datosGoogle.sub ||
            !datosGoogle.email ||
            datosGoogle.email_verified !== true
        ) {
            return res.status(401).json({
                error: 'La cuenta de Google no pudo ser verificada'
            });
        }
    } catch (error) {
        console.error('Error al verificar token Google:', error);

        return res.status(401).json({
            error: 'El token de Google es inválido o venció'
        });
    }

    const googleSub = datosGoogle.sub;
    const email = texto(datosGoogle.email).toLowerCase();

    const nombreCompleto = texto(datosGoogle.name).split(/\s+/);

    const nombre =
        texto(datosGoogle.given_name) ||
        nombreCompleto[0] ||
        '';

    const apellido =
        texto(datosGoogle.family_name) ||
        nombreCompleto.slice(1).join(' ');

    if (!nombre || !apellido) {
        return res.status(400).json({
            error: 'Tu cuenta de Google no proporciona nombre y apellido'
        });
    }

    try {
        // Buscar una cuenta Google existente

                // Buscar una cuenta Google existente según su identidad y tipo

        const resultadoGoogle = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.dni,
                u.email,
                u.telefono,
                u.tipo,
                c.id AS cliente_id,
                p.id AS profesional_id
             FROM usuarios u
             LEFT JOIN clientes c ON c.usuario_id = u.id
             LEFT JOIN profesionales p ON p.usuario_id = u.id
             WHERE u.google_sub = $1
               AND u.tipo = $2`,
            [googleSub, tipo]
        );

        if (resultadoGoogle.rows.length > 0) {
            const usuario = resultadoGoogle.rows[0];

            const token = generarToken(usuario);

            return res.json({
                mensaje: 'Inicio de sesión con Google correcto',
                token,
                usuario
            });
        }

        // No vincular automáticamente cuentas locales.
        // Comprobar el correo solamente para el mismo tipo de cuenta.

        const resultadoEmail = await pool.query(
            `SELECT id
             FROM usuarios
             WHERE LOWER(email) = LOWER($1)
               AND tipo = $2`,
            [email, tipo]
        );

        if (resultadoEmail.rows.length > 0) {
            return res.status(409).json({
                error: 'Ya existe una cuenta con este correo. Iniciá sesión con tu método habitual.'
            });
        }


        // Cuenta nueva: solicitar completar el registro

        const onboardingToken = generarTokenRegistroGoogle({
            google_sub: googleSub,
            email,
            nombre,
            apellido,
            tipo
        });

        return res.json({
            requiereRegistro: true,
            onboardingToken,
            datosGoogle: {
                nombre,
                apellido,
                email
            }
        });
    } catch (error) {
        console.error('Error en autenticación Google:', error);

        return res.status(500).json({
            error: 'No se pudo completar la autenticación con Google'
        });
    }
});

// COMPLETAR REGISTRO GOOGLE - CLIENTES

router.post('/google/registro-cliente', async (req, res) => {
    const onboardingToken = texto(req.body.onboardingToken);
    const dni = texto(req.body.dni);
    const telefono = texto(req.body.telefono);

    if (!onboardingToken || !dni || !telefono) {
        return res.status(400).json({
            error: 'Debés completar el DNI y el teléfono'
        });
    }

    if (dni.length > 20 || telefono.length > 30) {
        return res.status(400).json({
            error: 'El DNI o el teléfono superan el límite permitido'
        });
    }

    let datos;

    try {
        datos = verificarTokenRegistroGoogle(
            onboardingToken,
            'cliente'
        );
    } catch (error) {
        return res.status(401).json({
            error: 'El registro de Google venció o no es válido. Volvé a iniciar sesión con Google.'
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const resultadoUsuario = await conexion.query(
            `INSERT INTO usuarios
                (nombre, apellido, dni, email, telefono,
                 tipo, proveedor_login, google_sub, identidad_estado)
             VALUES ($1, $2, $3, $4, $5,
                     'cliente', 'google', $6, 'pendiente')
             RETURNING id, nombre, apellido, dni, email, telefono, tipo`,
            [
                datos.nombre,
                datos.apellido,
                dni,
                datos.email,
                telefono,
                datos.google_sub
            ]
        );

        const usuario = resultadoUsuario.rows[0];

        const resultadoCliente = await conexion.query(
            `INSERT INTO clientes (usuario_id)
             VALUES ($1)
             RETURNING id`,
            [usuario.id]
        );

        await conexion.query('COMMIT');

        const token = generarToken(usuario);

        return res.status(201).json({
            mensaje: 'Cliente registrado correctamente con Google',
            token,
            usuario: {
                ...usuario,
                cliente_id: resultadoCliente.rows[0].id
            }
        });
    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK');
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'El DNI o el correo electrónico ya están registrados'
            });
        }

        console.error('Error al completar registro Google cliente:', error);

        return res.status(500).json({
            error: 'No se pudo completar el registro del cliente'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

// COMPLETAR REGISTRO GOOGLE - PROFESIONALES

router.post('/google/registro-profesional', async (req, res) => {
    const onboardingToken = texto(req.body.onboardingToken);
    const dni = texto(req.body.dni);
    const telefono = texto(req.body.telefono);
    const descripcion = texto(req.body.descripcion);
    const ubicacionHabitual = texto(req.body.ubicacionHabitual);

    const coordenadasPresentes =
        req.body.latitudHabitual !== null &&
        req.body.latitudHabitual !== undefined &&
        req.body.latitudHabitual !== '' &&
        req.body.longitudHabitual !== null &&
        req.body.longitudHabitual !== undefined &&
        req.body.longitudHabitual !== '';

    const latitudHabitual = Number(req.body.latitudHabitual);
    const longitudHabitual = Number(req.body.longitudHabitual);

    if (req.body.autorizaContactoWhatsapp !== true) {
        return res.status(400).json({
            error: 'Debés autorizar el contacto por WhatsApp para crear una cuenta profesional'
        });
    }

    if (!onboardingToken || !dni || !telefono) {
        return res.status(400).json({
            error: 'Debés completar el DNI y el teléfono'
        });
    }

    if (dni.length > 20 || telefono.length > 30) {
        return res.status(400).json({
            error: 'El DNI o el teléfono superan el límite permitido'
        });
    }

    if (descripcion.length > 10000) {
        return res.status(400).json({
            error: 'La descripción es demasiado extensa'
        });
    }

    if (
        !ubicacionHabitual ||
        !coordenadasPresentes ||
        !Number.isFinite(latitudHabitual) ||
        !Number.isFinite(longitudHabitual) ||
        latitudHabitual < -90 ||
        latitudHabitual > 90 ||
        longitudHabitual < -180 ||
        longitudHabitual > 180
    ) {
        return res.status(400).json({
            error: 'Debés seleccionar un lugar habitual de trabajo válido en el mapa'
        });
    }

    let datos;

    try {
        datos = verificarTokenRegistroGoogle(
            onboardingToken,
            'profesional'
        );
    } catch (error) {
        return res.status(401).json({
            error: 'El registro de Google venció o no es válido. Volvé a iniciar sesión con Google.'
        });
    }

    let profesionesPreparadas;

    try {
        profesionesPreparadas = prepararProfesiones(req.body.profesiones);
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const resultadoUsuario = await conexion.query(
            `INSERT INTO usuarios
                (nombre, apellido, dni, email, telefono,
                 tipo, proveedor_login, google_sub, identidad_estado)
             VALUES ($1, $2, $3, $4, $5,
                     'profesional', 'google', $6, 'pendiente')
             RETURNING id, nombre, apellido, dni, email, telefono, tipo`,
            [
                datos.nombre,
                datos.apellido,
                dni,
                datos.email,
                telefono,
                datos.google_sub
            ]
        );

        const usuario = resultadoUsuario.rows[0];

        const resultadoProfesional = await conexion.query(
            `INSERT INTO profesionales (
                usuario_id,
                descripcion,
                autoriza_contacto_whatsapp,
                fecha_autorizacion_whatsapp,
                ubicacion_habitual,
                latitud_habitual,
                longitud_habitual
             )
             VALUES ($1, $2, TRUE, NOW(), $3, $4, $5)
             RETURNING id`,
            [
                usuario.id,
                descripcion || null,
                ubicacionHabitual,
                latitudHabitual,
                longitudHabitual
            ]
        );

        const profesionalId = resultadoProfesional.rows[0].id;

        for (const item of profesionesPreparadas) {
            const resultadoProfesion = await conexion.query(
                `INSERT INTO profesiones (nombre)
                 VALUES ($1)
                 ON CONFLICT (nombre)
                 DO UPDATE SET nombre = EXCLUDED.nombre
                 RETURNING id`,
                [item.profesion]
            );

            const profesionId = resultadoProfesion.rows[0].id;

            await conexion.query(
                `INSERT INTO profesional_profesion
                    (profesional_id, profesion_id, tiene_matricula, matricula)
                 VALUES ($1, $2, $3, $4)`,
                [
                    profesionalId,
                    profesionId,
                    item.tieneMatricula,
                    item.matricula
                ]
            );
        }

        await conexion.query('COMMIT');

        const token = generarToken(usuario);

        return res.status(201).json({
            mensaje: 'Profesional registrado correctamente con Google',
            token,
            usuario: {
                ...usuario,
                profesional_id: profesionalId
            }
        });
    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK');
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'El DNI o el correo electrónico ya están registrados'
            });
        }

        console.error('Error al completar registro Google profesional:', error);

        return res.status(500).json({
            error: 'No se pudo completar el registro del profesional'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

// OBTENER PERFIL DEL USUARIO AUTENTICADO

router.get('/perfil', autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.dni,
                u.email,
                u.telefono,
                u.tipo,
                c.id AS cliente_id,
                p.id AS profesional_id,
                p.descripcion,
                p.ubicacion_habitual,
                p.latitud_habitual,
                p.longitud_habitual,
                p.estado_disponibilidad,
                p.autoriza_contacto_whatsapp,
                p.fecha_autorizacion_whatsapp,
                pr.nombre AS profesion,
                pp.tiene_matricula,
                pp.matricula
             FROM usuarios u
             LEFT JOIN clientes c ON c.usuario_id = u.id
             LEFT JOIN profesionales p ON p.usuario_id = u.id
             LEFT JOIN profesional_profesion pp
                ON pp.profesional_id = p.id
             LEFT JOIN profesiones pr
                ON pr.id = pp.profesion_id
             WHERE u.id = $1
             ORDER BY pr.nombre`,
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró el usuario'
            });
        }

        const primeraFila = resultado.rows[0];

        const usuario = {
            id: primeraFila.id,
            nombre: primeraFila.nombre,
            apellido: primeraFila.apellido,
            dni: primeraFila.dni,
            email: primeraFila.email,
            telefono: primeraFila.telefono,
            tipo: primeraFila.tipo
        };

        if (usuario.tipo === 'cliente') {
            usuario.cliente_id = primeraFila.cliente_id;
        }

        if (usuario.tipo === 'profesional') {
            usuario.profesional_id = primeraFila.profesional_id;
            usuario.descripcion = primeraFila.descripcion;
            usuario.ubicacion_habitual = primeraFila.ubicacion_habitual;
            usuario.latitud_habitual = primeraFila.latitud_habitual;
            usuario.longitud_habitual = primeraFila.longitud_habitual;
            usuario.estado_disponibilidad =
                primeraFila.estado_disponibilidad;
            usuario.autoriza_contacto_whatsapp =
                primeraFila.autoriza_contacto_whatsapp;
            usuario.fecha_autorizacion_whatsapp =
                primeraFila.fecha_autorizacion_whatsapp;

            usuario.profesiones = resultado.rows
                .filter(fila => fila.profesion !== null)
                .map(fila => ({
                    profesion: fila.profesion,
                    tieneMatricula: fila.tiene_matricula,
                    matricula: fila.matricula
                }));
        }

        res.json({ usuario });
    } catch (error) {
        console.error('Error al obtener perfil:', error);

        res.status(500).json({
            error: 'No se pudo obtener el perfil'
        });
    }
});


// ACTUALIZAR PERFIL PROPIO DEL PROFESIONAL

router.put('/perfil-profesional', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'profesional') {
        return res.status(403).json({
            error: 'Solo los profesionales pueden modificar este perfil'
        });
    }

    const telefono = texto(req.body.telefono);
    const descripcion = texto(req.body.descripcion);
    const ubicacionHabitual = texto(req.body.ubicacionHabitual);

    const coordenadasPresentes =
        req.body.latitudHabitual !== null &&
        req.body.latitudHabitual !== undefined &&
        req.body.latitudHabitual !== '' &&
        req.body.longitudHabitual !== null &&
        req.body.longitudHabitual !== undefined &&
        req.body.longitudHabitual !== '';

    const latitudHabitual = Number(req.body.latitudHabitual);
    const longitudHabitual = Number(req.body.longitudHabitual);

    if (!telefono || telefono.length > 30) {
        return res.status(400).json({
            error: 'Ingresá un teléfono válido'
        });
    }

    if (descripcion.length > 10000) {
        return res.status(400).json({
            error: 'La descripción supera el límite permitido'
        });
    }

    if (!ubicacionHabitual) {
        return res.status(400).json({
            error: 'Debés seleccionar tu ubicación habitual en el mapa'
        });
    }

    if (
        !coordenadasPresentes ||
        !Number.isFinite(latitudHabitual) ||
        latitudHabitual < -90 ||
        latitudHabitual > 90 ||
        !Number.isFinite(longitudHabitual) ||
        longitudHabitual < -180 ||
        longitudHabitual > 180
    ) {
        return res.status(400).json({
            error: 'Las coordenadas de la ubicación no son válidas'
        });
    }

    let profesionesPreparadas;

    try {
        profesionesPreparadas = prepararProfesiones(req.body.profesiones);
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    let conexion;

    try {
        conexion = await pool.connect();
        await conexion.query('BEGIN');

        const resultadoProfesional = await conexion.query(
            `SELECT id
             FROM profesionales
             WHERE usuario_id = $1
             FOR UPDATE`,
            [req.usuario.id]
        );

        if (resultadoProfesional.rows.length === 0) {
            await conexion.query('ROLLBACK');

            return res.status(404).json({
                error: 'No se encontró el perfil profesional'
            });
        }

        const profesionalId = resultadoProfesional.rows[0].id;

        await conexion.query(
            `UPDATE usuarios
             SET telefono = $1
             WHERE id = $2`,
            [telefono, req.usuario.id]
        );

        await conexion.query(
            `UPDATE profesionales
             SET descripcion = $1,
                 ubicacion_habitual = $2,
                 latitud_habitual = $3,
                 longitud_habitual = $4
             WHERE id = $5`,
            [
                descripcion || null,
                ubicacionHabitual,
                latitudHabitual,
                longitudHabitual,
                profesionalId
            ]
        );

        await conexion.query(
            `DELETE FROM profesional_profesion
             WHERE profesional_id = $1`,
            [profesionalId]
        );

        for (const item of profesionesPreparadas) {
            const resultadoProfesion = await conexion.query(
                `INSERT INTO profesiones (nombre)
                 VALUES ($1)
                 ON CONFLICT (nombre)
                 DO UPDATE SET nombre = EXCLUDED.nombre
                 RETURNING id`,
                [item.profesion]
            );

            const profesionId = resultadoProfesion.rows[0].id;

            await conexion.query(
                `INSERT INTO profesional_profesion
                    (profesional_id, profesion_id, tiene_matricula, matricula)
                 VALUES ($1, $2, $3, $4)`,
                [
                    profesionalId,
                    profesionId,
                    item.tieneMatricula,
                    item.matricula
                ]
            );
        }

        await conexion.query('COMMIT');

        return res.json({
            mensaje: 'Perfil profesional actualizado correctamente'
        });
    } catch (error) {
        if (conexion) {
            await conexion.query('ROLLBACK');
        }

        console.error('Error al actualizar perfil profesional:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Ya existe un registro con esos datos'
            });
        }

        return res.status(500).json({
            error: 'No se pudo actualizar el perfil profesional'
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

// ACTIVAR O REVOCAR AUTORIZACIÓN PARA CONTACTO POR WHATSAPP

router.patch('/contacto-whatsapp', autenticar, async (req, res) => {
    if (req.usuario.tipo !== 'profesional') {
        return res.status(403).json({
            error: 'Solo los profesionales pueden modificar esta autorización'
        });
    }

    const autoriza = req.body.autorizaContactoWhatsapp;

    if (typeof autoriza !== 'boolean') {
        return res.status(400).json({
            error: 'El valor de autorización no es válido'
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE profesionales
             SET autoriza_contacto_whatsapp = $1,
                 fecha_autorizacion_whatsapp =
                    CASE WHEN $1 THEN NOW() ELSE NULL END
             WHERE usuario_id = $2
             RETURNING autoriza_contacto_whatsapp,
                       fecha_autorizacion_whatsapp`,
            [autoriza, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró el perfil profesional'
            });
        }

        return res.json({
            mensaje: autoriza
                ? 'Autorización activada correctamente'
                : 'Autorización revocada correctamente',
            ...resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al modificar autorización WhatsApp:', error);

        return res.status(500).json({
            error: 'No se pudo modificar la autorización'
        });
    }
});

module.exports = router;
