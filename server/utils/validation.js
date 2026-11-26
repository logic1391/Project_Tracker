const { ProjectMember } = require('../models');

const PROJECT_STATUSES = ['Draft', 'Active', 'Completed'];
const TASK_STATUSES = ['To Do', 'In Progress', 'Done'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];
const MEMBER_ROLES = ['Admin', 'Member'];
const USER_ROLES = ['Admin', 'Member'];

// Returns true when the given user belongs to the given project
const isProjectMember = async (userId, projectId) => {
  if (!userId || !projectId) return false;
  const membership = await ProjectMember.findOne({
    where: { user_id: userId, project_id: projectId }
  });
  return !!membership;
};

// Accepts YYYY-MM-DD strings (as sent by <input type="date">); empty values mean "no date"
const isValidDate = (value) => {
  if (value === null || value === undefined || value === '') return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
};

const today = () => new Date().toISOString().split('T')[0];

module.exports = {
  PROJECT_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  MEMBER_ROLES,
  USER_ROLES,
  isProjectMember,
  isValidDate,
  today
};
