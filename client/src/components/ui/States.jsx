import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export const LoadingState = ({ label = 'Loading…' }) => (
  <div className="state" role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <div className="glass state" role="alert">
    <div className="state-icon danger"><AlertTriangle size={24} /></div>
    <div className="state-title">{title}</div>
    {message && <p>{message}</p>}
    {onRetry && <button type="button" className="btn btn-secondary" onClick={onRetry}>Try again</button>}
  </div>
);

export const EmptyState = ({ icon, title, children, action }) => (
  <div className="glass state">
    {icon && <div className="state-icon">{icon}</div>}
    <div className="state-title">{title}</div>
    {children && <p>{children}</p>}
    {action}
  </div>
);

const ALERT_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: AlertCircle,
};

export const Alert = ({ type = 'error', children, onDismiss }) => {
  const Icon = ALERT_ICONS[type];
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
      {onDismiss && (
        <button type="button" className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss message">
          <X size={16} />
        </button>
      )}
    </div>
  );
};
