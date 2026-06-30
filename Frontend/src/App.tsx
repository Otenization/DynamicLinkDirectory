import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { getAppConfig } from './config';
import { fetchSiteSettings, resolveAccent, accentVars, paletteVars, defaultColorFor, normalizeShell, normalizePalette, logoUrl, type ShellLayout, type ThemePalette } from './settings';
import DirectoryPage from './pages/DirectoryPage';
import AdminPage from './pages/AdminPage';
import './index.css';

const heroNavClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'app-nav-link active' : 'app-nav-link');
const topNavClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'topbar-link active' : 'topbar-link');

export default function App() {
  const config = getAppConfig();
  // Hero text, accent, palette, and the whole-site shell all come from DB-backed settings.
  const [title, setTitle] = useState(config.app.name);
  const [subtitle, setSubtitle] = useState(config.app.subtitle);
  const [accent, setAccent] = useState(defaultColorFor('cards'));
  const [shell, setShell] = useState<ShellLayout>('classic');
  const [palette, setPalette] = useState<ThemePalette>('warm');
  const [hasLogo, setHasLogo] = useState(false);
  const [logoTick, setLogoTick] = useState(0); // cache-bust the logo after changes

  const loadSettings = async () => {
    const settings = await fetchSiteSettings();
    if (settings) {
      setTitle(settings.site_title || config.app.name);
      setSubtitle(settings.site_subtitle || config.app.subtitle);
      setAccent(resolveAccent(settings));
      setShell(normalizeShell(settings.shell_layout));
      setPalette(normalizePalette(settings.theme_palette));
      setHasLogo(!!settings.has_logo);
      setLogoTick((t) => t + 1);
    }
  };

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply accent + palette as CSS variables on the document root so the page
  // background (on <html>) and every component pick them up.
  useEffect(() => {
    const root = document.documentElement;
    const vars = { ...accentVars(accent), ...paletteVars(palette) };
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }
  }, [accent, palette]);

  const routes = (
    <Routes>
      <Route path="/" element={<DirectoryPage />} />
      <Route path="/admin" element={<AdminPage onSettingsSaved={loadSettings} />} />
    </Routes>
  );

  return (
    <BrowserRouter>
      {shell === 'topbar' ? (
        <div className="topbar-app">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="topbar-brand">
                {hasLogo
                  ? <img className="brand-logo" src={logoUrl(logoTick)} alt="" />
                  : <span className="brand-mark" aria-hidden="true" />}
                <div className="brand-text">
                  <strong>{title}</strong>
                  {subtitle ? <span>{subtitle}</span> : null}
                </div>
              </div>
              <nav className="topbar-nav" aria-label="Primary">
                <NavLink to="/" end className={topNavClass}>Directory</NavLink>
                <NavLink to="/admin" className={topNavClass}>Admin</NavLink>
              </nav>
            </div>
          </header>
          <div className="topbar-content">{routes}</div>
        </div>
      ) : (
        <main className="app-shell">
          <div className="app-glow app-glow-left" aria-hidden="true" />
          <div className="app-glow app-glow-right" aria-hidden="true" />

          <section className="app-frame">
            <header className="hero">
              {hasLogo ? <img className="hero-logo" src={logoUrl(logoTick)} alt="" /> : null}
              <p className="hero-kicker">Web Portal</p>
              <h1>{title}</h1>
              <p className="hero-copy">{subtitle}</p>
            </header>

            <nav className="app-nav" aria-label="Primary">
              <NavLink to="/" end className={heroNavClass}>Directory</NavLink>
              <NavLink to="/admin" className={heroNavClass}>Admin</NavLink>
            </nav>

            {routes}
          </section>
        </main>
      )}
    </BrowserRouter>
  );
}
