import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import api from '../../services/api';
import { Briefcase, CheckCircle, Clock, Activity, LayoutDashboard, AlertTriangle, Users, FolderKanban, AlertCircle, ListTodo } from 'lucide-react';
import { LoadingState, ErrorState, Alert } from '../ui/States';
import { apiError, formatDate, initials, plural } from '../../utils/format';

const EMPTY_METRICS = {
  totalProjects: 0,
  totalTasks: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  overdueProjects: 0,
  projectsByStatus: { Draft: 0, Active: 0, Completed: 0 },
  tasksPerProject: [],
  tasksPerUser: [],
  overdueTaskList: []
};

const PROJECT_STATUS_COLORS = {
  Draft: 'var(--warning-color)',
  Active: 'var(--primary-color)',
  Completed: 'var(--success-color)',
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    let ignore = false;
    api.get('/dashboard/metrics')
      .then(response => { if (!ignore) { setMetrics({ ...EMPTY_METRICS, ...response.data }); setError(''); } })
      .catch(err => { if (!ignore) setError(apiError(err, 'Could not load dashboard metrics.')); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const retry = () => { setLoading(true); setRefreshKey(k => k + 1); };

  const header = (
    <div className="page-header">
      <div>
        <h1 className="page-title"><LayoutDashboard size={30} aria-hidden="true" /> Dashboard</h1>
        <p className="page-subtitle">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. {isAdmin ? "Here's a summary of all projects and tasks." : "Here's a summary of the projects you belong to."}
        </p>
      </div>
    </div>
  );

  if (loading) return <>{header}<LoadingState label="Loading dashboard…" /></>;
  if (error) return <>{header}<ErrorState title="Dashboard unavailable" message={error} onRetry={retry} /></>;

  const projectStatusTotal = Object.values(metrics.projectsByStatus || {}).reduce((a, b) => a + b, 0);

  const statCards = [
    { title: 'Projects', value: metrics.totalProjects, icon: Briefcase, color: 'var(--primary-color)', bg: 'var(--primary-soft)' },
    { title: 'Tasks', value: metrics.totalTasks, icon: ListTodo, color: '#6d28d9', bg: 'rgba(139, 92, 246, 0.12)' },
    { title: 'To do', value: metrics.pendingTasks, icon: Clock, color: 'var(--warning-text)', bg: 'var(--warning-soft)' },
    { title: 'In progress', value: metrics.inProgressTasks, icon: Activity, color: 'var(--info-text)', bg: 'var(--info-soft)' },
    { title: 'Completed', value: metrics.completedTasks, icon: CheckCircle, color: 'var(--success-text)', bg: 'var(--success-soft)' },
    { title: 'Overdue', value: metrics.overdueTasks, icon: AlertTriangle, color: 'var(--danger-text)', bg: 'var(--danger-soft)' },
  ];

  const overdueParts = [
    metrics.overdueTasks > 0 && plural(metrics.overdueTasks, 'overdue task'),
    metrics.overdueProjects > 0 && plural(metrics.overdueProjects, 'overdue project'),
  ].filter(Boolean);

  return (
    <>
      {header}

      {overdueParts.length > 0 && (
        <Alert type="error">
          <strong>{overdueParts.join(' and ')}</strong> {overdueParts.length > 1 || metrics.overdueTasks + metrics.overdueProjects > 1 ? 'need' : 'needs'} attention.{' '}
          <Link to="/tasks?filter=overdue">Review overdue tasks</Link>
        </Alert>
      )}

      <div className="stat-grid">
        {statCards.map(({ title, value, icon: Icon, color, bg }) => (
          <div key={title} className="glass stat">
            <div className="stat-icon" style={{ background: bg, color }} aria-hidden="true"><Icon size={22} /></div>
            <div>
              <div className="stat-label">{title}</div>
              <div className="stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-panels">
        <section className="card glass" aria-labelledby="dist-title">
          <h2 id="dist-title" className="card-title"><FolderKanban size={20} aria-hidden="true" /> Project status</h2>
          {projectStatusTotal > 0 ? (
            <div className="stack">
              {Object.entries(metrics.projectsByStatus).map(([status, count]) => (
                <div key={status} className="dist-row">
                  <div style={{ fontWeight: 500 }}>{status}</div>
                  <div className="bar-track" role="img" aria-label={`${status}: ${count} of ${projectStatusTotal} projects`}>
                    <div className="bar-fill" style={{ width: `${(count / projectStatusTotal) * 100}%`, background: PROJECT_STATUS_COLORS[status] }} />
                  </div>
                  <div className="tabular" style={{ textAlign: 'right', fontWeight: 600 }}>{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-inline">No projects yet.{isAdmin && <> <Link to="/projects">Create the first one</Link>.</>}</p>
          )}
        </section>

        <section className="card glass" aria-labelledby="progress-title">
          <h2 id="progress-title" className="card-title"><CheckCircle size={20} aria-hidden="true" /> Project progress</h2>
          {metrics.tasksPerProject?.length > 0 ? (
            <div className="stack">
              {metrics.tasksPerProject.map(project => {
                const pct = project.total ? Math.round((project.completed / project.total) * 100) : 0;
                return (
                  <div key={project.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{project.title}</span>
                      <span className="muted tabular" style={{ whiteSpace: 'nowrap' }}>
                        {project.total ? `${project.completed}/${project.total} done` : 'No tasks yet'}
                      </span>
                    </div>
                    <div className="bar-track" role="progressbar" aria-label={`${project.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--secondary-color)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-inline">No projects yet.</p>
          )}
        </section>
      </div>

      <div className="grid-panels">
        <section className="card glass" aria-labelledby="workload-title">
          <h2 id="workload-title" className="card-title"><Users size={20} aria-hidden="true" /> Workload</h2>
          {metrics.tasksPerUser?.length > 0 ? (
            <ul className="stack-sm" style={{ listStyle: 'none' }}>
              {metrics.tasksPerUser.map((member) => (
                <li key={member.id ?? member.name} className="list-row">
                  <div className="list-row-main">
                    <div className="avatar avatar-sm" aria-hidden="true">{initials(member.name)}</div>
                    <div className="list-row-title">{member.name}</div>
                  </div>
                  <div className="chips">
                    <span className="badge badge-neutral badge-plain">{plural(member.count, 'task')}</span>
                    {member.open > 0 && <span className="badge badge-pending badge-plain">{member.open} open</span>}
                    {member.overdue > 0 && <span className="badge badge-danger badge-plain">{member.overdue} overdue</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-inline">No tasks assigned yet.</p>
          )}
        </section>

        <section className="card glass" aria-labelledby="overdue-title">
          <h2 id="overdue-title" className="card-title">
            <AlertTriangle size={20} aria-hidden="true" style={{ color: 'var(--danger-text)' }} /> Overdue tasks
          </h2>
          {metrics.overdueTaskList?.length > 0 ? (
            <ul className="stack-sm" style={{ listStyle: 'none' }}>
              {metrics.overdueTaskList.map(task => (
                <li key={task.id} className="list-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="list-row-title">{task.title}</div>
                    <div className="list-row-meta">
                      {task.project?.title} · {task.assignee ? task.assignee.name : 'Unassigned'}
                    </div>
                  </div>
                  <div className="meta overdue" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    <AlertCircle size={14} aria-hidden="true" />
                    <span><span className="sr-only">Due </span>{formatDate(task.due_date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-inline">Nothing overdue. Nice work.</p>
          )}
        </section>
      </div>
    </>
  );
};

export default Dashboard;
