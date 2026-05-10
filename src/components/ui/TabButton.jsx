export default function TabButton({ active, state, children, onClick }) {
  return (
    <button className={`tab-button is-${state} ${active ? 'is-active' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}
