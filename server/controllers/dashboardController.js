const { Task, Project, User, ProjectMember } = require('../models');
const { Op } = require('sequelize');
const { PROJECT_STATUSES, today } = require('../utils/validation');

const getDashboardMetrics = async (req, res) => {
  try {
    // Admins see metrics for everything; Members only for the projects they belong to
    const projectWhere = {};
    if (req.user.role !== 'Admin') {
      const memberships = await ProjectMember.findAll({
        where: { user_id: req.user.id },
        attributes: ['project_id']
      });
      projectWhere.id = memberships.map(m => m.project_id);
    }
    const taskWhere = projectWhere.id ? { project_id: projectWhere.id } : {};

    const currentDate = today();

    const totalProjects = await Project.count({ where: projectWhere });
    const totalTasks = await Task.count({ where: taskWhere });
    const pendingTasks = await Task.count({ where: { ...taskWhere, status: 'To Do' } });
    const inProgressTasks = await Task.count({ where: { ...taskWhere, status: 'In Progress' } });
    const completedTasks = await Task.count({ where: { ...taskWhere, status: 'Done' } });

    // Overdue tasks
    const overdueTasks = await Task.count({
      where: {
        ...taskWhere,
        status: { [Op.ne]: 'Done' },
        due_date: { [Op.lt]: currentDate }
      }
    });

    // Overdue projects (past due and not completed)
    const overdueProjects = await Project.count({
      where: {
        ...projectWhere,
        status: { [Op.ne]: 'Completed' },
        due_date: { [Op.lt]: currentDate }
      }
    });

    // Project distribution by status
    const projectsByStatus = {};
    for (const status of PROJECT_STATUSES) {
      projectsByStatus[status] = await Project.count({ where: { ...projectWhere, status } });
    }

    // Tasks per project
    const projects = await Project.findAll({
      where: projectWhere,
      attributes: ['id', 'title', 'status'],
      include: [{ model: Task, as: 'tasks', attributes: ['id', 'status'] }],
      order: [['title', 'ASC']]
    });
    const tasksPerProject = projects.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      total: p.tasks.length,
      completed: p.tasks.filter(t => t.status === 'Done').length
    }));

    // Tasks per user (workload)
    const tasks = await Task.findAll({
      where: { ...taskWhere, assigned_to: { [Op.ne]: null } },
      attributes: ['id', 'status', 'due_date'],
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }]
    });
    const workload = new Map();
    for (const t of tasks) {
      if (!t.assignee) continue;
      const entry = workload.get(t.assignee.id) || { id: t.assignee.id, name: t.assignee.name, count: 0, open: 0, overdue: 0 };
      entry.count += 1;
      if (t.status !== 'Done') {
        entry.open += 1;
        if (t.due_date && t.due_date < currentDate) entry.overdue += 1;
      }
      workload.set(t.assignee.id, entry);
    }
    const tasksPerUser = [...workload.values()].sort((a, b) => b.count - a.count);

    // Overdue task list for warnings
    const overdueTaskList = await Task.findAll({
      where: {
        ...taskWhere,
        status: { [Op.ne]: 'Done' },
        due_date: { [Op.lt]: currentDate }
      },
      attributes: ['id', 'title', 'due_date', 'status', 'priority'],
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ],
      order: [['due_date', 'ASC']],
      limit: 10
    });

    res.json({
      totalProjects,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      overdueProjects,
      projectsByStatus,
      tasksPerProject,
      tasksPerUser,
      overdueTaskList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboardMetrics };
