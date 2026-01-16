import { useState, useEffect } from 'preact/hooks';
import { Card, Badge, Button } from '@components/ui';
import type { AlgorithmMessage, AlgorithmTone } from '@/types';
import styles from './AlgorithmPanel.module.css';

export interface AlgorithmPanelProps {
  messages: AlgorithmMessage[];
  onAcknowledge?: (messageId: string) => void;
  class?: string;
}

const toneConfig: Record<AlgorithmTone, { class: string; icon: string }> = {
  neutral: { class: 'neutral', icon: '◇' },
  approving: { class: 'approving', icon: '◆' },
  disappointed: { class: 'disappointed', icon: '◈' },
  urgent: { class: 'urgent', icon: '⚠' },
  cryptic: { class: 'cryptic', icon: '◎' },
  threatening: { class: 'threatening', icon: '⬡' },
};

/**
 * The Algorithm's message panel - displays directives and communications
 */
export function AlgorithmPanel({
  messages,
  onAcknowledge,
  class: className,
}: AlgorithmPanelProps) {
  const latestMessage = messages[0];
  const [showHistory, setShowHistory] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect for latest message
  useEffect(() => {
    if (!latestMessage) return;

    setIsTyping(true);
    setDisplayedText('');

    const text = latestMessage.content;
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [latestMessage?.id]);

  const classes = [styles.panel, className].filter(Boolean).join(' ');
  const tone = latestMessage?.tone || 'neutral';
  const toneInfo = toneConfig[tone];

  return (
    <Card variant="terminal" padding="none" class={classes}>
      <div class={styles.header}>
        <div class={styles.headerLeft}>
          <span class={styles.headerIcon}>{toneInfo.icon}</span>
          <span class={styles.headerTitle}>THE ALGORITHM</span>
        </div>
        <Badge
          variant={tone === 'urgent' || tone === 'threatening' ? 'danger' : 'algorithm'}
          size="xs"
          pulse={tone === 'urgent'}
        >
          {tone}
        </Badge>
      </div>

      <div class={`${styles.content} ${styles[toneInfo.class]}`}>
        {latestMessage ? (
          <>
            <div class={styles.message}>
              <p class={styles.messageText}>
                {displayedText}
                {isTyping && <span class={styles.cursor}>▌</span>}
              </p>
              {latestMessage.timestamp && (
                <span class={styles.timestamp}>
                  {formatTimestamp(latestMessage.timestamp)}
                </span>
              )}
            </div>

            {!latestMessage.acknowledged && onAcknowledge && !isTyping && (
              <div class={styles.actions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAcknowledge(latestMessage.id)}
                >
                  Acknowledge
                </Button>
              </div>
            )}
          </>
        ) : (
          <div class={styles.empty}>
            <span class={styles.emptyIcon}>◇</span>
            <span class={styles.emptyText}>Awaiting transmission...</span>
          </div>
        )}
      </div>

      {messages.length > 1 && (
        <div class={styles.footer}>
          <button
            class={styles.historyToggle}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} history ({messages.length - 1})
          </button>
        </div>
      )}

      {showHistory && (
        <div class={styles.history}>
          {messages.slice(1).map((msg) => (
            <AlgorithmMessageItem key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Individual message in history
 */
function AlgorithmMessageItem({ message }: { message: AlgorithmMessage }) {
  const toneInfo = toneConfig[message.tone];

  return (
    <div class={`${styles.historyItem} ${styles[toneInfo.class]}`}>
      <span class={styles.historyIcon}>{toneInfo.icon}</span>
      <div class={styles.historyContent}>
        <p class={styles.historyText}>{message.content}</p>
        {message.timestamp && (
          <span class={styles.historyTimestamp}>
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Algorithm status indicator
 */
export function AlgorithmIndicator({
  status = 'connected',
  class: className,
}: {
  status?: 'connected' | 'processing' | 'alert';
  class?: string;
}) {
  const classes = [styles.indicator, styles[`indicator-${status}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <span class={styles.indicatorIcon}>◇</span>
      <span class={styles.indicatorText}>ALGORITHM</span>
      <span class={styles.indicatorStatus}>{status}</span>
    </div>
  );
}

function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
