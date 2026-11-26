import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X, Users } from 'lucide-react';
import { AuthContext } from '../context/auth-context';
import { initials } from '../utils/format';

const PAGE_TITLES = { '/': 'Dashboard', '/projects': 'Projects', '/tasks': 'Tasks', '/team': 'Team' };

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  // Close the mobile drawer whenever the route changes
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.title = `${PAGE_TITLES[location.pathname] || 'Project Tracker'} · Project Tracker`;
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} aria-hidden="true" /> },
    { name: 'Projects', path: '/projects', icon: <FolderKanban size={20} aria-hidden="true" /> },
    { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} aria-hidden="true" /> },
    ...(user?.role === 'Admin' ? [{ name: 'Team', path: '/team', icon: <Users size={20} aria-hidden="true" /> }] : []),
  ];

  const brand = (
    <Link to="/" className="brand">
      <span className="brand-mark" aria-hidden="true">PT</span>
      <span className="brand-name">Tracker</span>
    </Link>
  );

  return (
    <div className="app-container">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className="mobile-topbar">
        {brand}
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          <Menu size={22} />
        </button>
      </header>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <aside id="app-sidebar" className={`sidebar glass ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {brand}
          {menuOpen && (
            <button type="button" className="icon-btn muted" onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ marginBottom: '1.25rem' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="nav-list">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink to={link.path} end={link.path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  {link.icon}
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar" aria-hidden="true">{initials(user?.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-chip-name">{user?.name}</div>
              <div className="user-chip-role">{user?.role}</div>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="nav-link logout-btn">
            <LogOut size={20} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main id="main" className="main-content" tabIndex={-1}>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
