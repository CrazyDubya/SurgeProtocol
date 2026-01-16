import { Link } from 'wouter-preact';
import { useTheme, THEMES } from '../ThemeProvider';
import styles from './Header.module.css';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header class={styles.header}>
      <div class={styles.container}>
        <Link href="/" class={styles.logo}>
          <span class={styles.logoText}>Surge Protocol</span>
        </Link>

        <div class={styles.right}>
          {/* Theme switcher */}
          <div class={styles.themeSwitcher}>
            <label class={styles.themeLabel} htmlFor="theme-select">
              Theme:
            </label>
            <select
              id="theme-select"
              class={styles.themeSelect}
              value={theme}
              onChange={(e) =>
                setTheme((e.target as HTMLSelectElement).value as any)
              }
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
