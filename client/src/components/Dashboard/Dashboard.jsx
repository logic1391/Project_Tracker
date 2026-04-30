import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Briefcase, CheckCircle, Clock, Activity, LayoutDashboard, AlertTriangle, Users } from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    tasksPerUser: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data);
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
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Welcome back! Here's a summary of your projects and tasks.</p>

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

      <div className="card glass">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--primary-color)" /> Tasks per User
        </h2>
        {metrics.tasksPerUser?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {metrics.tasksPerUser.map((user, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 500 }}>{user.name}</div>
                <div className="badge badge-progress">{user.count} tasks</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No tasks assigned yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
