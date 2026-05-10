export default function FieldLabel({ label, required = false }) {
  return (
    <span>
      {label}
      {required ? <em className="required-indicator" aria-hidden="true">*</em> : null}
    </span>
  );
}
