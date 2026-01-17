import { useState, useMemo } from 'preact/hooks';
import type { AlgorithmMessage, AlgorithmTone } from '@/types';
import { Card } from '@components/ui';
import styles from './MessageHistory.module.css';

export interface MessageHistoryProps {
  messages: HistoryMessage[];
  onSelect?: (messageId: string) => void;
}

export interface HistoryMessage extends AlgorithmMessage {
  response?: string;
}

const TONE_ICONS: Record<AlgorithmTone, string> = {
  neutral: '◈',
  approving: '◆',
  disappointed: '◇',
  urgent: '⚠',
  cryptic: '◎',
  threatening: '⬢',
};

const TONE_LABELS: Record<AlgorithmTone, string> = {
  neutral: 'Directive',
  approving: 'Commendation',
  disappointed: 'Observation',
  urgent: 'Priority',
  cryptic: 'Transmission',
  threatening: 'Warning',
};

type FilterType = 'all' | AlgorithmTone;

export function MessageHistory({ messages, onSelect }: MessageHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    return messages.filter((m) => m.tone === filter);
  }, [messages, filter]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: HistoryMessage[] }[] = [];
    let currentDate = '';

    filteredMessages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [] });
      }

      groups[groups.length - 1].messages.push(message);
    });

    return groups;
  }, [filteredMessages]);

  const formatTime = (timestamp: string | Date): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleItemClick = (messageId: string) => {
    setExpandedId(expandedId === messageId ? null : messageId);
    onSelect?.(messageId);
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: 'Priority' },
    { value: 'approving', label: 'Positive' },
    { value: 'disappointed', label: 'Negative' },
    { value: 'cryptic', label: 'Cryptic' },
  ];

  return (
    <Card variant="outlined" padding="none" class={styles.history}>
      {/* Header */}
      <div class={styles.header}>
        <h3 class={styles.title}>Message Archive</h3>
        <span class={styles.count}>{filteredMessages.length} messages</span>
      </div>

      {/* Filters */}
      <div class={styles.filters}>
        {filters.map((f) => (
          <button
            key={f.value}
            class={`${styles.filterChip} ${filter === f.value ? styles.active : ''}`}
            onClick={() => setFilter(f.value)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div class={styles.list}>
        {filteredMessages.length === 0 ? (
          <div class={styles.empty}>
            <span class={styles.emptyIcon}>◇</span>
            <p class={styles.emptyText}>No messages found</p>
          </div>
        ) : (
          <div class={styles.listInner}>
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date Separator */}
                <div class={styles.dateSeparator}>
                  <span class={styles.dateLine} />
                  <span class={styles.dateText}>{group.date}</span>
                  <span class={styles.dateLine} />
                </div>

                {/* Messages */}
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    class={`${styles.item} ${styles[message.tone]} ${
                      !message.acknowledged ? styles.unread : ''
                    } ${expandedId === message.id ? styles.expanded : ''}`}
                    onClick={() => handleItemClick(message.id)}
                  >
                    <div class={styles.itemIcon}>{TONE_ICONS[message.tone]}</div>
                    <div class={styles.itemContent}>
                      <div class={styles.itemHeader}>
                        <span class={styles.itemType}>{TONE_LABELS[message.tone]}</span>
                        <span class={styles.itemTime}>{formatTime(message.timestamp)}</span>
                      </div>
                      <p class={styles.itemPreview}>{message.content}</p>

                      {/* Show response if expanded and exists */}
                      {expandedId === message.id && message.response && (
                        <div class={styles.itemResponse}>
                          <span class={styles.responseLabel}>Your Response</span>
                          <p class={styles.responseText}>{message.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
