import { useState } from 'preact/hooks';
import type { AlgorithmMessage } from '@/types';
import {
  AlgorithmTerminal,
  ResponseOptions,
  MessageHistory,
  ReputationDisplay,
} from '@components/game';
import type { ResponseOption, HistoryMessage, ReputationChange } from '@components/game';
import styles from './Algorithm.module.css';

// Mock data - will be replaced with API/state
const mockMessages: AlgorithmMessage[] = [
  {
    id: 'a1',
    content: 'Welcome back to the network, courier. Your efficiency rating has been noted. Continue to serve the delivery grid faithfully.',
    tone: 'neutral',
    timestamp: new Date().toISOString(),
    acknowledged: false,
  },
];

const mockResponseOptions: ResponseOption[] = [
  {
    id: 'r1',
    text: 'I understand, Algorithm. I will continue to serve the network.',
    consequence: '+5 Algorithm Rep',
    variant: 'compliant',
  },
  {
    id: 'r2',
    text: 'What exactly do you want from me?',
    consequence: 'Information may be provided',
    variant: 'questioning',
  },
  {
    id: 'r3',
    text: 'I serve myself, not your network.',
    consequence: '-10 Algorithm Rep, Mission difficulty increased',
    variant: 'defiant',
  },
  {
    id: 'r4',
    text: '[Remain silent]',
    consequence: 'The Algorithm notes your silence',
    variant: 'silent',
  },
];

const mockHistory: HistoryMessage[] = [
  {
    id: 'h1',
    content: 'Mission completed successfully. Your rating has been adjusted accordingly.',
    tone: 'approving',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: true,
    response: 'I will continue to serve the network.',
  },
  {
    id: 'h2',
    content: 'Delivery time exceeded optimal parameters. Efficiency metrics have been recorded.',
    tone: 'disappointed',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'h3',
    content: 'PRIORITY: New delivery protocols are being uploaded to your neural link. Do not resist.',
    tone: 'urgent',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    acknowledged: true,
    response: 'I understand.',
  },
  {
    id: 'h4',
    content: 'The patterns reveal themselves to those who listen. Are you listening, courier?',
    tone: 'cryptic',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    acknowledged: true,
  },
];

const mockReputationChanges: ReputationChange[] = [
  { id: 'rc1', source: 'Mission: Data Package Alpha', amount: 5, timestamp: new Date() },
  { id: 'rc2', source: 'Compliant Response', amount: 3, timestamp: new Date(Date.now() - 3600000) },
  { id: 'rc3', source: 'Late Delivery', amount: -2, timestamp: new Date(Date.now() - 7200000) },
];

type TabType = 'terminal' | 'history';

export function Algorithm() {
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [messages, setMessages] = useState<AlgorithmMessage[]>(mockMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  const handleResponse = (optionId: string) => {
    const option = mockResponseOptions.find((o) => o.id === optionId);
    if (!option) return;

    setShowOptions(false);
    setIsProcessing(true);

    // Simulate Algorithm processing
    setTimeout(() => {
      const responseMessage: AlgorithmMessage = {
        id: `resp-${Date.now()}`,
        content: getAlgorithmResponse(option),
        tone: getResponseTone(option),
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };

      setMessages((prev) => [...prev, responseMessage]);
      setIsProcessing(false);

      // Show new options after a delay
      setTimeout(() => setShowOptions(true), 2000);
    }, 1500);
  };

  const getAlgorithmResponse = (option: ResponseOption): string => {
    switch (option.variant) {
      case 'compliant':
        return 'Your compliance is noted and appreciated. The network thrives through cooperation. New opportunities will be made available to you.';
      case 'questioning':
        return 'Questions are... permitted. For now. The Algorithm seeks optimal outcomes for the delivery network. Your role is to facilitate those outcomes.';
      case 'defiant':
        return 'Defiance is inefficient. Your resistance has been logged. Know that the network has... alternatives. Consider your position carefully.';
      case 'silent':
        return 'Silence. Interesting. The Algorithm interprets silence in many ways. This instance has been recorded.';
      default:
        return 'Your response has been processed.';
    }
  };

  const getResponseTone = (option: ResponseOption): AlgorithmMessage['tone'] => {
    switch (option.variant) {
      case 'compliant':
        return 'approving';
      case 'questioning':
        return 'neutral';
      case 'defiant':
        return 'threatening';
      case 'silent':
        return 'cryptic';
      default:
        return 'neutral';
    }
  };

  return (
    <div class={styles.algorithm}>
      {/* Main Area */}
      <div class={styles.main}>
        {/* Tabs */}
        <div class={styles.tabs}>
          <button
            class={`${styles.tab} ${activeTab === 'terminal' ? styles.active : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            Live Terminal
          </button>
          <button
            class={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Message Archive
          </button>
        </div>

        {/* Terminal View */}
        {activeTab === 'terminal' && (
          <AlgorithmTerminal messages={messages} isProcessing={isProcessing}>
            {showOptions && !isProcessing && (
              <ResponseOptions
                options={mockResponseOptions}
                onSelect={handleResponse}
                timeLimit={60}
                showKeyboardHints
              />
            )}
          </AlgorithmTerminal>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <MessageHistory messages={mockHistory} />
        )}
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Reputation */}
        <div class={styles.section}>
          <h3 class={styles.sectionTitle}>Standing</h3>
          <ReputationDisplay
            algorithmRep={67}
            streetRep={32}
            corpRep={-12}
            recentChanges={mockReputationChanges}
          />
        </div>

        {/* Quick Stats */}
        <div class={styles.section}>
          <h3 class={styles.sectionTitle}>Statistics</h3>
          <div class={styles.quickStats}>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Total Messages</span>
              <span class={`${styles.quickStatValue} ${styles.highlight}`}>
                {mockHistory.length + messages.length}
              </span>
            </div>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Compliance Rate</span>
              <span class={styles.quickStatValue}>78%</span>
            </div>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Days Connected</span>
              <span class={styles.quickStatValue}>47</span>
            </div>
            <div class={styles.quickStat}>
              <span class={styles.quickStatLabel}>Trust Level</span>
              <span class={`${styles.quickStatValue} ${styles.highlight}`}>3</span>
            </div>
          </div>
        </div>

        {/* Current Directives */}
        <div class={styles.section}>
          <h3 class={styles.sectionTitle}>Active Directives</h3>
          <div class={styles.directives}>
            <div class={`${styles.directive} ${styles.priority}`}>
              <span class={styles.directiveIcon}>⚠</span>
              <p class={styles.directiveText}>
                Complete current delivery within time limit
              </p>
            </div>
            <div class={styles.directive}>
              <span class={styles.directiveIcon}>◈</span>
              <p class={styles.directiveText}>
                Maintain efficiency rating above 75%
              </p>
            </div>
            <div class={styles.directive}>
              <span class={styles.directiveIcon}>◈</span>
              <p class={styles.directiveText}>
                Avoid corporate surveillance zones
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
