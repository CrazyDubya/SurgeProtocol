import { useState, useRef, useEffect } from 'preact/hooks';
import { useTheme, THEMES } from '../ThemeProvider';
import type { ThemeName } from '@/types';
import styles from './ThemeSwitcher.module.css';

// Theme color palettes for swatches
const THEME_COLORS: Record<ThemeName, string[]> = {
  'neon-decay': ['#0d0d12', '#ff2e88', '#00d4ff', '#b967ff'],
  'terminal-noir': ['#0a0a0a', '#00ff41', '#003b00', '#00ff41'],
  'algorithm-vision': ['#0a0f14', '#00e5ff', '#1a237e', '#ff6d00'],
  'brutalist-cargo': ['#1a1a1a', '#ffab00', '#263238', '#ff5722'],
  'worn-chrome': ['#1e1e1e', '#90a4ae', '#455a64', '#ff7043'],
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES.find((t) => t.id === theme);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleThemeSelect = (themeId: ThemeName) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      class={`${styles.switcher} ${isOpen ? styles.open : ''}`}
    >
      <button
        class={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          class={styles.triggerSwatch}
          style={{ background: THEME_COLORS[theme][1] }}
        />
        <span class={styles.triggerLabel}>{currentTheme?.name}</span>
        <span class={styles.triggerIcon}>▼</span>
      </button>

      <div class={styles.dropdown} role="listbox" aria-label="Select theme">
        <div class={styles.dropdownHeader}>
          <h3 class={styles.dropdownTitle}>Visual Theme</h3>
        </div>

        <div class={styles.themeList}>
          {THEMES.map((t) => (
            <div
              key={t.id}
              class={`${styles.themeItem} ${
                theme === t.id ? styles.active : ''
              }`}
              role="option"
              aria-selected={theme === t.id}
              onClick={() => handleThemeSelect(t.id)}
            >
              <div class={styles.themeSwatch}>
                {THEME_COLORS[t.id].map((color, i) => (
                  <div
                    key={i}
                    class={styles.swatchColor}
                    style={{ background: color }}
                  />
                ))}
              </div>

              <div class={styles.themeInfo}>
                <div class={styles.themeName}>
                  {t.name}
                  <span
                    class={`${styles.themeTier} ${
                      t.tier === 1 ? styles.tier1 : ''
                    }`}
                  >
                    T{t.tier}
                  </span>
                </div>
                <div class={styles.themeDescription}>{t.description}</div>
              </div>

              <span class={styles.checkIndicator}>◆</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
