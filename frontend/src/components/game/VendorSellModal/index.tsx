/**
 * Vendor Sell Modal - Modal for selling items to vendors
 */

import { useState } from 'preact/hooks';
import { Button, Card } from '@components/ui';
import type { InventoryItem } from '@/types';
import styles from './VendorSellModal.module.css';

interface VendorSellModalProps {
  item: InventoryItem;
  onSell: (itemId: string, quantity: number) => Promise<void>;
  onClose: () => void;
}

export function VendorSellModal({ item, onSell, onClose }: VendorSellModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isSelling, setIsSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxQuantity = item.quantity;
  const unitPrice = Math.floor((item.value || 0) * 0.6); // Vendors buy at 60% of value
  const totalPrice = unitPrice * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(maxQuantity, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleSell = async () => {
    setIsSelling(true);
    setError(null);
    try {
      await onSell(item.id, quantity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sell item');
    } finally {
      setIsSelling(false);
    }
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains(styles.overlay)) {
      onClose();
    }
  };

  return (
    <div class={styles.overlay} onClick={handleOverlayClick}>
      <div class={styles.modal}>
        <header class={styles.header}>
          <h2 class={styles.title}>Sell Item</h2>
          <button class={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div class={styles.content}>
          {/* Item Preview */}
          <div class={styles.itemPreview}>
            <div class={styles.itemIcon}>
              {getItemIcon(item.type)}
            </div>
            <div class={styles.itemInfo}>
              <h3 class={styles.itemName}>{item.name}</h3>
              <p class={styles.itemDescription}>{item.description}</p>
              <div class={styles.itemMeta}>
                <span class={styles.metaItem}>
                  <span class={styles.metaLabel}>Type:</span>
                  <span class={styles.metaValue}>{item.type}</span>
                </span>
                <span class={styles.metaItem}>
                  <span class={styles.metaLabel}>Available:</span>
                  <span class={styles.metaValue}>{maxQuantity}</span>
                </span>
                {item.condition !== undefined && (
                  <span class={styles.metaItem}>
                    <span class={styles.metaLabel}>Condition:</span>
                    <span class={styles.metaValue}>{item.condition}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div class={styles.quantitySection}>
            <label class={styles.quantityLabel}>Quantity to Sell</label>
            <div class={styles.quantityControls}>
              <button
                class={styles.quantityButton}
                onClick={() => handleQuantityChange(-10)}
                disabled={quantity <= 1}
              >
                −10
              </button>
              <button
                class={styles.quantityButton}
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span class={styles.quantityValue}>{quantity}</span>
              <button
                class={styles.quantityButton}
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity}
              >
                +
              </button>
              <button
                class={styles.quantityButton}
                onClick={() => handleQuantityChange(10)}
                disabled={quantity >= maxQuantity}
              >
                +10
              </button>
              <button
                class={styles.quantityButtonMax}
                onClick={() => setQuantity(maxQuantity)}
                disabled={quantity >= maxQuantity}
              >
                Max
              </button>
            </div>
          </div>

          {/* Price Summary */}
          <div class={styles.priceSection}>
            <div class={styles.priceRow}>
              <span class={styles.priceLabel}>Unit Price</span>
              <span class={styles.priceValue}>₡{unitPrice.toLocaleString()}</span>
            </div>
            <div class={styles.priceRow}>
              <span class={styles.priceLabel}>Quantity</span>
              <span class={styles.priceValue}>×{quantity}</span>
            </div>
            <div class={`${styles.priceRow} ${styles.priceTotal}`}>
              <span class={styles.priceLabel}>Total</span>
              <span class={styles.priceTotalValue}>₡{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Vendor Note */}
          <div class={styles.vendorNote}>
            <span class={styles.vendorIcon}>◈</span>
            <p>Vendors purchase items at 60% of their base value.</p>
          </div>

          {/* Error */}
          {error && (
            <div class={styles.error}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer class={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={isSelling}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSell} disabled={isSelling}>
            {isSelling ? 'Selling...' : `Sell for ₡${totalPrice.toLocaleString()}`}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function getItemIcon(type: string): string {
  const icons: Record<string, string> = {
    weapon: '⚔',
    armor: '◆',
    consumable: '◇',
    cyberware: '⬡',
    misc: '◈',
  };
  return icons[type.toLowerCase()] || '◈';
}

export default VendorSellModal;
