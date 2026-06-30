import { useEffect, useState, type CSSProperties } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { getAppConfig } from './config';
import { fetchSiteSettings, resolveAccent, accentVars, defaultColorFor } from './settings';
import DirectoryPage from './pages/DirectoryPage';
import AdminPage from './pages/AdminPage';
import './index.css';

export default function App() {
  const config = getAppConfig();
  // Hero text + accent come from DB-backed site settings, falling back to defaults.
  const [title, setTitle] = useState(config.app.name);
  const [subtitle, setSubtitle] = useState(config.app.subtitle);
  const [accent, setAccent] = useState(defaultColorFor('cards'));

  const loadSettings = async () => {
    const settings = await fetchSiteSettings();
    if (settings) {
      setTitle(settings.site_title || config.app.name);
      setSubtitle(settings.site_subtitle || config.app.subtitle);
      setAccent(resolveAccent(settings));
    }
  };

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <main className="app-shell" style={accentVars(accent) as CSSProperties}>
        <div className="app-glow app-glow-left" aria-hidden="true" />
        <div className="app-glow app-glow-right" aria-hidden="true" />

        <section className="app-frame">
          <header className="hero">
            <p className="hero-kicker">Web Portal</p>
            <h1>{title}</h1>
            <p className="hero-copy">{subtitle}</p>
          </header>

          <nav className="app-nav" aria-label="Primary">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>
              Directory
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>
              Admin
            </NavLink>
          </nav>

          <Routes>
            <Route path="/" element={<DirectoryPage />} />
            <Route path="/admin" element={<AdminPage onSettingsSaved={loadSettings} />} />
          </Routes>
        </section>
      </main>
    </BrowserRouter>
  );
}
