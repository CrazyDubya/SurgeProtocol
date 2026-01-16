import styles from './Dashboard.module.css';

export function Dashboard() {
  return (
    <div class={styles.dashboard}>
      <h1 class={styles.title}>Dashboard</h1>
      <p class={styles.placeholder}>
        Dashboard content will be implemented in Day 3.
      </p>

      {/* Placeholder cards */}
      <div class={styles.grid}>
        <div class={styles.card}>
          <h2 class={styles.cardTitle}>Character</h2>
          <p>HP, Humanity, XP, Rating</p>
        </div>
        <div class={styles.card}>
          <h2 class={styles.cardTitle}>Active Mission</h2>
          <p>Current delivery status</p>
        </div>
        <div class={styles.card}>
          <h2 class={styles.cardTitle}>Available Missions</h2>
          <p>Quick mission list</p>
        </div>
        <div class={styles.card}>
          <h2 class={styles.cardTitle}>Algorithm</h2>
          <p>The Algorithm speaks...</p>
        </div>
      </div>
    </div>
  );
}
