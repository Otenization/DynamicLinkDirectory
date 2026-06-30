import { apiUrl } from './config';
import { authedFetch } from './auth';

export type LayoutTheme = 'cards' | 'compact' | 'tiles' | 'single' | 'sidebar';
export type ShellLayout = 'classic' | 'topbar';
export type ThemePalette = 'warm' | 'cool' | 'mint' | 'rose' | 'slate';

export type SiteSettings = {
  site_title: string;
  site_subtitle: string;
  layout_theme: LayoutTheme;
  theme_color: string;
  shell_layout: ShellLayout;
  theme_palette: ThemePalette;
  has_logo: boolean;
};

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

// URL for the stored logo. Pass a changing `version` to bust the browser cache
// after an upload/remove.
export function logoUrl(version?: string | number): string {
  const base = apiUrl('/api/settings/logo');
  return version ? `${base}?v=${version}` : base;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadLogo(file: File): Promise<void> {
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Logo must be 5 MB or smaller.');
  }
  const dataUrl = await readAsDataURL(file);
  const comma = dataUrl.indexOf(',');
  const mime = dataUrl.slice(5, dataUrl.indexOf(';')) || file.type;
  const base64 = dataUrl.slice(comma + 1);
  await authedFetch('/api/settings/logo', {
    method: 'POST',
    body: JSON.stringify({ mime_type: mime, data: base64 }),
  });
}

export async function deleteLogo(): Promise<void> {
  await authedFetch('/api/settings/logo', { method: 'DELETE' });
}

// Ambient background palettes: a base color + two corner-glow tints
// (primary / secondary). Quick-pick presets; add more here.
type Palette = {
  value: ThemePalette;
  label: string;
  bg: string;       // page base
  glow1: string;    // primary corner glow
  glow2: string;    // secondary corner glow
  panel: string;    // panel surface
  card: string;     // inner card / pill / button surface
  line: string;     // borders
  shadow: string;   // panel shadow
};

export const THEME_PALETTES: Palette[] = [
  { value: 'warm', label: 'Warm (orange · green)', bg: '#f3efe7', glow1: '#f0bba1', glow2: '#bfd8ca', panel: 'rgba(255,251,244,0.9)', card: 'rgba(255,250,240,0.85)', line: '#e6ddcd', shadow: 'rgba(65,34,13,0.1)' },
  { value: 'cool', label: 'Cool (blue · gray)', bg: '#eef1f6', glow1: '#a9c6e8', glow2: '#cdd5e0', panel: 'rgba(252,253,255,0.92)', card: 'rgba(243,246,251,0.9)', line: '#dde3ec', shadow: 'rgba(30,45,70,0.1)' },
  { value: 'mint', label: 'Mint (green · teal)', bg: '#eef3ee', glow1: '#bfe0c8', glow2: '#bcd9d6', panel: 'rgba(250,253,250,0.92)', card: 'rgba(238,246,240,0.9)', line: '#d9e6dd', shadow: 'rgba(20,55,40,0.1)' },
  { value: 'rose', label: 'Rose (pink · lavender)', bg: '#f6eef1', glow1: '#f0c2cf', glow2: '#d6cde8', panel: 'rgba(255,250,252,0.92)', card: 'rgba(248,238,243,0.9)', line: '#ecd9e2', shadow: 'rgba(70,30,50,0.1)' },
  { value: 'slate', label: 'Slate (neutral gray)', bg: '#eef0f3', glow1: '#cdd3dc', glow2: '#d8dde4', panel: 'rgba(251,252,253,0.92)', card: 'rgba(241,243,246,0.9)', line: '#dfe3e9', shadow: 'rgba(40,45,55,0.1)' },
];

const VALID_PALETTES = THEME_PALETTES.map((p) => p.value);

export function normalizePalette(value: unknown): ThemePalette {
  return VALID_PALETTES.includes(value as ThemePalette) ? (value as ThemePalette) : 'warm';
}

export function paletteVars(value: ThemePalette): Record<string, string> {
  const p = THEME_PALETTES.find((x) => x.value === value) || THEME_PALETTES[0];
  return {
    '--bg': p.bg,
    '--glow-1': p.glow1,
    '--glow-2': p.glow2,
    '--panel': p.panel,
    '--panel-strong': p.panel,
    '--card': p.card,
    '--line': p.line,
    '--shadow': p.shadow,
  };
}

// Whole-site chrome (page header/nav arrangement). Add new shells here and
// handle them in App.tsx; the admin picker is generated from this list.
export const SHELL_LAYOUTS: { value: ShellLayout; label: string; hint: string }[] = [
  { value: 'classic', label: 'Classic hero', hint: 'Large title header with pill navigation (template default).' },
  { value: 'topbar', label: 'Top bar', hint: 'Slim sticky header bar at the top with inline navigation, like a typical web app.' },
];

const VALID_SHELLS = SHELL_LAYOUTS.map((s) => s.value);

export function normalizeShell(value: unknown): ShellLayout {
  return VALID_SHELLS.includes(value as ShellLayout) ? (value as ShellLayout) : 'classic';
}

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
