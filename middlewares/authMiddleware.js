const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token mal formatado' });
    }

    const token = parts[1];


    try {
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        reject({ status: 401, message: 'Token expirado' });
                    } else if (err.name === 'JsonWebTokenError') {
                        reject({ status: 401, message: 'Token inválido' });
                    } else {
                        reject({ status: 500, message: 'Erro ao verificar token' });
                    }
                } else {
                    resolve(decoded);
                }
            });
        });

        req.user = { id: decoded.userId, role: decoded.cargo };
        next();
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};
