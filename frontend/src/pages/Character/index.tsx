export function Character() {
  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        color: 'var(--accent-algorithm)',
        marginBottom: 'var(--space-6)'
      }}>
        Character
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Character screen will be implemented in Day 6.
      </p>
    </div>
  );
}
