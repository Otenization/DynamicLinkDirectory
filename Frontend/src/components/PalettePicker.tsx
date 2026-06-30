import { THEME_PALETTES, type ThemePalette } from '../settings';

type Props = {
  value: ThemePalette;
  onChange: (value: ThemePalette) => void;
};

// Quick-pick ambient palettes shown as a base swatch with its two glow tints.
export default function PalettePicker({ value, onChange }: Props) {
  return (
    <div className="layout-options" role="radiogroup" aria-label="Theme palette">
      {THEME_PALETTES.map((p) => (
        <button
          type="button"
          key={p.value}
          className={`layout-option${p.value === value ? ' on' : ''}`}
          onClick={() => onChange(p.value)}
          role="radio"
          aria-checked={p.value === value}
          title={p.label}
        >
          <div className="palette-thumb" style={{ background: p.bg }}>
            <span style={{ background: p.glow1 }} />
            <span style={{ background: p.glow2 }} />
          </div>
          <span className="layout-option-label">{p.label}</span>
        </button>
      ))}
    </div>
  );
}
