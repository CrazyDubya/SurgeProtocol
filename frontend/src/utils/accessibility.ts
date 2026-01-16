/**
 * Accessibility Utilities
 *
 * Helper functions and hooks for accessibility features:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation
 */

import { useEffect, useRef, useCallback } from 'preact/hooks';

/**
 * Announces a message to screen readers using a live region
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('sr-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * Hook for trapping focus within a container (e.g., modals)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(focusableSelector);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing focus when content changes (e.g., route changes)
 */
export function useFocusOnMount(shouldFocus: boolean = true) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        elementRef.current?.focus();
      }, 100);
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Hook for keyboard navigation in a list
 */
export function useArrowKeyNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let newIndex = currentIndex.current;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(currentIndex.current + 1, itemCount - 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(currentIndex.current - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(currentIndex.current);
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex.current) {
        currentIndex.current = newIndex;
        onSelect?.(newIndex);
      }
    },
    [itemCount, onSelect]
  );

  return {
    currentIndex: currentIndex.current,
    setIndex: (index: number) => {
      currentIndex.current = index;
    },
    handleKeyDown,
  };
}

/**
 * Generate unique IDs for ARIA attributes
 */
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to track reduced motion preference
 */
export function useReducedMotion(): boolean {
  const mediaQuery =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  const getInitialState = () => mediaQuery?.matches ?? false;

  const ref = useRef(getInitialState());

  useEffect(() => {
    if (!mediaQuery) return;

    const handler = (e: MediaQueryListEvent) => {
      ref.current = e.matches;
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return ref.current;
}
