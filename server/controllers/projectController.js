const { Project, User, Task, ProjectMember } = require('../models');

const getProjects = async (req, res) => {
  try {
    // If user is Admin, they should see all projects
    if (req.user.role === 'Admin') {
      const allProjects = await Project.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name'] },
          { model: Task, as: 'tasks', attributes: ['id', 'status'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
        ]
      });
      return res.json(allProjects);
    }

    // For regular Members, only show projects they are assigned to
    const user = await User.findByPk(req.user.id, {
      include: [
        { 
          model: Project, 
          as: 'projects',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: Task, as: 'tasks', attributes: ['id', 'status'] },
            { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });
    
    const projects = user.projects || [];
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { 
          model: Task, 
          as: 'tasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }]
        },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    const project = await Project.create({
      title,
      description,
      due_date: due_date || null,
      created_by: req.user.id
    });
    
    // Add creator as Admin member
    await ProjectMember.create({
      project_id: project.id,
      user_id: req.user.id,
      role: 'Admin'
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userToAdd = await User.findOne({ where: { email } });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    // Check if already a member
    const existing = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: userToAdd.id }
    });
    if (existing) return res.status(400).json({ message: 'User is already a member' });

    await ProjectMember.create({
      project_id: project.id,
      user_id: userToAdd.id,
      role: role || 'Member'
    });

    res.status(201).json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { title, description, due_date, status } = req.body;
    const project = await Project.findByPk(req.params.id);
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.title = title !== undefined ? title : project.title;
    project.description = description !== undefined ? description : project.description;
    project.due_date = due_date !== undefined ? due_date : project.due_date;
    project.status = status !== undefined ? status : project.status;
    
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Manually delete associated Tasks and ProjectMembers to prevent foreign key constraint errors
    await Task.destroy({ where: { project_id: project.id } });
    await ProjectMember.destroy({ where: { project_id: project.id } });

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;
    const project = await Project.findByPk(projectId);
    
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Optional: Prevent removing the creator
    if (project.created_by == userId) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }

    const deleted = await ProjectMember.destroy({
      where: { project_id: projectId, user_id: userId }
    });

    if (!deleted) return res.status(404).json({ message: 'Member not found in this project' });

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProjects, getProjectById, createProject, addMember, updateProject, deleteProject, removeMember };
