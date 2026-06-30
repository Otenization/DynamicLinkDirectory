import { apiUrl } from './config';
import { authedFetch } from './auth';

export type LayoutTheme = 'cards' | 'compact' | 'tiles' | 'single' | 'sidebar';

export type SiteSettings = {
  site_title: string;
  site_subtitle: string;
  layout_theme: LayoutTheme;
  theme_color: string;
};

// Selectable (preset, not customizable) directory layouts. Each carries a muted
// default accent color. Add new presets here and handle them in DirectoryPage;
// the admin dropdown is generated from this list.
export const LAYOUT_THEMES: { value: LayoutTheme; label: string; hint: string; defaultColor: string }[] = [
  { value: 'cards', label: 'Cards', hint: 'Roomy panels in columns with link cards (default).', defaultColor: '#a8623f' },
  { value: 'compact', label: 'Compact list', hint: 'Dense rows, more links per screen.', defaultColor: '#4c6b8a' },
  { value: 'tiles', label: 'Tiles', hint: 'Grid of icon + title tiles, like an app launcher.', defaultColor: '#4f7a64' },
  { value: 'single', label: 'Single column', hint: 'One full-width column of categories.', defaultColor: '#5d6470' },
  { value: 'sidebar', label: 'Sidebar (dashboard)', hint: 'Simple header with a left category menu and a content pane.', defaultColor: '#3c4a63' },
];

const VALID_THEMES = LAYOUT_THEMES.map((t) => t.value);

export function normalizeTheme(value: unknown): LayoutTheme {
  return VALID_THEMES.includes(value as LayoutTheme) ? (value as LayoutTheme) : 'cards';
}

export function defaultColorFor(theme: LayoutTheme): string {
  return LAYOUT_THEMES.find((t) => t.value === theme)?.defaultColor || '#a8623f';
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

// Effective accent = explicit theme_color if valid, else the layout's default.
export function resolveAccent(settings: Partial<SiteSettings> | null | undefined): string {
  const theme = normalizeTheme(settings?.layout_theme);
  const c = settings?.theme_color || '';
  return isHexColor(c) ? c : defaultColorFor(theme);
}

// Derive accent / accent-deep / accent-soft CSS variables from a single hex color.
export function accentVars(color: string): Record<string, string> {
  const base = isHexColor(color) ? color : '#a8623f';
  return {
    '--accent': base,
    '--accent-deep': shade(base, -0.42),
    '--accent-soft': shade(base, 0.78),
  };
}

function shade(hex: string, t: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const target = t < 0 ? 0 : 255;
  const amt = Math.abs(t);
  const mix = (x: number) => Math.round(x + (target - x) * amt);
  const toHex = (x: number) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

// Public read of site settings (title/subtitle shown in the hero).
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await fetch(apiUrl('/api/settings'));
    const result = await response.json();
    if (!response.ok || !result?.ok) return null;
    return result.data as SiteSettings;
  } catch {
    return null;
  }
}

// Admin update (requires auth). Returns the full updated settings object.
export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  return authedFetch('/api/settings', { method: 'PUT', body: JSON.stringify(patch) });
}
