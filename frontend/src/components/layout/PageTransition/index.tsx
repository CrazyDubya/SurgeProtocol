import { ComponentChildren } from 'preact';
import { useLocation } from 'wouter-preact';
import { useEffect, useState } from 'preact/hooks';
import styles from './PageTransition.module.css';

type TransitionVariant = 'default' | 'fade' | 'slide' | 'glitch' | 'stagger';

interface PageTransitionProps {
  children: ComponentChildren;
  variant?: TransitionVariant;
  stagger?: boolean;
}

export function PageTransition({
  children,
  variant = 'default',
  stagger = false,
}: PageTransitionProps) {
  const [location] = useLocation();
  const [key, setKey] = useState(location);

  // Re-trigger animation on route change
  useEffect(() => {
    setKey(location);
  }, [location]);

  const variantClass = {
    default: styles.transition,
    fade: `${styles.transition} ${styles.fade}`,
    slide: `${styles.transition} ${styles.slide}`,
    glitch: `${styles.transition} ${styles.glitch}`,
    stagger: styles.transition,
  }[variant];

  return (
    <div
      key={key}
      class={`${variantClass} ${stagger ? styles.stagger : ''}`}
    >
      {children}
    </div>
  );
}

// Utility component for staggered list items
interface StaggeredListProps {
  children: ComponentChildren;
  delay?: number;
}

export function StaggeredList({ children }: StaggeredListProps) {
  return <div class={styles.stagger}>{children}</div>;
}
