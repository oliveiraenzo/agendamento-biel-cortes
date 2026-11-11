const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'biel_barber_jwt_super_secret_key_2026';

/**
 * Middleware para proteger rotas administrativas
 * Exige cabeçalho: Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido. Use "Bearer <token>".' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expirado ou inválido. Faça login novamente.' });
  }
};

module.exports = {
  authMiddleware,
  JWT_SECRET
};
