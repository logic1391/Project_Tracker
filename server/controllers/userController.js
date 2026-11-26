const { User, Task, ProjectMember, sequelize } = require('../models');
const { USER_ROLES } = require('../utils/validation');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['name', 'ASC']]
    });

    // Per-user counts for the Team page
    const memberships = await ProjectMember.findAll({ attributes: ['user_id'] });
    const tasks = await Task.findAll({ attributes: ['assigned_to', 'status'] });
    const projectCount = new Map();
    for (const m of memberships) projectCount.set(m.user_id, (projectCount.get(m.user_id) || 0) + 1);
    const openTaskCount = new Map();
    for (const t of tasks) {
      if (t.assigned_to && t.status !== 'Done') {
        openTaskCount.set(t.assigned_to, (openTaskCount.get(t.assigned_to) || 0) + 1);
      }
    }

    res.json(users.map(u => ({
      ...u.toJSON(),
      projectCount: projectCount.get(u.id) || 0,
      openTaskCount: openTaskCount.get(u.id) || 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${USER_ROLES.join(', ')}` });
    }

    // Serialise role changes so two concurrent demotions cannot remove every admin
    const result = await sequelize.transaction(async (transaction) => {
      const target = await User.findByPk(req.params.id, { transaction });
      if (!target) return { status: 404, body: { message: 'User not found' } };

      if (target.role === 'Admin' && role !== 'Admin') {
        const adminCount = await User.count({ where: { role: 'Admin' }, transaction });
        if (adminCount <= 1) {
          return { status: 400, body: { message: 'Cannot demote the last admin. Promote another user first.' } };
        }
      }

      target.role = role;
      await target.save({ transaction });
      return { status: 200, body: { id: target.id, name: target.name, email: target.email, role: target.role } };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, updateUserRole };
