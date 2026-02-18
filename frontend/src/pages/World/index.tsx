import { useEffect, useState } from 'preact/hooks';
import { Card, Button, Badge, Skeleton } from '@components/ui';
import { worldService, type LocationDetails } from '@/api/worldService';
import { useCharacterData } from '@/hooks';
import styles from './World.module.css';

export function World() {
    const { refresh } = useCharacterData();
    const [currentLocation, setCurrentLocation] = useState<LocationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTraveling, setIsTraveling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLocation = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // First get current location ID
            const current = await worldService.getCurrentLocation();

            if (!current.location && !current.message) {
                // Fallback or error state if no location returned
                setError("Could not determine current location.");
                return;
            }

            if (current.location) {
                // Get full details including connections
                const details = await worldService.getLocationDetails(current.location.id);
                setCurrentLocation(details);
            } else {
                // Handle case where character has no location (shouldn't happen in normal play)
                setError("Character has no location set.");
            }
        } catch (err: any) {
            console.error('Failed to load location:', err);
            setError(err.message || 'Failed to load location data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLocation();
    }, []);

    const handleTravel = async (destinationId: string, routeId?: string) => {
        if (isTraveling) return;

        setIsTraveling(true);
        try {
            const result = await worldService.move(destinationId, routeId);

            // Update local state briefly to show success/transition if needed
            // Then refresh data
            await refresh(); // Update character state (credits, etc)
            await loadLocation(); // Update location view

            // Show toast or notification (using simple alert for now if Toast component not fully integrated in global scope)
            // Ideally dispatch a toast action.
            console.log(result.message);

        } catch (err: any) {
            console.error('Travel failed:', err);
            setError(err.message || 'Travel failed.');
        } finally {
            setIsTraveling(false);
        }
    };

    if (isLoading && !currentLocation) {
        return (
            <div class={styles.container}>
                <div class={styles.mainColumn}>
                    <Skeleton variant="card" height="200px" />
                    <Skeleton variant="card" height="400px" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div class={styles.container}>
                <Card variant="outlined" padding="lg">
                    <h2 style={{ color: 'var(--color-error)' }}>Navigation Error</h2>
                    <p>{error}</p>
                    <Button onClick={loadLocation} variant="secondary" size="sm">
                        Retry
                    </Button>
                </Card>
            </div>
        );
    }

    if (!currentLocation) return null;

    const { location, connections } = currentLocation;

    return (
        <div class={styles.container}>
            {/* Main Content: Current Location & Travel */}
            <div class={styles.mainColumn}>
                <Card variant="default" padding="lg">
                    <div class={styles.header}>
                        <div class={styles.subtitle}>Current Location</div>
                        <h1 class={styles.title}>
                            {location.name}
                            <Badge variant="primary" size="sm">Tier {location.tier_requirement}</Badge>
                        </h1>
                        <div class={styles.locationMeta}>
                            <div class={styles.metaItem}>
                                <span class={styles.metaLabel}>Region</span>
                                <span class={styles.metaValue}>{location.region_name || 'Unknown Region'}</span>
                            </div>
                            <div class={styles.metaItem}>
                                <span class={styles.metaLabel}>Type</span>
                                <span class={styles.metaValue}>{location.location_type}</span>
                            </div>
                            <div class={styles.metaItem}>
                                <span class={styles.metaLabel}>Security</span>
                                <span class={styles.metaValue}>HIGH</span> {/* Placeholder */}
                            </div>
                        </div>
                    </div>

                    <div class={styles.description}>
                        {location.description || "No description available for this location."}
                    </div>

                    {currentLocation.districtConditions && (
                        <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(255, 50, 50, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-error-dim)' }}>
                            <h4 style={{ color: 'var(--color-error)', margin: '0 0 8px 0', fontSize: 'var(--text-sm)' }}>District Alert</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-md)' }}>
                                {currentLocation.districtConditions.activeEvents.map((e, i) => (
                                    <li key={i}>{e.name} ({e.type})</li>
                                ))}
                            </ul>
                            <p style={{ margin: '8px 0 0 0', fontSize: 'var(--text-xs)', opacity: 0.8 }}>
                                Travel times increased by {Math.round((currentLocation.districtConditions.travelTimeMultiplier - 1) * 100)}%
                            </p>
                        </div>
                    )}

                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                        Connected Routes
                    </h3>

                    {connections.length > 0 ? (
                        <div class={styles.connectionsList}>
                            {connections.map(conn => (
                                <div
                                    key={conn.routeId}
                                    class={`${styles.connection} ${!conn.canTravel ? styles.disabled : ''}`}
                                    onClick={() => conn.canTravel && handleTravel(conn.destination.id, conn.routeId)}
                                >
                                    <div class={styles.destInfo}>
                                        <div class={styles.destName}>{conn.destination.name}</div>
                                        <div class={styles.destMeta}>
                                            <span>{conn.destination.type}</span>
                                            <span>Tier {conn.destination.tierRequired}</span>
                                            <span>{conn.distance_km ? `${conn.distance_km}km` : 'Local Travel'}</span>
                                        </div>
                                    </div>

                                    <div class={styles.travelInfo}>
                                        <div class={styles.time}>{conn.effectiveTravelTime} min</div>
                                        {conn.canTravel ? (
                                            <Badge variant="default" size="xs">TRAVEL</Badge>
                                        ) : (
                                            <div class={styles.tierReq}>{conn.reason}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div class={styles.emptyState}>
                            No confirmed routes from this location.
                        </div>
                    )}
                </Card>
            </div>

            {/* Side Column: Map/Info (Placeholder) */}
            <div class={styles.sideColumn}>
                <Card variant="outlined" padding="md">
                    <h3>World Map</h3>
                    <div style={{
                        height: '200px',
                        background: 'var(--color-surface-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-dim)',
                        fontSize: 'var(--text-xs)',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        [Map Visualization Placeholder]
                        <br />
                        Global Positioning System
                        <br />
                        OFFLINE
                    </div>
                </Card>

                {currentLocation.npcs.length > 0 && (
                    <Card variant="outlined" padding="md">
                        <h3>Local Contacts</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {currentLocation.npcs.map(npc => (
                                <li key={npc.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-dim)' }}>
                                    <div style={{ fontWeight: 500 }}>{npc.name}</div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>{npc.npc_type}</div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </div>
    );
}
