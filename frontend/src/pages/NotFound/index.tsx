import { Link } from 'wouter-preact';

export function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        color: 'var(--accent-danger)',
        marginBottom: 'var(--space-4)'
      }}>
        404
      </h1>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--space-6)'
      }}>
        Location Not Found
      </p>
      <p style={{ color: 'var(--text-dim)', marginBottom: 'var(--space-6)' }}>
        The Algorithm cannot locate this destination.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: 'var(--space-3) var(--space-6)',
          background: 'var(--accent-algorithm)',
          color: 'var(--bg-primary)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          fontFamily: 'var(--font-ui)'
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
