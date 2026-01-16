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
      <Header />
      <div class={styles.container}>
        <Navigation />
        <main class={styles.main}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <footer class={styles.footer}>
        <span class={styles.footerText}>
          Surge Protocol // Build 0.3.7 // Neural Link Active
        </span>
      </footer>
    </div>
  );
}
