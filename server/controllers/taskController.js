const { Task, Project, User, ProjectMember } = require('../models');
const { TASK_STATUSES, TASK_PRIORITIES, isProjectMember, isValidDate } = require('../utils/validation');

// Validates the editable task fields shared by create and update.
// Returns an error message, or null when everything is valid.
const validateTaskFields = ({ title, due_date, priority, status }, { requireTitle }) => {
  if (requireTitle && (!title || !String(title).trim())) return 'Task title is required';
  if (!requireTitle && title !== undefined && !String(title).trim()) return 'Task title cannot be empty';
  if (priority !== undefined && priority !== null && !TASK_PRIORITIES.includes(priority)) {
    return `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`;
  }
  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    return `Status must be one of: ${TASK_STATUSES.join(', ')}`;
  }
  if (!isValidDate(due_date)) return 'Due date must be in YYYY-MM-DD format';
  return null;
};

const getTasks = async (req, res) => {
  try {
    const where = {};

    // Members only see tasks belonging to projects they are part of
    if (req.user.role !== 'Admin') {
      const memberships = await ProjectMember.findAll({
        where: { user_id: req.user.id },
        attributes: ['project_id']
      });
      where.project_id = memberships.map(m => m.project_id);
    }

    if (req.query.project_id) {
      const requested = parseInt(req.query.project_id, 10);
      if (where.project_id && !where.project_id.includes(requested)) {
        return res.json([]);
      }
      where.project_id = requested;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, due_date, project_id, assigned_to, priority } = req.body || {};

    const validationError = validateTaskFields({ title, due_date, priority }, { requireTitle: true });
    if (validationError) return res.status(400).json({ message: validationError });

    if (!project_id) return res.status(400).json({ message: 'Project is required' });
    const project = await Project.findByPk(project_id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (assigned_to && !(await isProjectMember(assigned_to, project.id))) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    const task = await Task.create({
      title: String(title).trim(),
      description,
      due_date: due_date || null,
      project_id: project.id,
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
    const { status } = req.body || {};
    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${TASK_STATUSES.join(', ')}` });
    }

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

const updateTask = async (req, res) => {
  try {
    const { title, description, due_date, assigned_to, priority, status, project_id } = req.body || {};
    const task = await Task.findByPk(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const validationError = validateTaskFields({ title, due_date, priority, status }, { requireTitle: false });
    if (validationError) return res.status(400).json({ message: validationError });

    // Allow moving a task to another project
    let targetProjectId = task.project_id;
    if (project_id !== undefined && project_id !== null && project_id !== '' && parseInt(project_id, 10) !== task.project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      targetProjectId = project.id;
    }

    const targetAssignee = assigned_to !== undefined ? (assigned_to || null) : task.assigned_to;
    if (targetAssignee && !(await isProjectMember(targetAssignee, targetProjectId))) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    task.title = title !== undefined ? String(title).trim() : task.title;
    task.description = description !== undefined ? description : task.description;
    task.due_date = due_date !== undefined ? (due_date || null) : task.due_date;
    task.project_id = targetProjectId;
    task.assigned_to = targetAssignee;
    task.priority = priority ? priority : task.priority;
    task.status = status !== undefined ? status : task.status;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTasks, createTask, updateTaskStatus, deleteTask, updateTask };
