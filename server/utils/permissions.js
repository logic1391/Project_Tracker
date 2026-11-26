const { ProjectMember } = require('../models');

// Global Admins manage everything. A user whose ProjectMember.role is 'Admin'
// manages that one project: its details, members and tasks.
const getProjectRole = async (userId, projectId) => {
  if (!userId || !projectId) return null;
  const membership = await ProjectMember.findOne({
    where: { user_id: userId, project_id: projectId },
    attributes: ['role']
  });
  return membership ? membership.role : null;
};

const canManageProject = async (user, projectId) => {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return (await getProjectRole(user.id, projectId)) === 'Admin';
};

module.exports = { getProjectRole, canManageProject };
