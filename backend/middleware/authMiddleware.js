const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_super_secreto';

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Token não fornecido.'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({
            success: false,
            message: 'Token mal formatado.'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            success: false,
            message: 'Token mal formatado.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado.'
            });
        }

        req.user = decoded;
        return next();
    });
}

module.exports = authMiddleware;
