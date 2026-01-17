/**
 * Character Creation Page
 * Multi-step character creation wizard
 */

import { useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { Button, Card } from '@components/ui';
import { characterService } from '@/api/characterService';
import type { CreateCharacterRequest } from '@/api/characterService';
import { isAuthenticated } from '@/stores/authStore';
import styles from './CharacterCreate.module.css';

type Step = 'identity' | 'attributes' | 'confirm';

interface CharacterForm {
  legalName: string;
  streetName: string;
  handle: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  attributes: {
    STR: number;
    AGI: number;
    VIT: number;
    INT: number;
    PRC: number;
    CHA: number;
    WIL: number;
    VEL: number;
  };
}

const INITIAL_FORM: CharacterForm = {
  legalName: '',
  streetName: '',
  handle: '',
  sex: 'OTHER',
  age: 25,
  attributes: {
    STR: 5,
    AGI: 5,
    VIT: 5,
    INT: 5,
    PRC: 5,
    CHA: 5,
    WIL: 5,
    VEL: 5,
  },
};

const ATTRIBUTE_INFO: Record<string, { name: string; description: string }> = {
  STR: { name: 'Strength', description: 'Physical power and melee damage' },
  AGI: { name: 'Agility', description: 'Speed, reflexes, and evasion' },
  VIT: { name: 'Vitality', description: 'Health and resistance to damage' },
  INT: { name: 'Intelligence', description: 'Technical skill and hacking' },
  PRC: { name: 'Perception', description: 'Awareness and accuracy' },
  CHA: { name: 'Charisma', description: 'Social influence and negotiation' },
  WIL: { name: 'Willpower', description: 'Mental fortitude and humanity' },
  VEL: { name: 'Velocity', description: 'Movement speed and initiative' },
};

const TOTAL_ATTRIBUTE_POINTS = 44; // 8 attributes * 5 base + 4 bonus points

export function CharacterCreate() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>('identity');
  const [form, setForm] = useState<CharacterForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated.value) {
    setLocation('/login');
    return null;
  }

  const totalPoints = Object.values(form.attributes).reduce((sum, val) => sum + val, 0);
  const remainingPoints = TOTAL_ATTRIBUTE_POINTS - totalPoints;

  const handleInputChange = (field: keyof CharacterForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAttributeChange = (attr: keyof CharacterForm['attributes'], delta: number) => {
    const currentValue = form.attributes[attr];
    const newValue = currentValue + delta;

    // Validate bounds (1-10) and available points
    if (newValue < 1 || newValue > 10) return;
    if (delta > 0 && remainingPoints <= 0) return;

    setForm((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: newValue },
    }));
  };

  const validateIdentity = (): boolean => {
    if (!form.legalName.trim() || form.legalName.length < 2) {
      setError('Legal name must be at least 2 characters');
      return false;
    }
    if (form.age < 18 || form.age > 99) {
      setError('Age must be between 18 and 99');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 'identity') {
      if (!validateIdentity()) return;
      setStep('attributes');
    } else if (step === 'attributes') {
      if (remainingPoints !== 0) {
        setError(`You must allocate all points (${remainingPoints} remaining)`);
        return;
      }
      setStep('confirm');
    }
    setError(null);
  };

  const handlePrevStep = () => {
    if (step === 'attributes') setStep('identity');
    else if (step === 'confirm') setStep('attributes');
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateCharacterRequest = {
        legalName: form.legalName,
        streetName: form.streetName || undefined,
        handle: form.handle || undefined,
        sex: form.sex,
        age: form.age,
        attributes: form.attributes,
      };

      await characterService.create(request);
      setLocation('/select-character');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation('/select-character');
  };

  return (
    <div class={styles.page}>
      <div class={styles.container}>
        {/* Header */}
        <header class={styles.header}>
          <div class={styles.logo}>◈</div>
          <h1 class={styles.title}>Create Character</h1>
          <p class={styles.subtitle}>Forge your identity in the network</p>
        </header>

        {/* Progress */}
        <div class={styles.progress}>
          <ProgressStep
            number={1}
            label="Identity"
            active={step === 'identity'}
            completed={step === 'attributes' || step === 'confirm'}
          />
          <div class={styles.progressLine} />
          <ProgressStep
            number={2}
            label="Attributes"
            active={step === 'attributes'}
            completed={step === 'confirm'}
          />
          <div class={styles.progressLine} />
          <ProgressStep number={3} label="Confirm" active={step === 'confirm'} completed={false} />
        </div>

        {/* Error */}
        {error && (
          <div class={styles.error}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div class={styles.content}>
          {step === 'identity' && (
            <IdentityStep form={form} onChange={handleInputChange} />
          )}
          {step === 'attributes' && (
            <AttributesStep
              attributes={form.attributes}
              remainingPoints={remainingPoints}
              onChange={handleAttributeChange}
            />
          )}
          {step === 'confirm' && <ConfirmStep form={form} />}
        </div>

        {/* Actions */}
        <div class={styles.actions}>
          <Button variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <div class={styles.actionsSpacer} />
          {step !== 'identity' && (
            <Button variant="secondary" onClick={handlePrevStep} disabled={isSubmitting}>
              Back
            </Button>
          )}
          {step !== 'confirm' ? (
            <Button variant="primary" onClick={handleNextStep}>
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Character'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Step Components
// =============================================================================

interface IdentityStepProps {
  form: CharacterForm;
  onChange: (field: keyof CharacterForm, value: string | number) => void;
}

function IdentityStep({ form, onChange }: IdentityStepProps) {
  return (
    <div class={styles.stepContent}>
      <h2 class={styles.stepTitle}>Identity</h2>
      <p class={styles.stepDescription}>
        Who are you in the eyes of the megacorps and the street?
      </p>

      <div class={styles.formGrid}>
        <div class={styles.formGroup}>
          <label class={styles.label}>Legal Name *</label>
          <input
            type="text"
            class={styles.input}
            value={form.legalName}
            onInput={(e) => onChange('legalName', (e.target as HTMLInputElement).value)}
            placeholder="Your registered identity"
            maxLength={32}
          />
          <span class={styles.hint}>Your official identity in the system</span>
        </div>

        <div class={styles.formGroup}>
          <label class={styles.label}>Street Name</label>
          <input
            type="text"
            class={styles.input}
            value={form.streetName}
            onInput={(e) => onChange('streetName', (e.target as HTMLInputElement).value)}
            placeholder="What they call you on the street"
            maxLength={32}
          />
          <span class={styles.hint}>Optional alias known in the underground</span>
        </div>

        <div class={styles.formGroup}>
          <label class={styles.label}>Handle</label>
          <div class={styles.inputWithPrefix}>
            <span class={styles.inputPrefix}>@</span>
            <input
              type="text"
              class={styles.input}
              value={form.handle}
              onInput={(e) => onChange('handle', (e.target as HTMLInputElement).value)}
              placeholder="your_handle"
              maxLength={20}
            />
          </div>
          <span class={styles.hint}>Your network identity</span>
        </div>

        <div class={styles.formRow}>
          <div class={styles.formGroup}>
            <label class={styles.label}>Sex</label>
            <select
              class={styles.select}
              value={form.sex}
              onChange={(e) => onChange('sex', (e.target as HTMLSelectElement).value)}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div class={styles.formGroup}>
            <label class={styles.label}>Age</label>
            <input
              type="number"
              class={styles.input}
              value={form.age}
              onInput={(e) => onChange('age', parseInt((e.target as HTMLInputElement).value) || 25)}
              min={18}
              max={99}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface AttributesStepProps {
  attributes: CharacterForm['attributes'];
  remainingPoints: number;
  onChange: (attr: keyof CharacterForm['attributes'], delta: number) => void;
}

function AttributesStep({ attributes, remainingPoints, onChange }: AttributesStepProps) {
  return (
    <div class={styles.stepContent}>
      <h2 class={styles.stepTitle}>Attributes</h2>
      <p class={styles.stepDescription}>
        Distribute your points across eight core attributes.
      </p>

      <div class={styles.pointsRemaining}>
        <span class={styles.pointsLabel}>Points Remaining:</span>
        <span class={`${styles.pointsValue} ${remainingPoints === 0 ? styles.complete : ''}`}>
          {remainingPoints}
        </span>
      </div>

      <div class={styles.attributeGrid}>
        {(Object.keys(attributes) as Array<keyof typeof attributes>).map((attr) => (
          <div key={attr} class={styles.attributeCard}>
            <div class={styles.attrHeader}>
              <span class={styles.attrCode}>{attr}</span>
              <span class={styles.attrName}>{ATTRIBUTE_INFO[attr].name}</span>
            </div>
            <p class={styles.attrDesc}>{ATTRIBUTE_INFO[attr].description}</p>
            <div class={styles.attrControls}>
              <button
                class={styles.attrButton}
                onClick={() => onChange(attr, -1)}
                disabled={attributes[attr] <= 1}
              >
                −
              </button>
              <span class={styles.attrValue}>{attributes[attr]}</span>
              <button
                class={styles.attrButton}
                onClick={() => onChange(attr, 1)}
                disabled={attributes[attr] >= 10 || remainingPoints <= 0}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ConfirmStepProps {
  form: CharacterForm;
}

function ConfirmStep({ form }: ConfirmStepProps) {
  return (
    <div class={styles.stepContent}>
      <h2 class={styles.stepTitle}>Confirm</h2>
      <p class={styles.stepDescription}>Review your character before entering the network.</p>

      <Card variant="outlined" padding="lg">
        <div class={styles.confirmGrid}>
          {/* Identity Summary */}
          <div class={styles.confirmSection}>
            <h3 class={styles.confirmLabel}>Identity</h3>
            <div class={styles.confirmValue}>
              <span class={styles.primaryName}>
                {form.streetName || form.legalName}
              </span>
              {form.streetName && (
                <span class={styles.secondaryName}>({form.legalName})</span>
              )}
            </div>
            {form.handle && (
              <span class={styles.handle}>@{form.handle}</span>
            )}
            <span class={styles.demographics}>
              {form.sex} • {form.age} years old
            </span>
          </div>

          {/* Attributes Summary */}
          <div class={styles.confirmSection}>
            <h3 class={styles.confirmLabel}>Attributes</h3>
            <div class={styles.attrSummary}>
              {(Object.keys(form.attributes) as Array<keyof typeof form.attributes>).map((attr) => (
                <div key={attr} class={styles.attrSummaryItem}>
                  <span class={styles.attrSummaryCode}>{attr}</span>
                  <span class={styles.attrSummaryValue}>{form.attributes[attr]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div class={styles.disclaimer}>
        <span class={styles.disclaimerIcon}>⚡</span>
        <p>
          Once created, your character's core attributes cannot be changed.
          Choose wisely.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ProgressStepProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function ProgressStep({ number, label, active, completed }: ProgressStepProps) {
  return (
    <div class={`${styles.progressStep} ${active ? styles.active : ''} ${completed ? styles.completed : ''}`}>
      <div class={styles.progressNumber}>
        {completed ? '✓' : number}
      </div>
      <span class={styles.progressLabel}>{label}</span>
    </div>
  );
}

export default CharacterCreate;
