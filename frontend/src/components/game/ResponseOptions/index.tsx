import { useEffect, useState } from 'preact/hooks';
import type { AlgorithmOption } from '@/types';
import styles from './ResponseOptions.module.css';

export interface ResponseOptionsProps {
  options: ResponseOption[];
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  timeLimit?: number; // in seconds
  showKeyboardHints?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export interface ResponseOption extends AlgorithmOption {
  variant?: 'compliant' | 'defiant' | 'questioning' | 'silent';
}

export function ResponseOptions({
  options,
  onSelect,
  disabled = false,
  timeLimit,
  showKeyboardHints = true,
  layout = 'vertical',
}: ResponseOptionsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0);

  // Timer countdown
  useEffect(() => {
    if (!timeLimit) return;

    setTimeRemaining(timeLimit);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-select first option or silent option on timeout
          const silentOption = options.find((o) => o.variant === 'silent');
          const defaultOption = silentOption || options[0];
          if (defaultOption && !disabled) {
            onSelect(defaultOption.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, options, disabled, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key;
      const index = parseInt(key, 10) - 1;

      if (index >= 0 && index < options.length) {
        handleSelect(options[index].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, disabled]);

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    setSelectedId(optionId);
    onSelect(optionId);
  };

  const isUrgent = timeLimit && timeRemaining < 10;
  const timeProgress = timeLimit ? (timeRemaining / timeLimit) * 100 : 100;

  if (options.length === 0) {
    return (
      <div class={styles.empty}>
        <span class={styles.emptyText}>Awaiting Algorithm directive...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Timer */}
      {timeLimit && (
        <div class={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
          <span class={styles.timerLabel}>Response Window</span>
          <span class={styles.timerValue}>{timeRemaining}s</span>
          <div class={styles.timerBar}>
            <div class={styles.timerFill} style={{ width: `${timeProgress}%` }} />
          </div>
        </div>
      )}

      {/* Options */}
      <div class={`${styles.options} ${layout === 'horizontal' ? styles.horizontal : ''}`}>
        {options.map((option, index) => (
          <button
            key={option.id}
            class={`${styles.option} ${option.variant ? styles[option.variant] : ''} ${
              selectedId === option.id ? styles.selected : ''
            }`}
            onClick={() => handleSelect(option.id)}
            disabled={disabled}
            type="button"
          >
            <span class={styles.optionIndex}>{index + 1}</span>
            <div class={styles.optionContent}>
              <p class={styles.optionText}>{option.text}</p>
              {option.consequence && (
                <p class={styles.optionConsequence}>{option.consequence}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard hints */}
      {showKeyboardHints && (
        <div class={styles.keyboardHint}>
          {options.map((_, index) => (
            <span key={index} class={styles.keyHint}>
              <kbd>{index + 1}</kbd> Option {index + 1}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
