import SelectField from './SelectField';

export default function ToggleField(props) {
  return <SelectField {...props} options={['', 'SI', 'NO']} />;
}
