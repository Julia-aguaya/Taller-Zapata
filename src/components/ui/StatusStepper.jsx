export default function StatusStepper({ label, items, activeValue }) {
  return (
    <div className="status-stepper">
      <span>{label}</span>
      <div className="status-stepper-row">
        {items.map((entry) => (
          <button className={`status-step ${activeValue === entry ? 'is-active' : ''}`} disabled key={entry} type="button">
            {entry}
          </button>
        ))}
      </div>
    </div>
  );
}
