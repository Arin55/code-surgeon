const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (e) {
    return res.status(401).json({ msg: 'Token invalid' });
  }
}

function admin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ msg: 'Admin access required' });
}

function optionalAuth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
  } catch (e) {
    // ignore invalid token for optional auth
  }
  next();
}

module.exports = { auth, admin, optionalAuth };
