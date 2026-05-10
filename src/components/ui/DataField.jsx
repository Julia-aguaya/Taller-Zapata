import FieldLabel from './FieldLabel';

export default function DataField({ label, value, onChange, type = 'text', placeholder = '', required = false, invalid = false, readOnly = false, disabled = false, inputMode, highlighted = false }) {
  return (
    <label className={`field ${invalid ? 'is-invalid' : ''} ${highlighted ? 'is-autofilled' : ''}`}>
      <FieldLabel label={label} required={required} />
      <input disabled={disabled} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} readOnly={readOnly} type={type} value={value} />
    </label>
  );
}
