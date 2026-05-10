export default function StatusBadge({ tone, children }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}
