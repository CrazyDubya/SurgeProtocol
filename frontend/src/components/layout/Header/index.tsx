import { Link } from 'wouter-preact';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { WorldClockDisplay } from '@components/game';
import styles from './Header.module.css';

export function Header() {
  return (
    <header class={styles.header}>
      <div class={styles.container}>
        <Link href="/" class={styles.logo}>
          <span class={styles.logoIcon}>◈</span>
          <span class={styles.logoText}>Surge Protocol</span>
        </Link>

        <div class={styles.center}>
          <WorldClockDisplay compact />
        </div>

        <div class={styles.right}>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
