/**
 * Algorithm Store - State management for Algorithm interactions
 *
 * Manages:
 * - Pending messages from the Algorithm
 * - Message history
 * - Algorithm standing and reputation
 * - Active directives
 */

import { signal, computed } from '@preact/signals';
import type {
  AlgorithmMessage,
  AlgorithmStanding,
  AlgorithmRepChange,
  AlgorithmDirective,
  AlgorithmTone,
  ResponseVariant,
} from '@/api/algorithmService';

// Re-export types for convenience
export type { AlgorithmMessage, AlgorithmStanding, AlgorithmRepChange, AlgorithmDirective, AlgorithmTone, ResponseVariant };

// =============================================================================
// STATE SIGNALS
// =============================================================================

/** Pending (unacknowledged) messages */
export const pendingMessages = signal<AlgorithmMessage[]>([]);

/** Message history */
export const messageHistory = signal<AlgorithmMessage[]>([]);

/** Current Algorithm standing */
export const standing = signal<AlgorithmStanding | null>(null);

/** Recent reputation changes */
export const recentRepChanges = signal<AlgorithmRepChange[]>([]);

/** Active directives */
export const directives = signal<AlgorithmDirective[]>([]);

/** Loading states */
export const isLoadingMessages = signal<boolean>(false);
export const isLoadingHistory = signal<boolean>(false);
export const isLoadingStanding = signal<boolean>(false);
export const isLoadingDirectives = signal<boolean>(false);
export const isProcessingResponse = signal<boolean>(false);

/** Error state */
export const algorithmError = signal<string | null>(null);

/** History pagination */
export const historyPagination = signal<{
  limit: number;
  offset: number;
  total: number;
}>({ limit: 20, offset: 0, total: 0 });

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Has pending messages */
export const hasPendingMessages = computed(() => pendingMessages.value.length > 0);

/** Current/active message (first pending) */
export const currentMessage = computed(() => pendingMessages.value[0] ?? null);

/** Algorithm reputation (shorthand) */
export const algorithmRep = computed(() => standing.value?.algorithmRep ?? 50);

/** Trust level */
export const trustLevel = computed(() => standing.value?.trustLevel ?? 1);

/** Compliance rate as percentage */
export const complianceRate = computed(() => Math.round(standing.value?.complianceRate ?? 50));

/** Priority directives (priority > 0) */
export const priorityDirectives = computed(() =>
  directives.value.filter((d) => d.priority > 0)
);

/** Total message count (pending + history) */
export const totalMessageCount = computed(() =>
  pendingMessages.value.length + historyPagination.value.total
);

/** Has more history to load */
export const hasMoreHistory = computed(() =>
  historyPagination.value.offset + messageHistory.value.length < historyPagination.value.total
);

// =============================================================================
// ACTIONS
// =============================================================================

/** Set pending messages */
export function setPendingMessages(messages: AlgorithmMessage[]): void {
  pendingMessages.value = messages;
}

/** Add a new message to pending */
export function addPendingMessage(message: AlgorithmMessage): void {
  pendingMessages.value = [...pendingMessages.value, message];
}

/** Remove a message from pending (after acknowledgment) */
export function removePendingMessage(messageId: string): void {
  pendingMessages.value = pendingMessages.value.filter((m) => m.id !== messageId);
}

/** Set message history */
export function setMessageHistory(messages: AlgorithmMessage[]): void {
  messageHistory.value = messages;
}

/** Append to message history */
export function appendMessageHistory(messages: AlgorithmMessage[]): void {
  messageHistory.value = [...messageHistory.value, ...messages];
}

/** Set history pagination */
export function setHistoryPagination(pagination: { limit: number; offset: number; total: number }): void {
  historyPagination.value = pagination;
}

/** Set standing */
export function setStanding(newStanding: AlgorithmStanding): void {
  standing.value = newStanding;
}

/** Update algorithm rep */
export function updateAlgorithmRep(delta: number): void {
  if (standing.value) {
    standing.value = {
      ...standing.value,
      algorithmRep: standing.value.algorithmRep + delta,
    };
  }
}

/** Set recent rep changes */
export function setRecentRepChanges(changes: AlgorithmRepChange[]): void {
  recentRepChanges.value = changes;
}

/** Add a rep change */
export function addRepChange(change: AlgorithmRepChange): void {
  recentRepChanges.value = [change, ...recentRepChanges.value].slice(0, 10);
}

/** Set directives */
export function setDirectives(newDirectives: AlgorithmDirective[]): void {
  directives.value = newDirectives;
}

/** Set loading states */
export function setLoadingMessages(loading: boolean): void {
  isLoadingMessages.value = loading;
}

export function setLoadingHistory(loading: boolean): void {
  isLoadingHistory.value = loading;
}

export function setLoadingStanding(loading: boolean): void {
  isLoadingStanding.value = loading;
}

export function setLoadingDirectives(loading: boolean): void {
  isLoadingDirectives.value = loading;
}

export function setProcessingResponse(processing: boolean): void {
  isProcessingResponse.value = processing;
}

/** Set error */
export function setAlgorithmError(error: string | null): void {
  algorithmError.value = error;
}

/** Clear all algorithm data */
export function clearAlgorithmData(): void {
  pendingMessages.value = [];
  messageHistory.value = [];
  standing.value = null;
  recentRepChanges.value = [];
  directives.value = [];
  algorithmError.value = null;
  historyPagination.value = { limit: 20, offset: 0, total: 0 };
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const algorithmStore = {
  // State
  pendingMessages,
  messageHistory,
  standing,
  recentRepChanges,
  directives,
  isLoadingMessages,
  isLoadingHistory,
  isLoadingStanding,
  isLoadingDirectives,
  isProcessingResponse,
  algorithmError,
  historyPagination,

  // Computed
  hasPendingMessages,
  currentMessage,
  algorithmRep,
  trustLevel,
  complianceRate,
  priorityDirectives,
  totalMessageCount,
  hasMoreHistory,

  // Actions
  setPendingMessages,
  addPendingMessage,
  removePendingMessage,
  setMessageHistory,
  appendMessageHistory,
  setHistoryPagination,
  setStanding,
  updateAlgorithmRep,
  setRecentRepChanges,
  addRepChange,
  setDirectives,
  setLoadingMessages,
  setLoadingHistory,
  setLoadingStanding,
  setLoadingDirectives,
  setProcessingResponse,
  setAlgorithmError,
  clearAlgorithmData,
};

export default algorithmStore;
