import { useEffect, useState, useRef } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import type { AlgorithmMessage, AlgorithmTone } from '@/types';
import styles from './AlgorithmTerminal.module.css';

export interface AlgorithmTerminalProps {
  messages: AlgorithmMessage[];
  isProcessing?: boolean;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  children?: ComponentChildren; // For response options
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
  urgent: 'Priority Alert',
  cryptic: 'Transmission',
  threatening: 'Warning',
};

export function AlgorithmTerminal({
  messages,
  isProcessing = false,
  connectionStatus = 'connected',
  children,
}: AlgorithmTerminalProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [displayedMessages, setDisplayedMessages] = useState<AlgorithmMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<{ id: string; text: string } | null>(null);

  // Typewriter effect for new messages
  useEffect(() => {
    const newMessages = messages.filter(
      (m) => !displayedMessages.find((dm) => dm.id === m.id)
    );

    if (newMessages.length === 0) return;

    const latestMessage = newMessages[0];
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= latestMessage.content.length) {
        setTypingMessage({
          id: latestMessage.id,
          text: latestMessage.content.slice(0, currentIndex),
        });
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setTypingMessage(null);
        setDisplayedMessages((prev) => [...prev, latestMessage]);
      }
    }, 20); // Typing speed

    return () => clearInterval(typeInterval);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages, typingMessage]);

  const formatTimestamp = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'NEURAL LINK ACTIVE';
      case 'connecting':
        return 'ESTABLISHING CONNECTION...';
      case 'disconnected':
        return 'LINK SEVERED';
    }
  };

  return (
    <div class={styles.terminal}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.headerLeft}>
          <div class={styles.statusIndicator}>
            <span
              class={styles.statusDot}
              style={{
                background:
                  connectionStatus === 'connected'
                    ? 'var(--accent-algorithm)'
                    : connectionStatus === 'connecting'
                    ? 'var(--accent-warning)'
                    : 'var(--accent-danger)',
              }}
            />
            <span class={styles.statusText}>{getConnectionText()}</span>
          </div>
        </div>
        <h2 class={styles.headerTitle}>The Algorithm</h2>
        <div class={styles.headerRight}>
          <span class={styles.connectionInfo}>
            SESSION: {Math.random().toString(36).substring(2, 8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div class={styles.messageArea}>
        <div class={styles.messageContainer}>
          {/* Displayed messages */}
          {displayedMessages.map((message) => (
            <MessageBlock key={message.id} message={message} formatTimestamp={formatTimestamp} />
          ))}

          {/* Currently typing message */}
          {typingMessage && (
            <div class={`${styles.message} ${styles.neutral}`}>
              <div class={styles.messageHeader}>
                <span class={styles.messageIcon}>◈</span>
                <span class={styles.messageLabel}>Incoming</span>
              </div>
              <p class={styles.messageText}>
                {typingMessage.text}
                <span class={styles.cursor} />
              </p>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && !typingMessage && (
            <div class={styles.processing}>
              <span class={styles.processingIcon}>◎</span>
              <span class={styles.processingText}>
                The Algorithm is processing
                <span class={styles.processingDots} />
              </span>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>
      </div>

      {/* Input Area (Response Options) */}
      {children && (
        <div class={styles.inputArea}>
          <div class={styles.inputPrompt}>
            <span class={styles.promptSymbol}>›</span>
            <span class={styles.promptText}>Select your response:</span>
          </div>
          {children}
        </div>
      )}

      {/* Footer */}
      <div class={styles.footer}>
        <div class={styles.footerLeft}>
          SURGE PROTOCOL v2.4.7 // ALGORITHM INTERFACE
        </div>
        <div class={styles.footerRight}>
          <span class={styles.footerStat}>
            MSG: <span class={styles.footerStatValue}>{messages.length}</span>
          </span>
          <span class={styles.footerStat}>
            LAT: <span class={styles.footerStatValue}>47ms</span>
          </span>
        </div>
      </div>
    </div>
  );
}

interface MessageBlockProps {
  message: AlgorithmMessage;
  formatTimestamp: (timestamp: string | Date) => string;
}

function MessageBlock({ message, formatTimestamp }: MessageBlockProps) {
  return (
    <div class={`${styles.message} ${styles[message.tone]}`}>
      <div class={styles.messageHeader}>
        <span class={styles.messageIcon}>{TONE_ICONS[message.tone]}</span>
        <span class={styles.messageLabel}>{TONE_LABELS[message.tone]}</span>
        <span class={styles.messageTimestamp}>{formatTimestamp(message.timestamp)}</span>
      </div>
      <p class={styles.messageText}>{message.content}</p>
    </div>
  );
}
