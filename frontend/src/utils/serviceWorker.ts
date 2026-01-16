/**
 * Service Worker Registration
 *
 * Handles registration and updates for the PWA service worker.
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Only register in production
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping service worker in development');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[SW] New content available');
            config.onUpdate?.(registration);
          } else {
            // Content cached for offline
            console.log('[SW] Content cached for offline');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[SW] Back online');
      config.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('[SW] Gone offline');
      config.onOffline?.();
    });

  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('[SW] Service worker unregistered');
  } catch (error) {
    console.error('[SW] Unregister failed:', error);
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage('skipWaiting');
}

/**
 * Check if app is running as installed PWA
 */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}
