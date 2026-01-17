import { Link, useLocation } from 'wouter-preact';
import styles from './Navigation.module.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◈', description: 'Overview' },
  { path: '/missions', label: 'Missions', icon: '◎', description: 'Jobs & contracts' },
  { path: '/algorithm', label: 'Algorithm', icon: '◇', description: 'AI handler' },
  { path: '/character', label: 'Character', icon: '◉', description: 'Stats & augments' },
  { path: '/inventory', label: 'Inventory', icon: '◫', description: 'Gear & items' },
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
              <div class={styles.text}>
                <span class={styles.label}>{item.label}</span>
                <span class={styles.description}>{item.description}</span>
              </div>
              {location === item.path && <span class={styles.indicator} />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
