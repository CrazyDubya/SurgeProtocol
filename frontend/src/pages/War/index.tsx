/**
 * War Theater Page - Real-time faction warfare
 *
 * Displays active wars, territory control, faction strengths, and war events.
 * Uses WebSocket for real-time updates from the WarTheater Durable Object.
 */

import { Card, Badge, Button, Skeleton } from '@components/ui';
import { useWarTheater } from '@/hooks/useWarTheater';
import type { Territory, War, WarEvent, Faction } from '@/stores/warTheaterStore';
import styles from './War.module.css';

export function War() {
  const {
    isConnected,
    factions,
    territories,
    activeWars,
    brewingWars,
    contestedTerritories,
    factionRankings,
    recentEvents,
    playerContribution,
    selectedTerritory,
    selectedTerritoryDetails,
    selectedWarDetails,
    selectTerritory,
    selectWar,
    supportFaction,
    getFaction,
  } = useWarTheater();

  return (
    <div class={styles.page}>
      {/* Header */}
      <header class={styles.header}>
        <div class={styles.headerContent}>
          <h1 class={styles.title}>WAR THEATER</h1>
          <div class={styles.headerMeta}>
            <Badge variant={isConnected ? 'success' : 'danger'}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </Badge>
            <span class={styles.activeCount}>
              {activeWars.value.length} Active War{activeWars.value.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      <div class={styles.content}>
        {/* Left Column - Territory Map & Wars */}
        <div class={styles.mainColumn}>
          {/* Active Wars */}
          <Card variant="terminal" padding="md" class={styles.warsSection}>
            <h2 class={styles.sectionTitle}>Active Conflicts</h2>

            {!isConnected ? (
              <div class={styles.loading}>
                <Skeleton height="60px" />
                <Skeleton height="60px" />
              </div>
            ) : activeWars.value.length === 0 ? (
              <div class={styles.emptyState}>
                <span class={styles.emptyIcon}>&#9878;</span>
                <p>No active wars. The streets are quiet... for now.</p>
              </div>
            ) : (
              <div class={styles.warList}>
                {activeWars.value.map((war) => (
                  <WarCard
                    key={war.id}
                    war={war}
                    getFaction={getFaction}
                    isSelected={selectedWarDetails.value?.id === war.id}
                    onSelect={() => selectWar(war.id)}
                  />
                ))}
              </div>
            )}

            {/* Brewing Wars */}
            {brewingWars.value.length > 0 && (
              <div class={styles.brewingSection}>
                <h3 class={styles.subTitle}>Tensions Rising</h3>
                <div class={styles.warList}>
                  {brewingWars.value.map((war) => (
                    <WarCard
                      key={war.id}
                      war={war}
                      getFaction={getFaction}
                      isSelected={false}
                      onSelect={() => {}}
                      brewing
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Contested Territories */}
          <Card variant="default" padding="md" class={styles.territoriesSection}>
            <h2 class={styles.sectionTitle}>Contested Zones</h2>

            {contestedTerritories.value.length === 0 ? (
              <div class={styles.emptyState}>
                <p>No contested territories at this time.</p>
              </div>
            ) : (
              <div class={styles.territoryGrid}>
                {contestedTerritories.value.map((territory) => (
                  <TerritoryCard
                    key={territory.id}
                    territory={territory}
                    getFaction={getFaction}
                    isSelected={selectedTerritory.value === territory.id}
                    onSelect={() => selectTerritory(territory.id)}
                    onSupport={(factionId) => supportFaction(factionId, territory.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* All Territories Map */}
          <Card variant="default" padding="md" class={styles.mapSection}>
            <h2 class={styles.sectionTitle}>Territory Control</h2>
            <div class={styles.territoryMap}>
              {territories.value.map((territory) => (
                <div
                  key={territory.id}
                  class={`${styles.mapTerritory} ${territory.contestedBy.length > 0 ? styles.contested : ''}`}
                  style={{
                    '--control-color': territory.controlledBy
                      ? getFaction(territory.controlledBy)?.color || 'var(--color-border)'
                      : 'var(--color-border)',
                    left: `${(territory.position.x / 100) * 100}%`,
                    top: `${(territory.position.y / 100) * 100}%`,
                  } as React.CSSProperties}
                  onClick={() => selectTerritory(territory.id)}
                  title={territory.name}
                >
                  <span class={styles.mapTerritoryName}>{territory.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Rankings & Events */}
        <aside class={styles.sidebar}>
          {/* Faction Rankings */}
          <Card variant="terminal" padding="md" class={styles.rankingsSection}>
            <h2 class={styles.sectionTitle}>Power Rankings</h2>
            <div class={styles.rankings}>
              {factionRankings.value.map((faction, index) => (
                <FactionRankCard
                  key={faction.id}
                  faction={faction}
                  rank={index + 1}
                />
              ))}
            </div>
          </Card>

          {/* Player Contribution */}
          {playerContribution.value && (
            <Card variant="default" padding="md" class={styles.contributionSection}>
              <h2 class={styles.sectionTitle}>Your Contribution</h2>
              <div class={styles.contributionStats}>
                <div class={styles.stat}>
                  <span class={styles.statValue}>{playerContribution.value.missionsCompleted}</span>
                  <span class={styles.statLabel}>Missions</span>
                </div>
                <div class={styles.stat}>
                  <span class={styles.statValue}>{playerContribution.value.territoriesContested.length}</span>
                  <span class={styles.statLabel}>Zones Fought</span>
                </div>
                <div class={styles.stat}>
                  <span class={styles.statValue}>{playerContribution.value.reputation}</span>
                  <span class={styles.statLabel}>War Rep</span>
                </div>
              </div>
            </Card>
          )}

          {/* War Events */}
          <Card variant="default" padding="md" class={styles.eventsSection}>
            <h2 class={styles.sectionTitle}>Recent Events</h2>
            <div class={styles.eventList}>
              {recentEvents.value.length === 0 ? (
                <div class={styles.emptyState}>
                  <p>No recent events.</p>
                </div>
              ) : (
                recentEvents.value.map((event) => (
                  <EventCard key={event.id} event={event} getFaction={getFaction} />
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// War card sub-component
function WarCard({
  war,
  getFaction,
  isSelected,
  onSelect,
  brewing,
}: {
  war: War;
  getFaction: (id: string) => Faction | undefined;
  isSelected: boolean;
  onSelect: () => void;
  brewing?: boolean;
}) {
  const factionA = getFaction(war.factions[0]);
  const factionB = getFaction(war.factions[1]);

  return (
    <div
      class={`${styles.warCard} ${isSelected ? styles.selected : ''} ${brewing ? styles.brewing : ''}`}
      onClick={onSelect}
    >
      <div class={styles.warFactions}>
        <span
          class={styles.factionName}
          style={{ color: factionA?.color || 'var(--color-text-primary)' }}
        >
          {factionA?.name || war.factions[0]}
        </span>
        <span class={styles.versus}>VS</span>
        <span
          class={styles.factionName}
          style={{ color: factionB?.color || 'var(--color-text-primary)' }}
        >
          {factionB?.name || war.factions[1]}
        </span>
      </div>
      <div class={styles.warStats}>
        <Badge variant={brewing ? 'warning' : 'danger'}>
          {brewing ? 'BREWING' : 'ACTIVE'}
        </Badge>
        <span class={styles.casualties}>
          {war.casualtiesA} / {war.casualtiesB} casualties
        </span>
      </div>
    </div>
  );
}

// Territory card sub-component
function TerritoryCard({
  territory,
  getFaction,
  isSelected,
  onSelect,
  onSupport,
}: {
  territory: Territory;
  getFaction: (id: string) => Faction | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onSupport: (factionId: string) => void;
}) {
  const controller = territory.controlledBy ? getFaction(territory.controlledBy) : null;

  return (
    <div
      class={`${styles.territoryCard} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <div class={styles.territoryHeader}>
        <span class={styles.territoryName}>{territory.name}</span>
        <Badge variant="default">{territory.type}</Badge>
      </div>

      <div class={styles.territoryControl}>
        <div class={styles.controlBar}>
          <div
            class={styles.controlFill}
            style={{
              width: `${territory.controlPercentage}%`,
              backgroundColor: controller?.color || 'var(--color-border)',
            }}
          />
        </div>
        <span class={styles.controlPercent}>{territory.controlPercentage}%</span>
      </div>

      <div class={styles.contestedBy}>
        {territory.contestedBy.map((factionId) => {
          const faction = getFaction(factionId);
          return (
            <Button
              key={factionId}
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onSupport(factionId);
              }}
              style={{ borderColor: faction?.color }}
            >
              Support {faction?.name || factionId}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Faction rank card sub-component
function FactionRankCard({
  faction,
  rank,
}: {
  faction: Faction;
  rank: number;
}) {
  return (
    <div class={styles.rankCard}>
      <span class={styles.rankNumber}>{rank}</span>
      <div class={styles.rankInfo}>
        <span class={styles.rankName} style={{ color: faction.color }}>
          {faction.name}
        </span>
        <div class={styles.rankStats}>
          <span title="Strength">&#9876; {faction.strength}</span>
          <span title="Morale">&#9829; {faction.morale}</span>
          <span title="Resources">&#9830; {faction.resources}</span>
        </div>
      </div>
    </div>
  );
}

// Event card sub-component
function EventCard({
  event,
  getFaction,
}: {
  event: WarEvent;
  getFaction: (id: string) => Faction | undefined;
}) {
  const faction = getFaction(event.factionId);
  const importanceClass =
    event.importance === 'critical'
      ? styles.critical
      : event.importance === 'high'
        ? styles.high
        : '';

  return (
    <div class={`${styles.eventCard} ${importanceClass}`}>
      <div class={styles.eventHeader}>
        <Badge variant={getEventVariant(event.type)} size="sm">
          {event.type.replace('_', ' ')}
        </Badge>
        <span class={styles.eventTime}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p class={styles.eventMessage}>{event.message}</p>
      {faction && (
        <span class={styles.eventFaction} style={{ color: faction.color }}>
          {faction.name}
        </span>
      )}
    </div>
  );
}

function getEventVariant(type: string): 'danger' | 'warning' | 'success' | 'default' {
  switch (type) {
    case 'BATTLE':
    case 'WAR_DECLARED':
      return 'danger';
    case 'TERRITORY_CAPTURED':
      return 'success';
    case 'SABOTAGE':
      return 'warning';
    default:
      return 'default';
  }
}

export default War;
