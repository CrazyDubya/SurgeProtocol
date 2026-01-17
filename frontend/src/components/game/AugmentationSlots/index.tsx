import { useState } from 'preact/hooks';
import type { Augmentation, AugmentationSlot } from '@/types';
import { Badge } from '@components/ui';
import styles from './AugmentationSlots.module.css';

export interface AugmentationSlotsProps {
  augmentations: Augmentation[];
  onSelect?: (augmentation: Augmentation) => void;
  onSlotClick?: (slot: AugmentationSlot) => void;
  showBodyMap?: boolean;
  maxHumanity?: number;
}

const SLOT_ICONS: Record<AugmentationSlot, string> = {
  ocular: '◎',
  neural: '◈',
  arm_left: '◁',
  arm_right: '▷',
  torso: '◆',
  spine: '║',
  leg_left: '◣',
  leg_right: '◢',
};

const SLOT_NAMES: Record<AugmentationSlot, string> = {
  ocular: 'Ocular',
  neural: 'Neural',
  arm_left: 'Left Arm',
  arm_right: 'Right Arm',
  torso: 'Torso',
  spine: 'Spine',
  leg_left: 'Left Leg',
  leg_right: 'Right Leg',
};

const ALL_SLOTS: AugmentationSlot[] = [
  'ocular',
  'neural',
  'arm_left',
  'arm_right',
  'torso',
  'spine',
  'leg_left',
  'leg_right',
];

export function AugmentationSlots({
  augmentations,
  onSelect,
  onSlotClick,
  showBodyMap = true,
  maxHumanity = 100,
}: AugmentationSlotsProps) {
  const [selectedSlot, setSelectedSlot] = useState<AugmentationSlot | null>(null);

  const getAugForSlot = (slot: AugmentationSlot): Augmentation | undefined => {
    return augmentations.find((a) => a.slot === slot);
  };

  const totalHumanityCost = augmentations.reduce((sum, a) => sum + a.humanityCost, 0);
  const humanityPercent = (totalHumanityCost / maxHumanity) * 100;

  const handleSlotClick = (slot: AugmentationSlot) => {
    setSelectedSlot(slot);
    onSlotClick?.(slot);
    const aug = getAugForSlot(slot);
    if (aug) onSelect?.(aug);
  };

  const selectedAug = selectedSlot ? getAugForSlot(selectedSlot) : null;

  return (
    <div class={styles.augmentations}>
      {/* Humanity Cost Meter */}
      <div class={styles.humanityMeter}>
        <div class={styles.humanityHeader}>
          <span class={styles.humanityTitle}>Humanity Cost</span>
          <span class={styles.humanityTotal}>
            {totalHumanityCost} / {maxHumanity}
          </span>
        </div>
        <div class={styles.humanityBar}>
          <div class={styles.humanityFill} style={{ width: `${humanityPercent}%` }} />
        </div>
        {humanityPercent > 70 && (
          <p class={styles.humanityWarning}>
            Warning: High augmentation load. Cyberpsychosis risk elevated.
          </p>
        )}
      </div>

      {/* Body Map */}
      {showBodyMap && (
        <div class={styles.bodyMap}>
          <div class={styles.bodyOutline} />
          {ALL_SLOTS.map((slot) => {
            const aug = getAugForSlot(slot);
            return (
              <button
                key={slot}
                class={`${styles.slot} ${styles[`slot-${slot}`]} ${
                  aug ? styles[aug.status] : styles.empty
                } ${selectedSlot === slot ? styles.selected : ''}`}
                onClick={() => handleSlotClick(slot)}
                title={aug ? aug.name : `Empty ${SLOT_NAMES[slot]} slot`}
              >
                <span class={styles.slotIcon}>{SLOT_ICONS[slot]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Slot List */}
      <div class={styles.slotList}>
        {ALL_SLOTS.map((slot) => {
          const aug = getAugForSlot(slot);
          return (
            <div
              key={slot}
              class={`${styles.slotItem} ${aug ? styles[aug.status] : ''} ${
                selectedSlot === slot ? styles.selected : ''
              }`}
              onClick={() => handleSlotClick(slot)}
            >
              <div class={styles.slotItemIcon}>{SLOT_ICONS[slot]}</div>
              <div class={styles.slotItemContent}>
                <h4 class={styles.slotItemName}>
                  {aug ? aug.name : `${SLOT_NAMES[slot]} - Empty`}
                </h4>
                <span class={styles.slotItemLocation}>{SLOT_NAMES[slot]}</span>
              </div>
              <div class={styles.slotItemStatus}>
                {aug && (
                  <>
                    <Badge
                      variant={
                        aug.status === 'active'
                          ? 'success'
                          : aug.status === 'dormant'
                          ? 'warning'
                          : 'danger'
                      }
                      size="xs"
                    >
                      {aug.status}
                    </Badge>
                    <span class={styles.slotItemHumanity}>-{aug.humanityCost} HC</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Augmentation Detail */}
      {selectedSlot && (
        <div class={styles.detail}>
          {selectedAug ? (
            <>
              <div class={styles.detailHeader}>
                <div>
                  <h3 class={styles.detailName}>{selectedAug.name}</h3>
                  <span class={styles.detailSlot}>{SLOT_NAMES[selectedAug.slot]}</span>
                </div>
                <Badge
                  variant={
                    selectedAug.status === 'active'
                      ? 'success'
                      : selectedAug.status === 'dormant'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {selectedAug.status}
                </Badge>
              </div>

              <p class={styles.detailDescription}>{selectedAug.description}</p>

              <div class={styles.detailEffects}>
                {selectedAug.effects.map((effect, i) => (
                  <div key={i} class={styles.effectItem}>
                    <span class={styles.effectIcon}>▸</span>
                    {effect}
                  </div>
                ))}
              </div>

              <div class={styles.detailHumanity}>
                <span class={styles.humanityLabel}>Humanity Cost</span>
                <span class={styles.humanityValue}>-{selectedAug.humanityCost}</span>
              </div>
            </>
          ) : (
            <div class={styles.emptySlot}>
              <span class={styles.emptyIcon}>{SLOT_ICONS[selectedSlot]}</span>
              <p class={styles.emptyText}>
                {SLOT_NAMES[selectedSlot]} slot is empty
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
