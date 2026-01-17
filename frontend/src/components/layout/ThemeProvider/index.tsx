import { createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { signal, computed } from '@preact/signals';
import type { ThemeName } from '@/types';

// Storage key for theme persistence
const THEME_STORAGE_KEY = 'surge-protocol-theme';

// Default theme
const DEFAULT_THEME: ThemeName = 'neon-decay';

// Theme signal for reactive state
const themeSignal = signal<ThemeName>(getInitialTheme());

// Computed for theme class
const themeClass = computed(() => themeSignal.value);

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && isValidTheme(stored)) {
    return stored as ThemeName;
  }

  return DEFAULT_THEME;
}

function isValidTheme(theme: string): theme is ThemeName {
  return [
    'neon-decay',
    'terminal-noir',
    'algorithm-vision',
    'brutalist-cargo',
    'worn-chrome',
    'blood-circuit',
    'ghost-protocol',
  ].includes(theme);
}

// Theme context
interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: readonly ThemeName[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Available themes with metadata
export const THEMES: readonly {
  id: ThemeName;
  name: string;
  tier: 1 | 2;
  description: string;
}[] = [
  {
    id: 'neon-decay',
    name: 'Neon Decay',
    tier: 1,
    description: 'Blade Runner noir with magenta/cyan neon',
  },
  {
    id: 'terminal-noir',
    name: 'Terminal Noir',
    tier: 1,
    description: 'CRT terminal aesthetic, green-on-black',
  },
  {
    id: 'algorithm-vision',
    name: 'Algorithm Vision',
    tier: 1,
    description: 'HUD/surveillance UI with cyan data',
  },
  {
    id: 'brutalist-cargo',
    name: 'Brutalist Cargo',
    tier: 2,
    description: 'Industrial shipping, caution tape',
  },
  {
    id: 'worn-chrome',
    name: 'Worn Chrome',
    tier: 2,
    description: 'Used future with stickers and scratches',
  },
  {
    id: 'blood-circuit',
    name: 'Blood Circuit',
    tier: 2,
    description: 'Aggressive red/black, for the shadows',
  },
  {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    tier: 2,
    description: 'Ethereal pale blues, you were never here',
  },
] as const;

// Theme Provider Component
interface ThemeProviderProps {
  children: preact.ComponentChildren;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  // Initialize theme
  useEffect(() => {
    if (defaultTheme && isValidTheme(defaultTheme)) {
      themeSignal.value = defaultTheme;
    }
  }, [defaultTheme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeSignal.value);
    localStorage.setItem(THEME_STORAGE_KEY, themeSignal.value);
  }, [themeSignal.value]);

  const setTheme = (theme: ThemeName) => {
    if (isValidTheme(theme)) {
      themeSignal.value = theme;
    }
  };

  const value: ThemeContextValue = {
    theme: themeSignal.value,
    setTheme,
    themes: THEMES.map((t) => t.id),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Export theme signal for direct access in components
export { themeSignal, themeClass };
