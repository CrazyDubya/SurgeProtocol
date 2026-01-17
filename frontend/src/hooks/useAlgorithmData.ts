/**
 * useAlgorithmData - Hook for Algorithm data fetching and actions
 *
 * Connects the Algorithm page to the backend API.
 */

import { useEffect, useCallback } from 'preact/hooks';
import { algorithmService, type ResponseVariant } from '@/api/algorithmService';
import {
  algorithmStore,
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
} from '@/stores/algorithmStore';

export function useAlgorithmData() {
  // Load initial data on mount
  useEffect(() => {
    loadMessages();
    loadStanding();
    loadDirectives();
  }, []);

  /**
   * Load pending messages
   */
  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    setAlgorithmError(null);

    try {
      const response = await algorithmService.getMessages();
      if (response.success) {
        setPendingMessages(response.messages);
      }
    } catch (error) {
      setAlgorithmError(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /**
   * Load message history
   */
  const loadHistory = useCallback(async (reset = false) => {
    setLoadingHistory(true);
    setAlgorithmError(null);

    try {
      const offset = reset ? 0 : algorithmStore.historyPagination.value.offset;
      const response = await algorithmService.getHistory({ limit: 20, offset });

      if (response.success) {
        if (reset) {
          setMessageHistory(response.messages);
        } else {
          appendMessageHistory(response.messages);
        }
        setHistoryPagination(response.pagination);
      }
    } catch (error) {
      setAlgorithmError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  /**
   * Load more history (pagination)
   */
  const loadMoreHistory = useCallback(async () => {
    if (!algorithmStore.hasMoreHistory.value || algorithmStore.isLoadingHistory.value) {
      return;
    }

    const newOffset = algorithmStore.historyPagination.value.offset + algorithmStore.messageHistory.value.length;
    setHistoryPagination({
      ...algorithmStore.historyPagination.value,
      offset: newOffset,
    });

    await loadHistory(false);
  }, [loadHistory]);

  /**
   * Load Algorithm standing
   */
  const loadStanding = useCallback(async () => {
    setLoadingStanding(true);

    try {
      const response = await algorithmService.getStanding();
      if (response.success) {
        setStanding(response.standing);
        setRecentRepChanges(response.recentChanges);
      }
    } catch (error) {
      // Standing errors are non-critical
      console.warn('Failed to load Algorithm standing:', error);
    } finally {
      setLoadingStanding(false);
    }
  }, []);

  /**
   * Load active directives
   */
  const loadDirectives = useCallback(async () => {
    setLoadingDirectives(true);

    try {
      const response = await algorithmService.getDirectives();
      if (response.success) {
        setDirectives(response.directives);
      }
    } catch (error) {
      // Directive errors are non-critical
      console.warn('Failed to load directives:', error);
    } finally {
      setLoadingDirectives(false);
    }
  }, []);

  /**
   * Respond to a message
   */
  const respondToMessage = useCallback(async (
    messageId: string,
    variant: ResponseVariant,
    text?: string
  ): Promise<boolean> => {
    setProcessingResponse(true);
    setAlgorithmError(null);

    try {
      const response = await algorithmService.respond(messageId, variant, text);

      if (response.success) {
        // Remove the acknowledged message from pending
        removePendingMessage(messageId);

        // Add the follow-up message
        addPendingMessage(response.followUp);

        // Update rep
        updateAlgorithmRep(response.repChange);

        // Add rep change to recent changes
        addRepChange({
          id: `rc-${Date.now()}`,
          source: `${variant} response`,
          amount: response.repChange,
          timestamp: new Date().toISOString(),
        });

        return true;
      }

      return false;
    } catch (error) {
      setAlgorithmError(error instanceof Error ? error.message : 'Failed to respond');
      return false;
    } finally {
      setProcessingResponse(false);
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadMessages(),
      loadStanding(),
      loadDirectives(),
    ]);
  }, [loadMessages, loadStanding, loadDirectives]);

  return {
    // State (from store)
    pendingMessages: algorithmStore.pendingMessages,
    messageHistory: algorithmStore.messageHistory,
    standing: algorithmStore.standing,
    recentRepChanges: algorithmStore.recentRepChanges,
    directives: algorithmStore.directives,

    // Loading states
    isLoadingMessages: algorithmStore.isLoadingMessages,
    isLoadingHistory: algorithmStore.isLoadingHistory,
    isLoadingStanding: algorithmStore.isLoadingStanding,
    isLoadingDirectives: algorithmStore.isLoadingDirectives,
    isProcessingResponse: algorithmStore.isProcessingResponse,
    error: algorithmStore.algorithmError,

    // Computed
    hasPendingMessages: algorithmStore.hasPendingMessages,
    currentMessage: algorithmStore.currentMessage,
    algorithmRep: algorithmStore.algorithmRep,
    trustLevel: algorithmStore.trustLevel,
    complianceRate: algorithmStore.complianceRate,
    priorityDirectives: algorithmStore.priorityDirectives,
    hasMoreHistory: algorithmStore.hasMoreHistory,

    // Actions
    loadMessages,
    loadHistory,
    loadMoreHistory,
    loadStanding,
    loadDirectives,
    respondToMessage,
    refresh,
  };
}

export default useAlgorithmData;
