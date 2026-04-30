const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const ProjectMember = require('./ProjectMember');

// A User creates many Projects (Creator relationship)
User.hasMany(Project, { foreignKey: 'created_by', as: 'createdProjects' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Project Members (Many-to-Many)
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', as: 'projects' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', as: 'members' });

// A Project has many Tasks
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// A User is assigned to many Tasks
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

module.exports = {
  sequelize,
  User,
  Project,
  Task,
  ProjectMember
};
