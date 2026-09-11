/**
 * Middleware: allow only users with role === 'superadmin'
 * Must be used AFTER authMiddleware so req.userRole is already set.
 */
const superadminMiddleware = (req, res, next) => {
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'Access denied. Superadmin only.' });
  }
  next();
};

module.exports = { superadminMiddleware };
