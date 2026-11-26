import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth-context';
import api from '../../services/api';
import { Plus, FolderKanban, Users, ListTodo, UserPlus, Calendar, AlertCircle, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import { LoadingState, ErrorState, EmptyState, Alert } from '../ui/States';
import { apiError, canManageProject, formatDate, initials, plural, projectRoleOf, todayISO } from '../../utils/format';

const STATUS_BADGE = { Draft: 'badge-draft', Active: 'badge-active', Completed: 'badge-completed' };

const ProjectForm = ({ initial, submitLabel, showStatus, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [status, setStatus] = useState(initial.status || 'Draft');
  const [dueDate, setDueDate] = useState(initial.due_date || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = { title, description, due_date: dueDate || null, ...(showStatus ? { status } : {}) };
    const message = await onSubmit(payload);
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      <div className="form-group">
        <label className="form-label" htmlFor="project-title">Title</label>
        <input id="project-title" type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="project-description">Description <span className="optional">(optional)</span></label>
        <textarea id="project-description" className="form-control" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-row">
        {showStatus && (
          <div className="form-group">
            <label className="form-label" htmlFor="project-status">Status</label>
            <select id="project-status" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label" htmlFor="project-due">Due date <span className="optional">(optional)</span></label>
          <input id="project-due" type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
};

const MembersModal = ({ project, onClose, onChanged }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action, successMessage) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
      setNotice(successMessage);
      onChanged();
      return true;
    } catch (err) {
      setError(apiError(err, 'Something went wrong. Please try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const ok = await run(() => api.post(`/projects/${project.id}/members`, { email, role }), `${email} was added to the project.`);
    if (ok) { setEmail(''); setRole('Member'); }
  };

  const handleRoleChange = (member, newRole) =>
    run(() => api.put(`/projects/${project.id}/members/${member.id}`, { role: newRole }), `${member.name} is now a project ${newRole}.`);

  const handleRemove = (member) => {
    if (!window.confirm(`Remove ${member.name} from "${project.title}"? Their tasks in this project will be unassigned.`)) return;
    run(() => api.delete(`/projects/${project.id}/members/${member.id}`), `${member.name} was removed.`);
  };

  return (
    <Modal
      title="Members"
      subtitle={project.title}
      icon={<Users size={22} aria-hidden="true" />}
      onClose={onClose}
      maxWidth={560}
    >
      {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}
      {notice && !error && <Alert type="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <form onSubmit={handleAdd} className="inset">
        <h3 className="section-title">Add a member</h3>
        <div className="add-member-row">
          <div className="form-group">
            <label className="form-label" htmlFor="member-email">Email</label>
            <input id="member-email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="member-role">Project role</label>
            <select id="member-role" className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <UserPlus size={18} aria-hidden="true" /> Add
          </button>
        </div>
        <p className="form-hint">The person needs an account first. Project Admins can edit this project and manage its members and tasks.</p>
      </form>

      <h3 className="section-title">Current members <span className="muted tabular">({project.members?.length || 0})</span></h3>
      <ul className="stack-sm" style={{ listStyle: 'none' }}>
        {project.members?.map(m => {
          const isCreator = project.creator?.id === m.id;
          const memberRole = m.ProjectMember?.role || 'Member';
          return (
            <li key={m.id} className="list-row">
              <div className="list-row-main">
                <div className="avatar avatar-sm" aria-hidden="true">{initials(m.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="list-row-title">{m.name}</div>
                  <div className="list-row-meta" style={{ overflowWrap: 'anywhere' }}>{m.email}</div>
                </div>
              </div>
              {isCreator ? (
                <span className="badge badge-neutral">Creator</span>
              ) : (
                <div className="row-actions">
                  <select
                    className="form-control form-control-sm"
                    value={memberRole}
                    onChange={(e) => handleRoleChange(m, e.target.value)}
                    disabled={busy}
                    aria-label={`Project role for ${m.name}`}
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button type="button" className="icon-btn danger" onClick={() => handleRemove(m)} disabled={busy} aria-label={`Remove ${m.name}`} title="Remove from project">
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pageError, setPageError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit' | 'members', projectId? }
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin';

  // Bumping refreshKey re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchProjects = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let ignore = false;
    api.get('/projects')
      .then(response => { if (!ignore) { setProjects(response.data); setLoadError(''); } })
      .catch(err => { if (!ignore) setLoadError(apiError(err, 'Could not load projects.')); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const closeModal = () => setModal(null);
  const selectedProject = projects.find(p => p.id === modal?.projectId);

  const handleCreate = async (payload) => {
    try {
      await api.post('/projects', payload);
      closeModal();
      fetchProjects();
      return null;
    } catch (err) {
      return apiError(err, 'Failed to create project');
    }
  };

  const handleEdit = async (payload) => {
    try {
      await api.put(`/projects/${modal.projectId}`, payload);
      closeModal();
      fetchProjects();
      return null;
    } catch (err) {
      return apiError(err, 'Failed to update project');
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.title}"? Its ${plural(project.tasks?.length || 0, 'task')} will be deleted too. This can't be undone.`)) return;
    setPageError('');
    try {
      await api.delete(`/projects/${project.id}`);
      fetchProjects();
    } catch (err) {
      setPageError(apiError(err, 'Failed to delete project'));
    }
  };

  const today = todayISO();
  const isOverdue = (project) => !!project.due_date && project.status !== 'Completed' && project.due_date < today;

  const sortedProjects = [...projects].sort((a, b) => {
    const order = { Active: 0, Draft: 1, Completed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1) || a.title.localeCompare(b.title);
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title"><FolderKanban size={30} aria-hidden="true" /> Projects</h1>
          {!loading && !loadError && projects.length > 0 && (
            <p className="page-subtitle">{plural(projects.length, 'project')}{isAdmin ? '' : ' you belong to'}</p>
          )}
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>
            <Plus size={18} aria-hidden="true" /> New project
          </button>
        )}
      </div>

      {pageError && <Alert type="error" onDismiss={() => setPageError('')}>{pageError}</Alert>}

      {loading ? (
        <LoadingState label="Loading projects…" />
      ) : loadError ? (
        <ErrorState title="Projects unavailable" message={loadError} onRetry={() => { setLoading(true); fetchProjects(); }} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={24} />}
          title="No projects yet"
          action={isAdmin && (
            <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>
              <Plus size={18} aria-hidden="true" /> Create a project
            </button>
          )}
        >
          {isAdmin ? 'Create a project, then add members and tasks to it.' : "You haven't been added to a project yet. Ask an Admin to invite you."}
        </EmptyState>
      ) : (
        <ul className="grid-cards" style={{ listStyle: 'none' }}>
          {sortedProjects.map((project) => {
            const manage = canManageProject(user, project);
            const myRole = projectRoleOf(project, user?.id);
            const overdue = isOverdue(project);
            return (
              <li key={project.id} className="card glass project-card">
                <div className="project-card-head">
                  <div style={{ minWidth: 0 }}>
                    <h2 className="project-card-title">{project.title}</h2>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${STATUS_BADGE[project.status] || 'badge-draft'}`}>{project.status || 'Draft'}</span>
                      {!isAdmin && myRole === 'Admin' && (
                        <span className="badge badge-info"><ShieldCheck size={12} aria-hidden="true" /> Project admin</span>
                      )}
                    </div>
                  </div>

                  {manage && (
                    <div className="project-card-actions">
                      <button type="button" className="icon-btn" onClick={() => setModal({ type: 'edit', projectId: project.id })} aria-label={`Edit ${project.title}`} title="Edit project">
                        <Edit2 size={17} />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => setModal({ type: 'members', projectId: project.id })} aria-label={`Manage members of ${project.title}`} title="Manage members">
                        <Users size={17} />
                      </button>
                      {isAdmin && (
                        <button type="button" className="icon-btn danger" onClick={() => handleDelete(project)} aria-label={`Delete ${project.title}`} title="Delete project">
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className={`project-card-desc ${project.description ? '' : 'empty'}`}>
                  {project.description || 'No description'}
                </p>

                <div className="project-card-foot">
                  <div className="meta-row">
                    <span className="meta"><Users size={16} aria-hidden="true" /> {plural(project.members?.length || 0, 'member')}</span>
                    <span className="meta"><ListTodo size={16} aria-hidden="true" /> {plural(project.tasks?.length || 0, 'task')}</span>
                  </div>
                  {project.due_date && (
                    <span className={`meta ${overdue ? 'overdue' : ''}`}>
                      {overdue ? <AlertCircle size={16} aria-hidden="true" /> : <Calendar size={16} aria-hidden="true" />}
                      Due {formatDate(project.due_date)}{overdue ? ' · Overdue' : ''}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.type === 'create' && isAdmin && (
        <Modal title="New project" icon={<Plus size={22} aria-hidden="true" />} onClose={closeModal}>
          <ProjectForm initial={{}} submitLabel="Create project" showStatus={false} onSubmit={handleCreate} onCancel={closeModal} />
        </Modal>
      )}

      {modal?.type === 'edit' && selectedProject && (
        <Modal title="Edit project" icon={<Edit2 size={22} aria-hidden="true" />} onClose={closeModal}>
          <ProjectForm initial={selectedProject} submitLabel="Save changes" showStatus onSubmit={handleEdit} onCancel={closeModal} />
        </Modal>
      )}

      {modal?.type === 'members' && selectedProject && (
        <MembersModal project={selectedProject} onClose={closeModal} onChanged={fetchProjects} />
      )}
    </>
  );
};

export default Projects;
