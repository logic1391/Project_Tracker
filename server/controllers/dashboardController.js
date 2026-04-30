const { Task, Project, User } = require('../models');
const { Op } = require('sequelize');

const getDashboardMetrics = async (req, res) => {
  try {
    const totalProjects = await Project.count();
    const totalTasks = await Task.count();
    const pendingTasks = await Task.count({ where: { status: 'To Do' } });
    const inProgressTasks = await Task.count({ where: { status: 'In Progress' } });
    const completedTasks = await Task.count({ where: { status: 'Done' } });

    // Overdue tasks
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = await Task.count({
      where: {
        status: { [Op.ne]: 'Done' },
        due_date: { [Op.lt]: today }
      }
    });

    // Tasks per user
    const usersWithTasks = await User.findAll({
      include: [{ model: Task, as: 'assignedTasks', attributes: ['id'] }]
    });

    const tasksPerUser = usersWithTasks.map(u => ({
      name: u.name,
      count: u.assignedTasks ? u.assignedTasks.length : 0
    })).filter(u => u.count > 0);

    res.json({
      totalProjects,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      tasksPerUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboardMetrics };
