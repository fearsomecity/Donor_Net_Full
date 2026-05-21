const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization') || req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Ensure token can be parsed both when formatted "Bearer <token>" or as raw token
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'donornet_jwt_secret');
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
