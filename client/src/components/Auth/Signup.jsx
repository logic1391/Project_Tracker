import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { UserPlus } from 'lucide-react';
import { Alert } from '../ui/States';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await register(name, email, password);
    setIsLoading(false);
    if (result.success) {
      const notice = result.user?.role === 'Admin'
        ? 'Account created. As the first user you are the workspace Admin. Sign in to get started.'
        : 'Account created. Sign in to continue.';
      navigate('/login', { state: { notice, email } });
    } else {
      setError(result.message);
    }
  };

  return (
    <main className="auth-container">
      <div className="glass auth-card">
        <div className="auth-head">
          <div className="auth-icon" aria-hidden="true"><UserPlus size={24} /></div>
          <h1 className="auth-title">Create account</h1>
          <p className="muted">Join Project Tracker today</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              className="form-control"
              placeholder="Jane Doe"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-control"
              autoComplete="new-password"
              aria-describedby="signup-password-hint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <p id="signup-password-hint" className="form-hint">At least 6 characters.</p>
          </div>
          <p className="form-hint" style={{ marginBottom: '1.25rem' }}>
            New accounts join as Members. An Admin can give you more access from the Team page.
          </p>
          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
