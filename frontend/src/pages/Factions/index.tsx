/**
 * Factions Page - View and interact with faction standings
 *
 * Displays all factions, player standings, active wars, and membership options.
 */

import { useState, useEffect } from 'preact/hooks';
import { Card, Badge, Button, Skeleton } from '@components/ui';
import { ReputationDisplay } from '@components/game';
import { factionService } from '@/api/factionService';
import type {
  FactionSummary,
  FactionDetail,
  FactionWar,
  PlayerStanding,
  ReputationTier,
} from '@/api/factionService';
import { factions as characterFactions } from '@/stores/characterStore';
import styles from './Factions.module.css';

type ViewMode = 'list' | 'detail';

interface FactionWithStanding extends FactionSummary {
  standing?: PlayerStanding;
}

export function Factions() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [factions, setFactions] = useState<FactionWithStanding[]>([]);
  const [activeWars, setActiveWars] = useState<FactionWar[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<FactionDetail | null>(null);
  const [selectedStanding, setSelectedStanding] = useState<PlayerStanding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load factions on mount
  useEffect(() => {
    loadFactions();
    loadActiveWars();
  }, []);

  const loadFactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await factionService.list();
      // Merge with character faction standings if available
      const factionsWithStanding = response.factions.map((f) => {
        const charFaction = characterFactions.value.find(
          (cf) => cf.factionId === f.id
        );
        return {
          ...f,
          standing: charFaction
            ? {
                reputationValue: charFaction.reputation,
                reputationTier: charFaction.tier as ReputationTier,
                isMember: charFaction.isMember,
              }
            : undefined,
        };
      });
      setFactions(factionsWithStanding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load factions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveWars = async () => {
    try {
      const response = await factionService.getActiveWars();
      setActiveWars(response.wars);
    } catch {
      // Wars are optional, don't show error
    }
  };

  const handleSelectFaction = async (factionId: string) => {
    setIsLoadingDetail(true);
    setViewMode('detail');
    try {
      const [detailResponse, standingResponse] = await Promise.all([
        factionService.get(factionId),
        factionService.getStanding(factionId).catch(() => null),
      ]);
      setSelectedFaction(detailResponse.faction);
      setSelectedStanding(standingResponse?.standing || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load faction');
      setViewMode('list');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedFaction(null);
    setSelectedStanding(null);
  };

  const handleJoinFaction = async (factionId: string) => {
    try {
      await factionService.join(factionId);
      // Reload faction data
      await handleSelectFaction(factionId);
      await loadFactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join faction');
    }
  };

  const handleLeaveFaction = async (factionId: string) => {
    try {
      await factionService.leave(factionId);
      // Reload faction data
      await handleSelectFaction(factionId);
      await loadFactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave faction');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div class={styles.factions}>
        <div class={styles.main}>
          <Skeleton variant="card" height="400px" />
        </div>
        <aside class={styles.sidebar}>
          <Skeleton variant="card" height="200px" />
          <Skeleton variant="card" height="150px" />
        </aside>
      </div>
    );
  }

  // Error state
  if (error && factions.length === 0) {
    return (
      <div class={styles.factions}>
        <Card variant="outlined" padding="lg">
          <p class={styles.errorText}>Error: {error}</p>
          <Button variant="secondary" onClick={loadFactions}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div class={styles.factions}>
      {/* Main Content */}
      <div class={styles.main}>
        {viewMode === 'list' ? (
          <>
            <header class={styles.header}>
              <h1 class={styles.title}>Factions</h1>
              <p class={styles.subtitle}>
                Navigate the power structures of Neo-Angeles
              </p>
            </header>

            {/* Faction Grid */}
            <div class={styles.factionGrid}>
              {factions.map((faction) => (
                <FactionCard
                  key={faction.id}
                  faction={faction}
                  onClick={() => handleSelectFaction(faction.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Detail View */}
            <button class={styles.backButton} onClick={handleBack}>
              <span class={styles.backIcon}>←</span>
              Back to Factions
            </button>

            {isLoadingDetail ? (
              <Skeleton variant="card" height="400px" />
            ) : selectedFaction ? (
              <FactionDetailView
                faction={selectedFaction}
                standing={selectedStanding}
                onJoin={() => handleJoinFaction(selectedFaction.id)}
                onLeave={() => handleLeaveFaction(selectedFaction.id)}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Overall Reputation Overview */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.sidebarTitle}>Reputation Overview</h3>
          <ReputationDisplay
            algorithmRep={50}
            streetRep={characterFactions.value.filter(f => f.tier === 'FRIENDLY' || f.tier === 'ALLIED' || f.tier === 'REVERED').length * 10}
            corpRep={characterFactions.value.filter(f => f.tier === 'HOSTILE' || f.tier === 'UNFRIENDLY').length * -10}
            compact
          />
        </Card>

        {/* Your Standings Summary */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.sidebarTitle}>Your Standings</h3>
          <div class={styles.standingsList}>
            {characterFactions.value.length > 0 ? (
              characterFactions.value.map((faction) => (
                <div key={faction.factionId} class={styles.standingItem}>
                  <span class={styles.standingName}>{faction.name}</span>
                  <div class={styles.standingInfo}>
                    <span
                      class={`${styles.standingTier} ${styles[getTierClass(faction.tier)]}`}
                    >
                      {faction.tier}
                    </span>
                    {faction.isMember && (
                      <Badge variant="success" size="xs">
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p class={styles.emptyText}>No faction standings yet</p>
            )}
          </div>
        </Card>

        {/* Active Wars */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.sidebarTitle}>
            Active Wars
            {activeWars.length > 0 && (
              <Badge variant="danger" size="xs" pulse>
                {activeWars.length}
              </Badge>
            )}
          </h3>
          <div class={styles.warsList}>
            {activeWars.length > 0 ? (
              activeWars.map((war) => (
                <div key={war.id} class={styles.warItem}>
                  <div class={styles.warFactions}>
                    <span class={styles.warFaction}>{war.attacker_name}</span>
                    <span class={styles.warVs}>vs</span>
                    <span class={styles.warFaction}>{war.defender_name}</span>
                  </div>
                  <div class={styles.warScore}>
                    <span class={styles.scoreValue}>{war.attacker_score}</span>
                    <span class={styles.scoreDivider}>:</span>
                    <span class={styles.scoreValue}>{war.defender_score}</span>
                  </div>
                </div>
              ))
            ) : (
              <p class={styles.emptyText}>No active wars</p>
            )}
          </div>
        </Card>

        {/* Reputation Legend */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.sidebarTitle}>Reputation Tiers</h3>
          <div class={styles.tierLegend}>
            <TierLegendItem tier="REVERED" description="Full trust & perks" />
            <TierLegendItem tier="ALLIED" description="Trusted partner" />
            <TierLegendItem tier="FRIENDLY" description="Positive relations" />
            <TierLegendItem tier="NEUTRAL" description="No preference" />
            <TierLegendItem tier="UNFRIENDLY" description="Distrusted" />
            <TierLegendItem tier="HOSTILE" description="Enemy" />
          </div>
        </Card>
      </aside>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface FactionCardProps {
  faction: FactionWithStanding;
  onClick: () => void;
}

function FactionCard({ faction, onClick }: FactionCardProps) {
  const tierClass = faction.standing
    ? getTierClass(faction.standing.reputationTier)
    : '';

  return (
    <div class={styles.factionCard} onClick={onClick}>
      <div class={styles.cardHeader}>
        <div class={styles.factionIcon}>{getFactionIcon(faction.factionType)}</div>
        <div class={styles.factionInfo}>
          <h3 class={styles.factionName}>{faction.name}</h3>
          <span class={styles.factionType}>{faction.factionType}</span>
        </div>
        {faction.standing?.isMember && (
          <Badge variant="success" size="sm">
            Member
          </Badge>
        )}
      </div>

      {faction.standing && (
        <div class={styles.cardStanding}>
          <div class={styles.standingBar}>
            <div
              class={`${styles.standingFill} ${styles[tierClass]}`}
              style={{ width: `${getReputationPercent(faction.standing.reputationValue)}%` }}
            />
          </div>
          <div class={styles.standingMeta}>
            <span class={`${styles.tierBadge} ${styles[tierClass]}`}>
              {faction.standing.reputationTier}
            </span>
            <span class={styles.repValue}>{faction.standing.reputationValue}</span>
          </div>
        </div>
      )}

      {faction.activeWars > 0 && (
        <div class={styles.warIndicator}>
          <Badge variant="danger" size="xs" pulse>
            At War ({faction.activeWars})
          </Badge>
        </div>
      )}

      <div class={styles.cardFooter}>
        <span class={styles.viewDetails}>View Details →</span>
      </div>
    </div>
  );
}

interface FactionDetailViewProps {
  faction: FactionDetail;
  standing: PlayerStanding | null;
  onJoin: () => void;
  onLeave: () => void;
}

function FactionDetailView({ faction, standing, onJoin, onLeave }: FactionDetailViewProps) {
  const tierClass = standing ? getTierClass(standing.reputationTier) : '';

  return (
    <div class={styles.detailView}>
      {/* Header */}
      <div class={styles.detailHeader}>
        <div class={styles.detailIcon}>{getFactionIcon(faction.factionType)}</div>
        <div class={styles.detailInfo}>
          <h1 class={styles.detailName}>{faction.name}</h1>
          <span class={styles.detailType}>{faction.factionType}</span>
          {faction.headquarters && (
            <span class={styles.detailHq}>HQ: {faction.headquarters}</span>
          )}
        </div>
        {standing?.isMember && (
          <Badge variant="success" size="md">
            Member
          </Badge>
        )}
      </div>

      {/* Description */}
      {faction.description && (
        <Card variant="outlined" padding="md">
          <p class={styles.description}>{faction.description}</p>
        </Card>
      )}

      {/* Standing */}
      {standing && (
        <Card variant="outlined" padding="md">
          <h3 class={styles.sectionTitle}>Your Standing</h3>
          <div class={styles.standingDetail}>
            <div class={styles.standingProgress}>
              <div class={styles.standingBar}>
                <div
                  class={`${styles.standingFill} ${styles[tierClass]}`}
                  style={{ width: `${getReputationPercent(standing.reputationValue)}%` }}
                />
              </div>
              <div class={styles.standingLabels}>
                <span class={`${styles.tierBadge} ${styles[tierClass]}`}>
                  {standing.reputationTier}
                </span>
                <span class={styles.repValue}>{standing.reputationValue} / 100</span>
              </div>
            </div>
            {standing.rank && (
              <div class={styles.rankInfo}>
                <span class={styles.rankLabel}>Rank</span>
                <span class={styles.rankValue}>{standing.rank}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Territory */}
      {faction.territory && faction.territory.length > 0 && (
        <Card variant="outlined" padding="md">
          <h3 class={styles.sectionTitle}>Territory</h3>
          <div class={styles.territoryList}>
            {faction.territory.map((t) => (
              <span key={t} class={styles.territoryTag}>
                {t}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div class={styles.detailActions}>
        {faction.isJoinable && !standing?.isMember && (
          <Button variant="primary" onClick={onJoin}>
            Join Faction
          </Button>
        )}
        {standing?.isMember && (
          <Button variant="danger" onClick={onLeave}>
            Leave Faction
          </Button>
        )}
      </div>
    </div>
  );
}

interface TierLegendItemProps {
  tier: ReputationTier;
  description: string;
}

function TierLegendItem({ tier, description }: TierLegendItemProps) {
  return (
    <div class={styles.legendItem}>
      <span class={`${styles.legendTier} ${styles[getTierClass(tier)]}`}>{tier}</span>
      <span class={styles.legendDesc}>{description}</span>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getFactionIcon(type: string): string {
  const icons: Record<string, string> = {
    CORPORATION: '◈',
    GANG: '⚔',
    SYNDICATE: '◆',
    GOVERNMENT: '★',
    UNDERGROUND: '◇',
    MERCENARY: '⬡',
    CULT: '☆',
  };
  return icons[type] || '◈';
}

function getTierClass(tier: string): string {
  const classes: Record<string, string> = {
    REVERED: 'revered',
    ALLIED: 'allied',
    FRIENDLY: 'friendly',
    NEUTRAL: 'neutral',
    UNFRIENDLY: 'unfriendly',
    HOSTILE: 'hostile',
  };
  return classes[tier] || 'neutral';
}

function getReputationPercent(value: number): number {
  // Reputation is typically -100 to 100, normalize to 0-100 for display
  return Math.min(100, Math.max(0, (value + 100) / 2));
}

export default Factions;
