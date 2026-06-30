import { useState } from 'react';
import { login, type AuthUser } from '../auth';

type Props = {
  onLoggedIn?: (user: AuthUser) => void;
  heading?: string;
  subtext?: string;
};

export default function LoginGate({ onLoggedIn, heading = 'Sign in', subtext = 'Enter your credentials to continue.' }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const u = await login(username.trim(), password);
      onLoggedIn?.(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-stack">
      <article className="panel login-card">
        <p className="eyebrow">Sign in</p>
        <h2>{heading}</h2>
        <p className="muted-copy">{subtext}</p>

        {error ? <p className="message error">{error}</p> : null}

        <label className="field"><span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label className="field"><span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
          />
        </label>

        <div className="button-row">
          <button className="primary-btn" onClick={() => void submit()} disabled={busy || !username || !password}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </article>
    </section>
  );
}
