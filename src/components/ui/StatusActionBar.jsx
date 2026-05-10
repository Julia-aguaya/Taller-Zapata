export default function StatusActionBar({ label, actions, onSelect }) {
  return (
    <div className="status-stepper">
      <span>{label}</span>
      <div className="status-stepper-row">
        {actions.map((action) => (
          <button
            className={`status-step ${action.active ? 'is-active' : ''}`}
            disabled={action.disabled}
            key={action.label}
            onClick={() => onSelect(action)}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
