import { ComponentChildren } from 'preact';
import { Header } from '../Header';
import { Navigation } from '../Navigation';
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
        <main class={styles.main}>{children}</main>
      </div>
    </div>
  );
}
