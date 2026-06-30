type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
};

// Accessible on/off switch with a state label (e.g. Active / Hidden).
export default function Toggle({ checked, onChange, onLabel = 'On', offLabel = 'Off', disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch-track"><span className="switch-thumb" /></span>
      <span className="switch-label">{checked ? onLabel : offLabel}</span>
    </button>
  );
}
