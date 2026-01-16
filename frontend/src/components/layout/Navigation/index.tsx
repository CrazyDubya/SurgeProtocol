import { Link, useLocation } from 'wouter-preact';
import styles from './Navigation.module.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/missions', label: 'Missions', icon: '◎' },
  { path: '/character', label: 'Character', icon: '◉' },
  { path: '/inventory', label: 'Inventory', icon: '◫' },
] as const;

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav class={styles.nav}>
      <ul class={styles.list}>
        {NAV_ITEMS.map((item) => (
          <li key={item.path} class={styles.item}>
            <Link
              href={item.path}
              class={`${styles.link} ${
                location === item.path ? styles.active : ''
              }`}
            >
              <span class={styles.icon}>{item.icon}</span>
              <span class={styles.label}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
