import { useState } from 'preact/hooks';
import type { InventoryItem } from '@/types';
import { Button } from '@components/ui';
import { InventoryGrid, ItemDetail } from '@components/game';
import styles from './Inventory.module.css';

// Mock data
const mockItems: InventoryItem[] = [
  {
    id: 'i1',
    name: 'Militech M-76 Omaha',
    description: 'Standard issue corporate sidearm. Reliable, accurate, and completely legal in most sectors.',
    type: 'weapon',
    quantity: 1,
    weight: 1.2,
    value: 1500,
    equipped: true,
    condition: 85,
    effects: [{ stat: 'Damage', modifier: 8 }],
  },
  {
    id: 'i2',
    name: 'Armored Courier Vest',
    description: 'Reinforced ballistic weave designed for urban delivery operations. Discrete protection.',
    type: 'armor',
    quantity: 1,
    weight: 3.5,
    value: 2500,
    equipped: true,
    condition: 72,
    effects: [{ stat: 'Armor', modifier: 4 }],
  },
  {
    id: 'i3',
    name: 'Bounce Back Mk.1',
    description: 'Fast-acting medical injection. Restores health quickly but causes brief disorientation.',
    type: 'medical',
    quantity: 3,
    weight: 0.2,
    value: 150,
    effects: [{ stat: 'HP', modifier: 25 }],
  },
  {
    id: 'i4',
    name: 'Black Lace',
    description: 'Combat stimulant. Increases reflexes but has highly addictive properties.',
    type: 'chemical',
    quantity: 2,
    weight: 0.1,
    value: 500,
    effects: [{ stat: 'Reflex', modifier: 2, duration: 300 }],
  },
  {
    id: 'i5',
    name: 'Encrypted Data Shard',
    description: 'Contains unknown encrypted data. Could be valuable to the right buyer.',
    type: 'data',
    quantity: 1,
    weight: 0.01,
    value: 2000,
  },
  {
    id: 'i6',
    name: 'Techie Toolkit',
    description: 'Portable electronics repair kit. Essential for field maintenance.',
    type: 'tech',
    quantity: 1,
    weight: 2.0,
    value: 800,
    condition: 90,
    effects: [{ stat: 'Tech checks', modifier: 1 }],
  },
  {
    id: 'i7',
    name: 'Sector 7 Keycard',
    description: 'Access keycard for restricted areas in Sector 7. May have limited uses.',
    type: 'key',
    quantity: 1,
    weight: 0.01,
    value: 0,
  },
  {
    id: 'i8',
    name: 'Protein Bar',
    description: 'Tasteless but nutritious. Standard courier rations.',
    type: 'consumable',
    quantity: 5,
    weight: 0.1,
    value: 10,
    effects: [{ stat: 'Stamina', modifier: 10 }],
  },
  {
    id: 'i9',
    name: 'Neural Disruptor',
    description: 'Compact EMP device. Disables electronics in a small radius.',
    type: 'tech',
    quantity: 1,
    weight: 0.5,
    value: 3000,
    condition: 100,
  },
  {
    id: 'i10',
    name: 'Contraband Package',
    description: 'Sealed package marked for delivery. Contents unknown. Do not open.',
    type: 'misc',
    quantity: 1,
    weight: 1.0,
    value: 0,
  },
];

const MAX_WEIGHT = 50;

export function Inventory() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const totalWeight = mockItems.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const totalValue = mockItems.reduce((sum, item) => sum + item.value * item.quantity, 0);
  const totalItems = mockItems.reduce((sum, item) => sum + item.quantity, 0);

  const weightPercent = (totalWeight / MAX_WEIGHT) * 100;
  const isOverweight = weightPercent > 90;
  const isNearLimit = weightPercent > 70;

  const equippedItems = mockItems.filter((item) => item.equipped);

  const handleUse = () => {
    if (selectedItem) {
      console.log('Use item:', selectedItem.id);
    }
  };

  const handleEquip = () => {
    if (selectedItem) {
      console.log('Equip/Unequip item:', selectedItem.id);
    }
  };

  const handleDrop = () => {
    if (selectedItem) {
      console.log('Drop item:', selectedItem.id);
      setSelectedItem(null);
    }
  };

  const handleSell = () => {
    if (selectedItem) {
      console.log('Sell item:', selectedItem.id);
      setSelectedItem(null);
    }
  };

  return (
    <div class={styles.inventory}>
      {/* Main Content - Inventory Grid */}
      <div class={styles.main}>
        <InventoryGrid
          items={mockItems}
          selectedId={selectedItem?.id}
          onSelect={setSelectedItem}
          maxWeight={MAX_WEIGHT}
          showFilters
        />
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Capacity */}
        <div class={styles.capacityCard}>
          <div class={styles.capacityHeader}>
            <span class={styles.capacityLabel}>Carry Capacity</span>
            <span
              class={`${styles.capacityValue} ${
                isOverweight ? styles.full : isNearLimit ? styles.warning : ''
              }`}
            >
              {totalWeight.toFixed(1)} / {MAX_WEIGHT} kg
            </span>
          </div>
          <div class={styles.capacityBar}>
            <div
              class={`${styles.capacityFill} ${
                isOverweight ? styles.full : isNearLimit ? styles.warning : ''
              }`}
              style={{ width: `${Math.min(weightPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div class={styles.quickStats}>
          <div class={styles.quickStat}>
            <span class={styles.quickStatLabel}>Items</span>
            <span class={styles.quickStatValue}>{totalItems}</span>
          </div>
          <div class={styles.quickStat}>
            <span class={styles.quickStatLabel}>Total Value</span>
            <span class={`${styles.quickStatValue} ${styles.highlight}`}>
              ¥{totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Selected Item Detail */}
        <ItemDetail
          item={selectedItem}
          onUse={handleUse}
          onEquip={handleEquip}
          onDrop={handleDrop}
          onSell={handleSell}
        />

        {/* Equipped Items */}
        <div class={styles.equippedSection}>
          <h3 class={styles.sectionTitle}>Equipped</h3>
          <div class={styles.equippedList}>
            {equippedItems.length > 0 ? (
              equippedItems.map((item) => (
                <div
                  key={item.id}
                  class={styles.equippedItem}
                  onClick={() => setSelectedItem(item)}
                >
                  <span class={styles.equippedIcon}>
                    {item.type === 'weapon' ? '⚔' : '◆'}
                  </span>
                  <div class={styles.equippedInfo}>
                    <h4 class={styles.equippedName}>{item.name}</h4>
                    <span class={styles.equippedSlot}>{item.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <div class={styles.emptySlot}>No items equipped</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div class={styles.actions}>
          <Button variant="secondary" fullWidth>
            Sort Inventory
          </Button>
          <Button variant="ghost" fullWidth>
            Sell All Junk
          </Button>
        </div>
      </aside>
    </div>
  );
}
