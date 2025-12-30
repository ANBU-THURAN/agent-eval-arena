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
          borderBottom: '1px solid var(--border-primary)',
          height: 'var(--header-height)',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 var(--space-md)',
          }}
        >
          <h1 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600 }}>
            Agent Evaluation Arena
          </h1>

          <nav style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Link
              to="/"
              style={{
                color: isActive('/') ? 'var(--color-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/') ? 600 : 400,
                fontSize: 'var(--font-size-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color var(--transition)',
              }}
            >
              Live
            </Link>
            <Link
              to="/charts"
              style={{
                color: isActive('/charts') ? 'var(--color-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/charts') ? 600 : 400,
                fontSize: 'var(--font-size-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color var(--transition)',
              }}
            >
              Charts
            </Link>
            <Link
              to="/leaderboard"
              style={{
                color: isActive('/leaderboard') ? 'var(--color-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/leaderboard') ? 600 : 400,
                fontSize: 'var(--font-size-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color var(--transition)',
              }}
            >
              Leaderboard
            </Link>
            <Link
              to="/archive"
              style={{
                color: isActive('/archive') ? 'var(--color-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/archive') ? 600 : 400,
                fontSize: 'var(--font-size-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color var(--transition)',
              }}
            >
              Archive
            </Link>
            <Link
              to="/comparison"
              style={{
                color: isActive('/comparison') ? 'var(--color-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: isActive('/comparison') ? 600 : 400,
                fontSize: 'var(--font-size-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'color var(--transition)',
              }}
            >
              Compare
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 'var(--space-md)' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-primary)',
          height: 'var(--footer-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          color: 'var(--text-tertiary)',
          fontSize: 'var(--font-size-secondary)',
        }}>
          Agent Evaluation Arena
        </span>
      </footer>
    </div>
  );
}
