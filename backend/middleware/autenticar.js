const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Debés iniciar sesión para acceder'
        });
    }

    const token = autorizacion.split(' ')[1];

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = {
            id: Number(datos.sub),
            tipo: datos.tipo
        };

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'El token es inválido o venció'
        });
    }
}

module.exports = autenticar;
