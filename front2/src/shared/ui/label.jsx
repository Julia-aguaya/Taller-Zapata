export const Label = ({ className = '', ...props }) => (
  <label className={`text-sm font-medium text-foreground ${className}`.trim()} {...props} />
);
