// Small shared formatting helpers

export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export const todayISO = () => new Date().toISOString().split('T')[0];

// Formats a YYYY-MM-DD string as e.g. "Dec 20, 2026" without timezone drift
export const formatDate = (value) => {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?';

export const apiError = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || (err?.response ? fallback : 'Cannot reach the server. Check your connection and try again.');

// The current user's role on a project: 'Admin', 'Member' or null
export const projectRoleOf = (project, userId) =>
  project?.members?.find(m => m.id === userId)?.ProjectMember?.role || null;

// Global Admins manage everything; project Admins manage their own project
export const canManageProject = (user, project) =>
  user?.role === 'Admin' || projectRoleOf(project, user?.id) === 'Admin';
