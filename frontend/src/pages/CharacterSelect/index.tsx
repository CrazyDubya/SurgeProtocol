/**
 * Character Select Page
 * Select existing character or create new one
 */

import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import {
  isAuthenticated,
  characters,
  type Character,
} from '@/stores/authStore';
import { authService } from '@/api/authService';
import styles from './CharacterSelect.module.css';

const MAX_CHARACTERS = 3;

export function CharacterSelect() {
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated.value) {
      setLocation('/login');
    }
  }, [setLocation]);

  // Fetch characters on mount
  useEffect(() => {
    authService.fetchCharacters();
  }, []);

  if (!isAuthenticated.value) {
    return null;
  }

  const characterList = characters.value;
  const canCreateNew = characterList.length < MAX_CHARACTERS;

  const handleSelectCharacter = async (character: Character) => {
    if (isSelecting) return;

    setSelectedId(character.id);
    setIsSelecting(true);
    setError(null);

    try {
      await authService.selectCharacter(character.id);
      setLocation('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to select character'
      );
      setSelectedId(null);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateCharacter = () => {
    setLocation('/create-character');
  };

  const handleLogout = async () => {
    await authService.logout();
    setLocation('/login');
  };

  const getHealthPercent = (char: Character) =>
    (char.currentHealth / char.maxHealth) * 100;

  const getHealthClass = (percent: number) => {
    if (percent <= 25) return styles.danger;
    if (percent <= 50) return styles.warning;
    return '';
  };

  return (
    <div class={styles.page}>
      <div class={styles.container}>
        <header class={styles.header}>
          <div class={styles.logo}>◈</div>
          <h1 class={styles.title}>Select Character</h1>
          <p class={styles.subtitle}>Choose your identity in the network</p>
        </header>

        {error && (
          <div class={styles.error}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {characterList.length === 0 ? (
          <div class={styles.emptyState}>
            <div class={styles.emptyIcon}>◇</div>
            <h2 class={styles.emptyTitle}>No Characters Found</h2>
            <p class={styles.emptyText}>
              Create your first character to enter the network.
            </p>
            <button
              class={styles.createButton}
              onClick={handleCreateCharacter}
              style={{ border: '1px solid var(--accent-algorithm)' }}
            >
              <span class={styles.createIcon}>+</span>
              Create Character
            </button>
          </div>
        ) : (
          <>
            <div class={styles.characterList}>
              {characterList.map((char) => {
                const healthPercent = getHealthPercent(char);
                const isSelected = selectedId === char.id;

                return (
                  <div
                    key={char.id}
                    class={`${styles.characterCard} ${
                      isSelected ? styles.selected : ''
                    } ${isSelecting && isSelected ? styles.loading : ''}`}
                    onClick={() => handleSelectCharacter(char)}
                  >
                    <div class={styles.avatar}>
                      {char.streetName?.[0] || char.legalName[0]}
                    </div>

                    <div class={styles.characterInfo}>
                      <h3 class={styles.characterName}>
                        {char.streetName || char.legalName}
                      </h3>
                      {char.handle && (
                        <span class={styles.characterHandle}>@{char.handle}</span>
                      )}
                      <div class={styles.characterMeta}>
                        <span class={styles.metaItem}>
                          <span class={styles.metaLabel}>Rating: </span>
                          {char.carrierRating.toFixed(1)}
                        </span>
                        {char.streetName && (
                          <span class={styles.metaItem}>
                            <span class={styles.metaLabel}>Legal: </span>
                            {char.legalName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div class={styles.characterStatus}>
                      <div class={styles.healthBar}>
                        <div
                          class={`${styles.healthFill} ${getHealthClass(
                            healthPercent
                          )}`}
                          style={{ width: `${healthPercent}%` }}
                        />
                      </div>
                      <span class={styles.tierBadge}>Tier {char.currentTier}</span>
                    </div>

                    {isSelecting && isSelected && (
                      <span class={styles.spinner} />
                    )}
                  </div>
                );
              })}
            </div>

            {canCreateNew && (
              <button
                class={styles.createButton}
                onClick={handleCreateCharacter}
                disabled={isSelecting}
              >
                <span class={styles.createIcon}>+</span>
                Create New Character
              </button>
            )}

            <p class={styles.characterLimit}>
              {characterList.length} / {MAX_CHARACTERS} characters
            </p>
          </>
        )}

        <footer class={styles.footer}>
          <button class={styles.logoutButton} onClick={handleLogout}>
            Disconnect
          </button>
        </footer>
      </div>
    </div>
  );
}

export default CharacterSelect;
