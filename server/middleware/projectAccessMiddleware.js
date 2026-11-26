const { canManageProject } = require('../utils/permissions');

// Allows global Admins and project-level Admins of the project in req.params[param]
const authorizeProjectAdmin = (param = 'id') => async (req, res, next) => {
  try {
    if (await canManageProject(req.user, req.params[param])) return next();
    res.status(403).json({ message: 'Access forbidden: requires Admin role on this project' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = authorizeProjectAdmin;
