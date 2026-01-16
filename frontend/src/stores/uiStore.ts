/**
 * UI Store - Global UI state management
 *
 * Handles:
 * - Toast notifications
 * - Modal dialogs
 * - Global loading states
 * - Navigation state
 * - Sidebar/panel state
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
  createdAt: number;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  onClose?: () => void;
}

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

// Toasts
export const toasts = signal<Toast[]>([]);
const toastIdCounter = signal(0);

// Modals
export const modals = signal<Modal[]>([]);
export const confirmDialog = signal<ConfirmDialog | null>(null);

// Loading
export const globalLoading = signal(false);
export const globalLoadingMessage = signal<string | null>(null);

// Navigation
export const isSidebarCollapsed = signal(false);
export const isMobileMenuOpen = signal(false);
export const currentRoute = signal('/');

// Panels
export const isDetailPanelOpen = signal(false);
export const detailPanelContent = signal<string | null>(null);

// Connection status
export const isOnline = signal(navigator.onLine);
export const connectionStatus = signal<'connected' | 'connecting' | 'disconnected'>('connected');

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Has any active toasts */
export const hasToasts = computed(() => toasts.value.length > 0);

/** Has any open modals */
export const hasModals = computed(() => modals.value.length > 0);

/** Top modal (for stacking) */
export const topModal = computed(() =>
  modals.value.length > 0 ? modals.value[modals.value.length - 1] : null
);

/** Is any loading happening */
export const isAnyLoading = computed(() => globalLoading.value);

/** Should show offline banner */
export const showOfflineBanner = computed(() =>
  !isOnline.value || connectionStatus.value === 'disconnected'
);

// =============================================================================
// TOAST ACTIONS
// =============================================================================

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options?: { duration?: number; action?: ToastAction }
): string {
  const id = `toast-${++toastIdCounter.value}`;
  const duration = options?.duration ?? getDefaultDuration(type);

  const toast: Toast = {
    id,
    message,
    type,
    duration,
    action: options?.action,
    createdAt: Date.now(),
  };

  toasts.value = [...toasts.value, toast];

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

/**
 * Dismiss a toast
 */
export function dismissToast(id: string): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  toasts.value = [];
}

// Convenience methods
export const toast = {
  info: (message: string, options?: { duration?: number; action?: ToastAction }) =>
    showToast(message, 'info', options),
  success: (message: string, options?: { duration?: number; action?: ToastAction }) =>
    showToast(message, 'success', options),
  warning: (message: string, options?: { duration?: number; action?: ToastAction }) =>
    showToast(message, 'warning', options),
  error: (message: string, options?: { duration?: number; action?: ToastAction }) =>
    showToast(message, 'error', options),
};

function getDefaultDuration(type: ToastType): number {
  switch (type) {
    case 'error':
      return 8000;
    case 'warning':
      return 6000;
    case 'success':
      return 4000;
    default:
      return 5000;
  }
}

// =============================================================================
// MODAL ACTIONS
// =============================================================================

/**
 * Open a modal
 */
export function openModal(
  component: string,
  props?: Record<string, unknown>,
  onClose?: () => void
): string {
  const id = `modal-${Date.now()}`;

  modals.value = [...modals.value, { id, component, props, onClose }];

  return id;
}

/**
 * Close a specific modal
 */
export function closeModal(id: string): void {
  const modal = modals.value.find((m) => m.id === id);
  if (modal?.onClose) {
    modal.onClose();
  }
  modals.value = modals.value.filter((m) => m.id !== id);
}

/**
 * Close the top modal
 */
export function closeTopModal(): void {
  if (modals.value.length > 0) {
    const modal = modals.value[modals.value.length - 1];
    closeModal(modal.id);
  }
}

/**
 * Close all modals
 */
export function closeAllModals(): void {
  modals.value.forEach((m) => m.onClose?.());
  modals.value = [];
}

/**
 * Show a confirm dialog
 */
export function showConfirm(options: ConfirmDialog): void {
  confirmDialog.value = options;
}

/**
 * Close confirm dialog
 */
export function closeConfirm(): void {
  confirmDialog.value = null;
}

// =============================================================================
// LOADING ACTIONS
// =============================================================================

/**
 * Set global loading state
 */
export function setGlobalLoading(loading: boolean, message?: string): void {
  globalLoading.value = loading;
  globalLoadingMessage.value = message ?? null;
}

// =============================================================================
// NAVIGATION ACTIONS
// =============================================================================

/**
 * Toggle sidebar collapsed state
 */
export function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

/**
 * Set sidebar collapsed state
 */
export function setSidebarCollapsed(collapsed: boolean): void {
  isSidebarCollapsed.value = collapsed;
}

/**
 * Toggle mobile menu
 */
export function toggleMobileMenu(): void {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

/**
 * Close mobile menu
 */
export function closeMobileMenu(): void {
  isMobileMenuOpen.value = false;
}

/**
 * Set current route
 */
export function setCurrentRoute(route: string): void {
  currentRoute.value = route;
}

// =============================================================================
// PANEL ACTIONS
// =============================================================================

/**
 * Open detail panel
 */
export function openDetailPanel(content: string): void {
  detailPanelContent.value = content;
  isDetailPanelOpen.value = true;
}

/**
 * Close detail panel
 */
export function closeDetailPanel(): void {
  isDetailPanelOpen.value = false;
  detailPanelContent.value = null;
}

// =============================================================================
// CONNECTION ACTIONS
// =============================================================================

/**
 * Set online status
 */
export function setOnlineStatus(online: boolean): void {
  isOnline.value = online;
}

/**
 * Set connection status
 */
export function setConnectionStatus(
  status: 'connected' | 'connecting' | 'disconnected'
): void {
  connectionStatus.value = status;
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setOnlineStatus(true));
  window.addEventListener('offline', () => setOnlineStatus(false));
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const uiStore = {
  // State
  toasts,
  modals,
  confirmDialog,
  globalLoading,
  globalLoadingMessage,
  isSidebarCollapsed,
  isMobileMenuOpen,
  currentRoute,
  isDetailPanelOpen,
  detailPanelContent,
  isOnline,
  connectionStatus,

  // Computed
  hasToasts,
  hasModals,
  topModal,
  isAnyLoading,
  showOfflineBanner,

  // Toast actions
  showToast,
  dismissToast,
  dismissAllToasts,
  toast,

  // Modal actions
  openModal,
  closeModal,
  closeTopModal,
  closeAllModals,
  showConfirm,
  closeConfirm,

  // Loading actions
  setGlobalLoading,

  // Navigation actions
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileMenu,
  closeMobileMenu,
  setCurrentRoute,

  // Panel actions
  openDetailPanel,
  closeDetailPanel,

  // Connection actions
  setOnlineStatus,
  setConnectionStatus,
};

export default uiStore;
