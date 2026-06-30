import { SHELL_LAYOUTS, type ShellLayout } from '../settings';

// Mini mock-up of each whole-site shell.
function Thumb({ shell }: { shell: ShellLayout }) {
  if (shell === 'topbar') {
    return (
      <div className="lt lt-topbar">
        <div className="lt-bar" />
        <div className="lt-cols"><span /><span /></div>
      </div>
    );
  }
  return (
    <div className="lt lt-classic">
      <div className="lt-hero" />
      <span />
      <span />
    </div>
  );
}

type Props = {
  value: ShellLayout;
  onChange: (value: ShellLayout) => void;
};

export default function ShellPicker({ value, onChange }: Props) {
  return (
    <div className="layout-options" role="radiogroup" aria-label="Site layout">
      {SHELL_LAYOUTS.map((s) => (
        <button
          type="button"
          key={s.value}
          className={`layout-option${s.value === value ? ' on' : ''}`}
          onClick={() => onChange(s.value)}
          role="radio"
          aria-checked={s.value === value}
          title={s.hint}
        >
          <Thumb shell={s.value} />
          <span className="layout-option-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
