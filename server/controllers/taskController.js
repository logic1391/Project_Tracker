const { Task, Project, User } = require('../models');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ]
    });
    // Optional: Filter tasks to only show those assigned to the member or all for Admin.
    // For now, returning all or filtering by req.user role
    if (req.user.role !== 'Admin') {
      const userTasks = tasks.filter(t => t.assigned_to === req.user.id);
      return res.json(userTasks);
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, due_date, project_id, assigned_to, priority } = req.body;
    
    const project = await Project.findByPk(project_id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title,
      description,
      due_date,
      project_id,
      assigned_to: assigned_to || null,
      priority: priority || 'Medium'
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByPk(req.params.id);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Restrict update to Assigned Member or Admin
    if (req.user.role !== 'Admin' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    task.status = status;
    await task.save();
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTasks, createTask, updateTaskStatus, deleteTask };
