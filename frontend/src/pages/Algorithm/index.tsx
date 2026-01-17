/**
 * Algorithm Page - Interface with the Algorithm AI
 *
 * Features:
 * - Live terminal for Algorithm messages
 * - Response options for player interaction
 * - Message history archive
 * - Algorithm standing and reputation
 * - Active directives display
 */

import { useState } from 'preact/hooks';
import {
  AlgorithmTerminal,
  ResponseOptions,
  MessageHistory,
  ReputationDisplay,
} from '@components/game';
import { Skeleton } from '@components/ui';
import type { ResponseOption, HistoryMessage, ReputationChange } from '@components/game';
import { useAlgorithmData } from '@/hooks/useAlgorithmData';
import type { ResponseVariant } from '@/api/algorithmService';
import styles from './Algorithm.module.css';

type TabType = 'terminal' | 'history';

// Response option definitions
const RESPONSE_OPTIONS: ResponseOption[] = [
  {
    id: 'compliant',
    text: 'I understand, Algorithm. I will continue to serve the network.',
    consequence: '+5 Algorithm Rep',
    variant: 'compliant',
  },
  {
    id: 'questioning',
    text: 'What exactly do you want from me?',
    consequence: 'Information may be provided',
    variant: 'questioning',
  },
  {
    id: 'defiant',
    text: 'I serve myself, not your network.',
    consequence: '-10 Algorithm Rep, Increased difficulty',
    variant: 'defiant',
  },
  {
    id: 'silent',
    text: '[Remain silent]',
    consequence: 'The Algorithm notes your silence',
    variant: 'silent',
  },
];

export function Algorithm() {
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [showOptions, setShowOptions] = useState(true);

  const {
    pendingMessages,
    messageHistory,
    standing,
    recentRepChanges,
    directives,
    isLoadingMessages,
    isLoadingHistory,
    isLoadingStanding,
    isProcessingResponse,
    algorithmRep,
    trustLevel,
    complianceRate,
    currentMessage,
    hasMoreHistory,
    respondToMessage,
    loadHistory,
    loadMoreHistory,
  } = useAlgorithmData();

  // Load history when switching to history tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'history' && messageHistory.value.length === 0) {
      loadHistory(true);
    }
  };

  const handleResponse = async (optionId: string) => {
    const option = RESPONSE_OPTIONS.find((o) => o.id === optionId);
    if (!option || !currentMessage.value) return;

    setShowOptions(false);

    const success = await respondToMessage(
      currentMessage.value.id,
      option.variant as ResponseVariant,
      option.text
    );

    if (success) {
      // Show options again after a delay for the follow-up message
      setTimeout(() => setShowOptions(true), 2000);
    } else {
      setShowOptions(true);
    }
  };

  // Transform messages to format expected by AlgorithmTerminal
  const terminalMessages = pendingMessages.value.map((m) => ({
    id: m.id,
    content: m.content,
    tone: m.tone,
    timestamp: m.createdAt,
    acknowledged: m.acknowledged,
  }));

  // Transform history for MessageHistory component
  const historyMessages: HistoryMessage[] = messageHistory.value.map((m) => ({
    id: m.id,
    content: m.content,
    tone: m.tone,
    timestamp: m.createdAt,
    acknowledged: m.acknowledged,
    response: m.responseText ?? undefined,
  }));

  // Transform rep changes
  const repChanges: ReputationChange[] = recentRepChanges.value.map((rc) => ({
    id: rc.id,
    source: rc.source,
    amount: rc.amount,
    timestamp: new Date(rc.timestamp),
  }));

  return (
    <div class={styles.algorithm}>
      {/* Main Area */}
      <div class={styles.main}>
        {/* Tabs */}
        <div class={styles.tabs}>
          <button
            class={`${styles.tab} ${activeTab === 'terminal' ? styles.active : ''}`}
            onClick={() => handleTabChange('terminal')}
          >
            Live Terminal
          </button>
          <button
            class={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => handleTabChange('history')}
          >
            Message Archive
          </button>
        </div>

        {/* Terminal View */}
        {activeTab === 'terminal' && (
          <>
            {isLoadingMessages.value ? (
              <div class={styles.loading}>
                <Skeleton height="200px" />
              </div>
            ) : (
              <AlgorithmTerminal
                messages={terminalMessages}
                isProcessing={isProcessingResponse.value}
              >
                {showOptions && !isProcessingResponse.value && currentMessage.value && (
                  <ResponseOptions
                    options={RESPONSE_OPTIONS}
                    onSelect={handleResponse}
                    timeLimit={60}
                    showKeyboardHints
                  />
                )}
              </AlgorithmTerminal>
            )}
          </>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <>
            {isLoadingHistory.value && messageHistory.value.length === 0 ? (
              <div class={styles.loading}>
                <Skeleton height="300px" />
              </div>
            ) : (
              <>
                <MessageHistory messages={historyMessages} />
                {hasMoreHistory.value && (
                  <button
                    class={styles.loadMore}
                    onClick={loadMoreHistory}
                    disabled={isLoadingHistory.value}
                  >
                    {isLoadingHistory.value ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Reputation */}
        <div class={styles.section}>
          <h3 class={styles.sectionTitle}>Standing</h3>
          {isLoadingStanding.value ? (
            <Skeleton height="120px" />
          ) : (
            <ReputationDisplay
              algorithmRep={algorithmRep.value}
              streetRep={trustLevel.value * 10}
              corpRep={0}
              recentChanges={repChanges}
            />
          )}
        </div>

        {/* Quick Stats */}
        <div class={styles.section}>
          <h3 class={styles.sectionTitle}>Statistics</h3>
          <div class={styles.quickStats}>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Total Messages</span>
              <span class={`${styles.quickStatValue} ${styles.highlight}`}>
                {standing.value?.totalMessages ?? 0}
              </span>
            </div>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Compliance Rate</span>
              <span class={styles.quickStatValue}>{complianceRate.value}%</span>
            </div>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Days Connected</span>
              <span class={styles.quickStatValue}>
                {standing.value?.daysConnected ?? 1}
              </span>
            </div>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Trust Level</span>
              <span class={`${styles.quickStatValue} ${styles.highlight}`}>
                {trustLevel.value}
              </span>
            </div>
          </div>
        </div>

        {/* Active Directives */}
        <div class={styles.section}>
          <h3 class={styles.sectionTitle}>Active Directives</h3>
          <div class={styles.directives}>
            {directives.value.length === 0 ? (
              <div class={styles.directive}>
                <span class={styles.directiveIcon}>◈</span>
                <p class={styles.directiveText}>No active directives</p>
              </div>
            ) : (
              directives.value.map((directive) => (
                <div
                  key={directive.id}
                  class={`${styles.directive} ${directive.priority > 0 ? styles.priority : ''}`}
                >
                  <span class={styles.directiveIcon}>
                    {directive.priority > 0 ? '⚠' : '◈'}
                  </span>
                  <p class={styles.directiveText}>{directive.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
