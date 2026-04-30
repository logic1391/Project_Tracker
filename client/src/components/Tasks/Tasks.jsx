import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { CheckSquare, Plus, Clock, Calendar, CheckCircle, Activity, User, AlertCircle, Trash2 } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useContext(AuthContext);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      if (projectsRes.data.length > 0) {
        setProjectId(projectsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', { 
        title, 
        description, 
        due_date: dueDate, 
        project_id: projectId,
        assigned_to: assignedTo || null,
        priority
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedTo('');
      setPriority('Medium');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
      console.error('Failed to update status', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'To Do': return 'badge-pending';
      case 'In Progress': return 'badge-progress';
      case 'Done': return 'badge-completed';
      default: return 'badge-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'To Do': return <Clock size={16} />;
      case 'In Progress': return <Activity size={16} />;
      case 'Done': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'High': return 'var(--danger-color)';
      case 'Medium': return 'var(--warning-color)';
      case 'Low': return 'var(--secondary-color)';
      default: return 'var(--text-muted)';
    }
  };

  const selectedProjectObj = projects.find(p => p.id === parseInt(projectId));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckSquare size={32} color="var(--primary-color)" />
          Tasks
        </h1>
        {user?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading tasks...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tasks.map((task) => (
            <div key={task.id} className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>
                    {task.title}
                  </h3>
                  <span className={`badge ${getStatusBadgeClass(task.status)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getStatusIcon(task.status)} {task.status}
                  </span>
                  {task.priority && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: getPriorityColor(task.priority), display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={14} /> {task.priority}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {task.project && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckSquare size={14} /> Project: {task.project.title}
                    </span>
                  )}
                  {task.due_date && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} /> Due: {task.due_date}
                    </span>
                  )}
                  {task.assignee && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} /> Assignee: {task.assignee.name}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="form-control" 
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  style={{ width: 'auto', padding: '0.5rem', fontSize: '0.85rem' }}
                  disabled={user?.role !== 'Admin' && task.assigned_to !== user?.id}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                {user?.role === 'Admin' && (
                  <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
             <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
               No tasks found.
             </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="glass modal-content" style={{ padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={24} color="var(--primary-color)" /> Create New Task
            </h2>
            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select 
                    className="form-control"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select 
                    className="form-control"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {selectedProjectObj?.members?.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={projects.length === 0}>
                  Create Task
                </button>
              </div>
              {projects.length === 0 && (
                <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.5rem' }}>You need to create a project first before creating tasks.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
