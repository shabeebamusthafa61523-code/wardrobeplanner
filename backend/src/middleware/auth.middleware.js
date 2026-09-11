const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wardrobedetect_secret_key_2026';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const userIdHeader = req.headers['user-id'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role || 'user';
        req.user = decoded;
        return next();
      } catch (err) {
        // Token expired or invalid - fall through to header/default
      }
    }
  }

  if (userIdHeader && userIdHeader !== 'undefined' && userIdHeader !== 'null' && userIdHeader.trim() !== '') {
    req.userId = userIdHeader;
    return next();
  }

  req.userId = 'default-user';
  next();
};

module.exports = {
  authMiddleware,
  JWT_SECRET,
};
