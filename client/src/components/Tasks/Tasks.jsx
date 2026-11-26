import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import api from '../../services/api';
import { CheckSquare, Plus, Clock, Calendar, CheckCircle, Activity, User, AlertCircle, Trash2, Edit2, FolderKanban, Flag } from 'lucide-react';
import Modal from '../ui/Modal';
import { LoadingState, ErrorState, EmptyState, Alert } from '../ui/States';
import { apiError, canManageProject, formatDate, todayISO } from '../../utils/format';

const STATUS_META = {
  'To Do': { badge: 'badge-pending', icon: Clock },
  'In Progress': { badge: 'badge-progress', icon: Activity },
  'Done': { badge: 'badge-completed', icon: CheckCircle },
};
const PRIORITY_BADGE = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'mine', label: 'Assigned to me' },
  { id: 'overdue', label: 'Overdue' },
];

const TaskForm = ({ initial, projects, submitLabel, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [dueDate, setDueDate] = useState(initial.due_date || '');
  const [projectId, setProjectId] = useState(String(initial.project_id || projects[0]?.id || ''));
  const [assignedTo, setAssignedTo] = useState(initial.assigned_to ? String(initial.assigned_to) : '');
  const [priority, setPriority] = useState(initial.priority || 'Medium');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProject = projects.find(p => String(p.id) === projectId);

  const handleProjectChange = (value) => {
    setProjectId(value);
    // The assignee must belong to the selected project
    const project = projects.find(p => String(p.id) === value);
    if (!project?.members?.some(m => String(m.id) === assignedTo)) setAssignedTo('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const message = await onSubmit({
      title,
      description,
      due_date: dueDate || null,
      project_id: projectId,
      assigned_to: assignedTo || null,
      priority
    });
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      <div className="form-group">
        <label className="form-label" htmlFor="task-title">Title</label>
        <input id="task-title" type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="task-description">Description <span className="optional">(optional)</span></label>
        <textarea id="task-description" className="form-control" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="task-project">Project</label>
          <select id="task-project" className="form-control" value={projectId} onChange={(e) => handleProjectChange(e.target.value)} required>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="task-assignee">Assignee</label>
          <select id="task-assignee" className="form-control" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {selectedProject?.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="task-priority">Priority</label>
          <select id="task-priority" className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="task-due">Due date <span className="optional">(optional)</span></label>
          <input id="task-due" type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <p className="form-hint">Only members of the selected project can be assigned.</p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || projects.length === 0}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pageError, setPageError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create' } | { type: 'edit', task }
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = FILTERS.some(f => f.id === searchParams.get('filter')) ? searchParams.get('filter') : 'all';
  const projectFilter = searchParams.get('project') || '';

  const updateParam = (key, value, fallback) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === fallback) next.delete(key); else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  // Bumping refreshKey re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchData = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let ignore = false;
    Promise.all([api.get('/tasks'), api.get('/projects')])
      .then(([tasksRes, projectsRes]) => {
        if (ignore) return;
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setLoadError('');
      })
      .catch(err => { if (!ignore) setLoadError(apiError(err, 'Could not load tasks.')); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const projectById = new Map(projects.map(p => [p.id, p]));
  const manageableProjects = projects.filter(p => canManageProject(user, p));
  const canManageTask = (task) => canManageProject(user, projectById.get(task.project_id));

  const today = todayISO();
  const isOverdue = (task) => !!task.due_date && task.status !== 'Done' && task.due_date < today;

  const matchesFilter = (task, id) => {
    if (id === 'open') return task.status !== 'Done';
    if (id === 'mine') return task.assigned_to === user?.id;
    if (id === 'overdue') return isOverdue(task);
    return true;
  };
  const projectTasks = projectFilter ? tasks.filter(t => String(t.project_id) === projectFilter) : tasks;
  const visibleTasks = projectTasks.filter(t => matchesFilter(t, filter));

  const handleCreate = async (payload) => {
    try {
      await api.post('/tasks', payload);
      setModal(null);
      fetchData();
      return null;
    } catch (err) {
      return apiError(err, 'Failed to create task');
    }
  };

  const handleEdit = async (payload) => {
    try {
      await api.put(`/tasks/${modal.task.id}`, payload);
      setModal(null);
      fetchData();
      return null;
    } catch (err) {
      return apiError(err, 'Failed to update task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setPageError('');
    const previous = task.status;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/tasks/${task.id}/status`, { status: newStatus });
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: previous } : t));
      setPageError(apiError(err, 'Failed to update status'));
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    setPageError('');
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err) {
      setPageError(apiError(err, 'Failed to delete task'));
    }
  };

  const emptyCopy = {
    all: projectFilter ? 'This project has no tasks yet.' : (manageableProjects.length ? 'Create a task to start tracking work.' : 'Tasks in your projects will appear here.'),
    open: 'Everything here is done.',
    mine: 'Nothing is assigned to you right now.',
    overdue: 'Nothing is overdue. Nice work.',
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title"><CheckSquare size={30} aria-hidden="true" /> Tasks</h1>
        <div className="page-actions">
          {projects.length > 1 && (
            <>
              <label htmlFor="project-filter" className="sr-only">Filter by project</label>
              <select
                id="project-filter"
                className="form-control form-control-sm"
                value={projectFilter}
                onChange={(e) => updateParam('project', e.target.value, '')}
              >
                <option value="">All projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </>
          )}
          {manageableProjects.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>
              <Plus size={18} aria-hidden="true" /> New task
            </button>
          )}
        </div>
      </div>

      {!loading && !loadError && tasks.length > 0 && (
        <div className="filter-tabs" role="group" aria-label="Filter tasks">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              className="filter-tab"
              aria-pressed={filter === f.id}
              onClick={() => updateParam('filter', f.id, 'all')}
            >
              {f.label}
              <span className="filter-count">{projectTasks.filter(t => matchesFilter(t, f.id)).length}</span>
            </button>
          ))}
        </div>
      )}

      {pageError && <Alert type="error" onDismiss={() => setPageError('')}>{pageError}</Alert>}

      {loading ? (
        <LoadingState label="Loading tasks…" />
      ) : loadError ? (
        <ErrorState title="Tasks unavailable" message={loadError} onRetry={() => { setLoading(true); fetchData(); }} />
      ) : visibleTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={24} />}
          title={tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
          action={tasks.length === 0 && manageableProjects.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>
              <Plus size={18} aria-hidden="true" /> Create a task
            </button>
          )}
        >
          {tasks.length === 0 && projects.length === 0
            ? (user?.role === 'Admin' ? 'Create a project first, then add tasks to it.' : "You haven't been added to a project yet.")
            : emptyCopy[filter]}
        </EmptyState>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => {
            const overdue = isOverdue(task);
            const manage = canManageTask(task);
            const canChangeStatus = manage || task.assigned_to === user?.id;
            const { badge, icon: StatusIcon } = STATUS_META[task.status] || STATUS_META['To Do'];
            return (
              <li key={task.id} className={`card glass task-row ${overdue ? 'overdue' : ''}`}>
                <div className="task-main">
                  <div className="task-title-line">
                    <h2 className={`task-title ${task.status === 'Done' ? 'done' : ''}`}>{task.title}</h2>
                    <span className={`badge ${badge}`}><StatusIcon size={13} aria-hidden="true" /> {task.status}</span>
                    {task.priority && (
                      <span className={`badge badge-plain ${PRIORITY_BADGE[task.priority]}`}>
                        <Flag size={12} aria-hidden="true" /> {task.priority}<span className="sr-only"> priority</span>
                      </span>
                    )}
                  </div>
                  <div className="task-meta">
                    {task.project && (
                      <span className="meta"><FolderKanban size={14} aria-hidden="true" /> {task.project.title}</span>
                    )}
                    {task.due_date && (
                      <span className={`meta ${overdue ? 'overdue' : ''}`}>
                        {overdue ? <AlertCircle size={14} aria-hidden="true" /> : <Calendar size={14} aria-hidden="true" />}
                        Due {formatDate(task.due_date)}{overdue ? ' · Overdue' : ''}
                      </span>
                    )}
                    <span className="meta">
                      <User size={14} aria-hidden="true" />
                      {task.assignee ? (task.assigned_to === user?.id ? 'You' : task.assignee.name) : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <select
                    className="form-control form-control-sm"
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                    disabled={!canChangeStatus}
                    aria-label={`Status of ${task.title}`}
                    title={canChangeStatus ? undefined : 'Only the assignee or a project Admin can change the status'}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  {manage && (
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      <button type="button" className="icon-btn" onClick={() => setModal({ type: 'edit', task })} aria-label={`Edit ${task.title}`} title="Edit task">
                        <Edit2 size={17} />
                      </button>
                      <button type="button" className="icon-btn danger" onClick={() => handleDelete(task)} aria-label={`Delete ${task.title}`} title="Delete task">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.type === 'create' && (
        <Modal title="New task" icon={<Plus size={22} aria-hidden="true" />} onClose={() => setModal(null)}>
          <TaskForm
            initial={{ project_id: projectFilter && manageableProjects.some(p => String(p.id) === projectFilter) ? projectFilter : undefined }}
            projects={manageableProjects}
            submitLabel="Create task"
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit task" icon={<Edit2 size={22} aria-hidden="true" />} onClose={() => setModal(null)}>
          <TaskForm initial={modal.task} projects={manageableProjects} submitLabel="Save changes" onSubmit={handleEdit} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </>
  );
};

export default Tasks;
