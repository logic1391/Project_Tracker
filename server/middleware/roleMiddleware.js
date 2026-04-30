const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: `Access forbidden: Requires ${role} role` });
    }
  };
};

module.exports = authorizeRole;
