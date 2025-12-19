import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Agent Evaluation Arena
          </h1>

          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/"
              style={{
                color: isActive('/') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/') ? 'bold' : 'normal',
                transition: 'color 0.2s',
              }}
            >
              Home (Live Trading)
            </Link>
            <Link
              to="/charts"
              style={{
                color: isActive('/charts')
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/charts') ? 'bold' : 'normal',
                transition: 'color 0.2s',
              }}
            >
              Charts
            </Link>
            <Link
              to="/leaderboard"
              style={{
                color: isActive('/leaderboard')
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/leaderboard') ? 'bold' : 'normal',
                transition: 'color 0.2s',
              }}
            >
              Leaderboard
            </Link>
            <Link
              to="/archive"
              style={{
                color: isActive('/archive')
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/archive') ? 'bold' : 'normal',
                transition: 'color 0.2s',
              }}
            >
              Past Sessions
            </Link>
            <Link
              to="/comparison"
              style={{
                color: isActive('/comparison')
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/comparison') ? 'bold' : 'normal',
                transition: 'color 0.2s',
              }}
            >
              Compare Agents
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>{children}</div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        Agent Evaluation Arena - Autonomous AI Commodities Trading Competition
      </footer>
    </div>
  );
}
