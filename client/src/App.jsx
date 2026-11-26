import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/auth-context';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import Projects from './components/Projects/Projects';
import Tasks from './components/Tasks/Tasks';
import Team from './components/Team/Team';
import { LoadingState } from './components/ui/States';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Global Admin only (e.g. the Team page)
const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (user?.role !== 'Admin') return <Navigate to="/" replace />;
  return children;
};

// Redirect to home if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingState />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="projects" element={<Projects />} />
      <Route path="tasks" element={<Tasks />} />
      <Route path="team" element={<AdminRoute><Team /></AdminRoute>} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
