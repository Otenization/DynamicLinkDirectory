import { LAYOUT_THEMES, type LayoutTheme } from '../settings';

// Tiny CSS mock-up of each layout so the admin can see its shape at a glance.
function Thumb({ theme }: { theme: LayoutTheme }) {
  switch (theme) {
    case 'compact':
      return <div className="lt lt-compact"><i /><i /><i /><i /></div>;
    case 'tiles':
      return <div className="lt lt-tiles"><b /><b /><b /><b /><b /><b /></div>;
    case 'single':
      return <div className="lt lt-single"><span /><span /><span /></div>;
    case 'sidebar':
      return (
        <div className="lt lt-sidebar">
          <div className="lt-side" />
          <div className="lt-body"><span /><span /></div>
        </div>
      );
    case 'cards':
    default:
      return (
        <div className="lt lt-cards">
          <div className="lt-col"><span /><span /></div>
          <div className="lt-col"><span /><span /></div>
        </div>
      );
  }
}

type Props = {
  value: LayoutTheme;
  onChange: (value: LayoutTheme) => void;
};

export default function LayoutPicker({ value, onChange }: Props) {
  return (
    <div className="layout-options" role="radiogroup" aria-label="Directory layout">
      {LAYOUT_THEMES.map((t) => (
        <button
          type="button"
          key={t.value}
          className={`layout-option${t.value === value ? ' on' : ''}`}
          onClick={() => onChange(t.value)}
          role="radio"
          aria-checked={t.value === value}
          title={t.hint}
        >
          <Thumb theme={t.value} />
          <span className="layout-option-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
