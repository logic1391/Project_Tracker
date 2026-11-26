import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth-context';
import api from '../../services/api';
import { Plus, FolderKanban, Users, ListTodo, UserPlus, Calendar, AlertCircle, Edit2, Trash2 } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  const { user } = useContext(AuthContext);

  // New Project Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  // Edit Project Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('Draft');
  const [editDueDate, setEditDueDate] = useState('');
  const [editError, setEditError] = useState('');

  // New Member Form State
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');
  const [memberError, setMemberError] = useState('');

  // Bumping refreshKey re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchProjects = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let ignore = false;
    api.get('/projects')
      .then(response => { if (!ignore) setProjects(response.data); })
      .catch(err => console.error('Failed to fetch projects', err))
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', { title, description, due_date: dueDate });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      await api.post(`/projects/${selectedProjectId}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      fetchProjects();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/projects/${selectedProjectId}/members/${userId}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const openEditModal = (project) => {
    setSelectedProjectId(project.id);
    setEditTitle(project.title || '');
    setEditDescription(project.description || '');
    setEditStatus(project.status || 'Draft');
    setEditDueDate(project.due_date || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put(`/projects/${selectedProjectId}`, { title: editTitle, description: editDescription, status: editStatus, due_date: editDueDate || null });
      setIsEditModalOpen(false);
      fetchProjects();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be lost.')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const isOverdue = (dateString, status) => {
    if (!dateString || status === 'Completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return dateString < today;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'var(--primary-color)';
      case 'Completed': return 'var(--success-color)';
      default: return 'var(--warning-color)';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderKanban size={32} color="var(--primary-color)" />
          Projects
        </h1>
        {user?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading projects...</div>
      ) : (
        <div className="grid-cards">
          {projects.map((project) => (
            <div key={project.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{project.title}</h3>
                  <span className="badge" style={{ backgroundColor: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status), marginBottom: '0.75rem', display: 'inline-block' }}>
                    {project.status || 'Draft'}
                  </span>
                </div>
                
                {user?.role === 'Admin' && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem', background: 'transparent', color: 'var(--primary-color)' }}
                      onClick={() => openEditModal(project)}
                      title="Edit Project"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem', background: 'transparent', color: 'var(--primary-color)' }}
                      onClick={() => { setSelectedProjectId(project.id); setMemberError(''); setMemberEmail(''); setIsMemberModalOpen(true); }}
                      title="Manage Members"
                    >
                      <Users size={16} />
                    </button>
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem', background: 'transparent', color: 'var(--danger-color)' }}
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {project.description}
              </p>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} />
                    {project.members?.length || 0} Members
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ListTodo size={16} />
                    {project.tasks?.length || 0} Tasks
                  </div>
                </div>
                {project.due_date && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOverdue(project.due_date, project.status) ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                    {isOverdue(project.due_date, project.status) ? <AlertCircle size={16} /> : <Calendar size={16} />}
                    Due: {project.due_date} {isOverdue(project.due_date, project.status) ? '(Overdue)' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
               No projects found. {user?.role === 'Admin' ? 'Create one to get started!' : 'Wait for an admin to invite you.'}
             </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="glass modal-content" style={{ padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={24} color="var(--primary-color)" /> Create New Project
            </h2>
            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
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
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date (Optional)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="glass modal-content" style={{ padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2 size={24} color="var(--primary-color)" /> Edit Project Details
            </h2>
            {editError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{editError}</div>}
            <form onSubmit={handleEditProject}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select 
                  className="form-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active (Approved)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date (extend deadline)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {isMemberModalOpen && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setIsMemberModalOpen(false)}>
          <div className="glass modal-content" style={{ padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Users size={24} color="var(--primary-color)" /> Manage Members
              </h2>
              <button className="btn" onClick={() => setIsMemberModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {memberError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{memberError}</div>}
            
            <form onSubmit={handleAddMember} style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add New Member</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label className="form-label">User Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="user@example.com"
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Role</label>
                  <select 
                    className="form-control"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                  <UserPlus size={18} /> Add
                </button>
              </div>
            </form>

            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Current Members</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {projects.find(p => p.id === selectedProjectId)?.members?.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-color)', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.email}</div>
                    </div>
                    {projects.find(p => p.id === selectedProjectId)?.creator?.id === m.id ? (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>Creator</span>
                    ) : (
                      <button 
                        onClick={() => handleRemoveMember(m.id)}
                        className="btn" 
                        style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}
                        title="Remove Member"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
