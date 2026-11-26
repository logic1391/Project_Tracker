import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth-context';
import api from '../../services/api';
import { Briefcase, CheckCircle, Clock, Activity, LayoutDashboard, AlertTriangle, Users, FolderKanban, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/dashboard/metrics');
        setMetrics(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
  }

  const projectStatusColors = {
    Draft: 'var(--warning-color)',
    Active: 'var(--primary-color)',
    Completed: 'var(--success-color)',
  };
  const projectStatusTotal = Object.values(metrics.projectsByStatus || {}).reduce((a, b) => a + b, 0);

  const sectionTitleStyle = { fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' };
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' };
  const progressTrack = { height: 8, borderRadius: 4, background: 'var(--border-color)', overflow: 'hidden', flex: 1 };

  const statCards = [
    { title: 'Total Projects', value: metrics.totalProjects, icon: <Briefcase size={24} />, color: 'var(--primary-color)' },
    { title: 'Total Tasks', value: metrics.totalTasks, icon: <LayoutDashboard size={24} />, color: '#8b5cf6' },
    { title: 'Completed', value: metrics.completedTasks, icon: <CheckCircle size={24} />, color: 'var(--secondary-color)' },
    { title: 'In Progress', value: metrics.inProgressTasks, icon: <Activity size={24} />, color: '#3b82f6' },
    { title: 'To Do', value: metrics.pendingTasks, icon: <Clock size={24} />, color: 'var(--text-muted)' },
    { title: 'Overdue', value: metrics.overdueTasks, icon: <AlertTriangle size={24} />, color: 'var(--danger-color)' },
  ];

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <LayoutDashboard size={32} color="var(--primary-color)" />
        Dashboard Overview
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Welcome back{user?.name ? `, ${user.name}` : ''}! {isAdmin ? "Here's a summary of all projects and tasks." : "Here's a summary of the projects you belong to."}
      </p>

      {(metrics.overdueTasks > 0 || metrics.overdueProjects > 0) && (
        <div className="card glass" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger-color)' }}>
          <AlertTriangle size={20} />
          <span>
            {metrics.overdueTasks > 0 && `${metrics.overdueTasks} overdue task${metrics.overdueTasks === 1 ? '' : 's'}`}
            {metrics.overdueTasks > 0 && metrics.overdueProjects > 0 && ' and '}
            {metrics.overdueProjects > 0 && `${metrics.overdueProjects} overdue project${metrics.overdueProjects === 1 ? '' : 's'}`}
            {' '}need attention.
          </span>
        </div>
      )}

      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        {statCards.map((stat, index) => (
          <div key={index} className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '16px', background: `rgba(${parseInt(stat.color.slice(1,3), 16) || 99}, ${parseInt(stat.color.slice(3,5), 16) || 102}, ${parseInt(stat.color.slice(5,7), 16) || 241}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{stat.title}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass">
          <h2 style={sectionTitleStyle}>
            <FolderKanban size={20} color="var(--primary-color)" /> Project Distribution
          </h2>
          {projectStatusTotal > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(metrics.projectsByStatus).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 90, fontWeight: 500 }}>{status}</div>
                  <div style={progressTrack}>
                    <div style={{ width: `${(count / projectStatusTotal) * 100}%`, height: '100%', background: projectStatusColors[status] }} />
                  </div>
                  <div style={{ width: 32, textAlign: 'right', fontWeight: 600 }}>{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No projects yet.</p>
          )}
        </div>

        <div className="card glass">
          <h2 style={sectionTitleStyle}>
            <CheckCircle size={20} color="var(--primary-color)" /> Project Progress
          </h2>
          {metrics.tasksPerProject?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {metrics.tasksPerProject.map(project => (
                <div key={project.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 500 }}>{project.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{project.completed}/{project.total} done</span>
                  </div>
                  <div style={progressTrack}>
                    <div style={{ width: project.total ? `${(project.completed / project.total) * 100}%` : 0, height: '100%', background: 'var(--secondary-color)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No projects yet.</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card glass">
          <h2 style={sectionTitleStyle}>
            <Users size={20} color="var(--primary-color)" /> User Workload
          </h2>
          {metrics.tasksPerUser?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {metrics.tasksPerUser.map((member) => (
                <div key={member.id ?? member.name} style={rowStyle}>
                  <div style={{ fontWeight: 500 }}>{member.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="badge badge-progress">{member.count} tasks</span>
                    {member.open !== undefined && <span className="badge badge-pending">{member.open} open</span>}
                    {member.overdue > 0 && (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>{member.overdue} overdue</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No tasks assigned yet.</p>
          )}
        </div>

        <div className="card glass">
          <h2 style={sectionTitleStyle}>
            <AlertTriangle size={20} color="var(--danger-color)" /> Overdue Tasks
          </h2>
          {metrics.overdueTaskList?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {metrics.overdueTaskList.map(task => (
                <div key={task.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {task.project?.title}{task.assignee ? ` · ${task.assignee.name}` : ' · Unassigned'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger-color)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    <AlertCircle size={14} /> {task.due_date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Nothing overdue. Nice work!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
