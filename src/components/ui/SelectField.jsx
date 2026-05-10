import FieldLabel from './FieldLabel';

export default function SelectField({ label, value, onChange, options, required = false, invalid = false, highlighted = false, placeholder = '', disabled = false }) {
  const normalizedOptions = options
    .map((option) => (typeof option === 'string' ? { value: option, label: option || '—' } : option))
    .filter((option) => !(placeholder && (option.value ?? option.label) === ''));
  const resolvedValue = value ?? '';

  return (
    <label className={`field ${invalid ? 'is-invalid' : ''} ${highlighted ? 'is-autofilled' : ''}`}>
      <FieldLabel label={label} required={required} />
      <select disabled={disabled} onChange={(event) => onChange(event.target.value)} value={resolvedValue}>
        {placeholder ? (
          <option value="">
            {placeholder}
          </option>
        ) : null}
        {normalizedOptions.map((option) => {
          const optionValue = option.value ?? option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
