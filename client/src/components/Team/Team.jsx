import { useState, useEffect, useContext } from 'react';
import { Users } from 'lucide-react';
import { AuthContext } from '../../context/auth-context';
import api from '../../services/api';
import { LoadingState, ErrorState, Alert } from '../ui/States';
import { apiError, initials, plural } from '../../utils/format';

// Global Admin page: everyone in the workspace and their global role
const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState(null); // { type, text }
  const [savingId, setSavingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    let ignore = false;
    api.get('/users')
      .then(res => { if (!ignore) { setUsers(res.data); setLoadError(''); } })
      .catch(err => { if (!ignore) setLoadError(apiError(err, 'Could not load the team.')); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refreshKey]);

  const adminCount = users.filter(u => u.role === 'Admin').length;

  const handleRoleChange = async (member, role) => {
    if (member.id === currentUser?.id && role !== 'Admin'
      && !window.confirm('Remove your own Admin access? You will lose access to this page.')) {
      return;
    }
    setMessage(null);
    setSavingId(member.id);
    try {
      await api.put(`/users/${member.id}/role`, { role });
      if (member.id === currentUser?.id && role !== 'Admin') {
        // Our own role changed: reload so the whole app picks it up
        window.location.assign('/');
        return;
      }
      setUsers(prev => prev.map(u => u.id === member.id ? { ...u, role } : u));
      setMessage({ type: 'success', text: `${member.name} is now ${role === 'Admin' ? 'an Admin' : 'a Member'}.` });
    } catch (err) {
      setMessage({ type: 'error', text: apiError(err, 'Failed to change role') });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={30} aria-hidden="true" /> Team</h1>
          <p className="page-subtitle">
            {loading || loadError ? 'Manage who can administer the workspace.' : `${plural(users.length, 'person', 'people')} · ${plural(adminCount, 'admin')}`}
          </p>
        </div>
      </div>

      {message && <Alert type={message.type} onDismiss={() => setMessage(null)}>{message.text}</Alert>}

      {loading ? (
        <LoadingState label="Loading team…" />
      ) : loadError ? (
        <ErrorState title="Team unavailable" message={loadError} onRetry={() => { setLoading(true); setRefreshKey(k => k + 1); }} />
      ) : (
        <>
          <Alert type="info">
            Admins can create and delete projects, manage every project and change roles here.
            Members only see projects they belong to. To let someone manage a single project, make them a project Admin from that project's Members dialog instead.
          </Alert>
          <section className="card glass" aria-label="Team members">
            <table className="team-table">
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Role</th>
                  <th scope="col" className="num">Projects</th>
                  <th scope="col" className="num">Open tasks</th>
                </tr>
              </thead>
              <tbody>
                {users.map(member => {
                  const isLastAdmin = member.role === 'Admin' && adminCount <= 1;
                  const isMe = member.id === currentUser?.id;
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="team-person">
                          <div className="avatar" aria-hidden="true">{initials(member.name)}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="team-name">
                              {member.name} {isMe && <span className="badge badge-neutral badge-plain">You</span>}
                            </div>
                            <div className="team-email">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="role-cell">
                          <select
                            className="form-control form-control-sm"
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value)}
                            disabled={isLastAdmin || savingId === member.id}
                            aria-label={`Role for ${member.name}`}
                            aria-describedby={isLastAdmin ? `last-admin-${member.id}` : undefined}
                          >
                            <option value="Member">Member</option>
                            <option value="Admin">Admin</option>
                          </select>
                          {isLastAdmin && (
                            <span id={`last-admin-${member.id}`} className="form-hint" style={{ marginTop: 0 }}>Last admin</span>
                          )}
                        </div>
                      </td>
                      <td className="num" data-label="Projects">{member.projectCount}</td>
                      <td className="num" data-label="Open tasks">{member.openTaskCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
};

export default Team;
