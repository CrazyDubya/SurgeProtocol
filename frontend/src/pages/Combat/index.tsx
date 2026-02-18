import { useEffect } from 'preact/hooks';
import { useRoute } from 'wouter-preact';
import { useCombat } from '@/hooks/useCombat';
import { CombatGrid } from '@/components/Combat/CombatGrid';
import { CombatHUD } from '@/components/Combat/CombatHUD';
import { PageLoader } from '@/components/ui/PageLoader';
import styles from './Combat.module.css';

/**
 * CombatPage - Port of the combat experience
 * 
 * Handles real-time combat visualization and interaction.
 */
export function CombatPage() {
    const [, params] = useRoute('/combat/:combatId');
    const combatId = params?.combatId || null;

    const combat = useCombat(combatId);

    // Auto-connect on mount if we have a combatId
    useEffect(() => {
        if (combatId && !combat.isConnected) {
            combat.connect();
        }
        return () => combat.disconnect();
    }, [combatId]);

    if (!combatId) {
        return (
            <div className={styles.combatPage}>
                <div className="flex items-center justify-center h-full">
                    <p className={styles.neonText}>INVALID COMBAT SESSION</p>
                </div>
            </div>
        );
    }

    if (combat.connectionState === 'connecting' && !combat.isConnected) {
        return <PageLoader message="INITIATING COMBAT LINK..." />;
    }

    return (
        <div className={styles.combatPage}>
            {/* Background Grid Overlay */}
            <div className={styles.overlay} />

            {/* Main Grid View */}
            <div className={styles.combatGridContainer}>
                <CombatGrid
                    combatants={combat.combatants}
                    onMove={combat.move}
                    onAttack={combat.attack}
                    isPlayerTurn={combat.isPlayerTurn}
                    reachableCells={combat.reachableCells}
                    validTargets={combat.validTargets}
                    floatingFeedbacks={combat.floatingFeedbacks}
                />
            </div>

            {/* HUD Layer */}
            <div className={styles.hudContainer}>
                <div className={styles.turnOrderArea}>
                    <CombatHUD.TurnOrder
                        turnOrder={combat.turnOrder}
                        activeId={combat.currentTurnId}
                    />
                </div>

                <div className={styles.actionBarArea}>
                    <CombatHUD.ActionBar
                        onAttack={combat.attack}
                        onMove={() => { }} // Movement is handled by grid click usually
                        onDefend={combat.defend}
                        onItem={combat.useItem}
                        onAbility={combat.useAbility}
                        onEndTurn={combat.endTurn}
                        isDisabled={!combat.isPlayerTurn || combat.pendingAction}
                        player={combat.playerCombatant}
                    />
                </div>

                <div className={styles.statusPanelArea}>
                    <CombatHUD.StatusPanel
                        player={combat.playerCombatant}
                    />
                </div>
            </div>

            {/* Combat End Modal */}
            {combat.phase === 'COMBAT_END' && (
                <CombatHUD.EndModal
                    reason={combat.endReason}
                    rewards={combat.rewards}
                    onClose={() => window.location.href = '/'}
                />
            )}
        </div>
    );
}

export default CombatPage;
