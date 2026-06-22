import '../assets/styles/SuspendModal.css';

export default function SuspendModal({
  isOpen = true,
  onClose = () => {},
  onConfirm = () => {},
  title = "Confirm suspend account?",
  message = "Are you sure? Do you want to suspend this account?",
}) {
  if (!isOpen) return null;

  return (
    <div className="sm-backdrop" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-header">
          <span className="sm-title">{title}</span>
          <button className="sm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="sm-body">{message}</div>
        <div className="sm-actions">
          <button className="sm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sm-btn-suspend" onClick={onConfirm}>Suspend account</button>
        </div>
      </div>
    </div>
  );
}