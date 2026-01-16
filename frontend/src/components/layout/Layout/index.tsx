/**
 * Layout Component
 *
 * Main application shell with accessibility features:
 * - Skip link for keyboard users to bypass navigation
 * - Proper ARIA landmarks (banner, navigation, main, contentinfo)
 * - Focus management on route changes
 */

import { ComponentChildren } from 'preact';
import { Header } from '../Header';
import { Navigation } from '../Navigation';
import { PageTransition } from '../PageTransition';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div class={styles.layout}>
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" class={styles.skipLink}>
        Skip to main content
      </a>

      <Header />

      <div class={styles.container}>
        <Navigation />
        <main id="main-content" class={styles.main} tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <footer class={styles.footer} role="contentinfo">
        <span class={styles.footerText}>
          Surge Protocol // Build 0.3.7 // Neural Link Active
        </span>
      </footer>
    </div>
  );
}
