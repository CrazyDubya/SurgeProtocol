import { useState } from 'preact/hooks';
import { Combatant, CombatEndReason } from '@/stores/combatStore';
import styles from '@/pages/Combat/Combat.module.css';
import hudStyles from './CombatHUD.module.css';

// =============================================================================
// TURN ORDER
// =============================================================================

interface TurnOrderProps {
    turnOrder: Combatant[];
    activeId: string | null;
}

function TurnOrder({ turnOrder, activeId }: TurnOrderProps) {
    return (
        <div className={`${styles.glassPanel} ${hudStyles.turnOrder}`}>
            <h3 className={`${styles.neonText} ${hudStyles.hudTitle}`}>TURN ORDER</h3>
            <div className={hudStyles.list}>
                {turnOrder.map((c) => (
                    <div
                        key={c.id}
                        className={`${hudStyles.combatantRow} ${c.id === activeId ? hudStyles.activeRow : ''} ${c.isPlayer ? hudStyles.playerRow : ''}`}
                    >
                        <div className={hudStyles.avatar}>
                            <div className={hudStyles.avatarOverlay} />
                        </div>
                        <div className={hudStyles.details}>
                            <span className={hudStyles.name}>{c.name}</span>
                            <span className={hudStyles.subtext}>{c.isPlayer ? 'PLAYER' : 'HOSTILE'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// ACTION BAR
// =============================================================================

interface ActionBarProps {
    onAttack: (targetId: string) => void;
    onMove: () => void;
    onDefend: () => void;
    onItem: (itemId: string) => void;
    onAbility: (abilityId: string) => void;
    onEndTurn: () => void;
    isDisabled: boolean;
    player?: Combatant;
}

function ActionBar({ onAttack, onMove, onDefend, onItem, onAbility, onEndTurn, isDisabled, player }: ActionBarProps) {
    const [activeMenu, setActiveMenu] = useState<'NONE' | 'ITEM' | 'ABILITY'>('NONE');

    const handleItemClick = (itemId: string) => {
        onItem(itemId);
        setActiveMenu('NONE');
    };

    const handleAbilityClick = (abilityId: string) => {
        onAbility(abilityId);
        setActiveMenu('NONE');
    };

    return (
        <div className={`${styles.glassPanel} ${hudStyles.actionBar} ${isDisabled ? hudStyles.disabled : ''}`}>
            <div className={hudStyles.actionsGrid}>
                <button onClick={() => { onMove(); setActiveMenu('NONE'); }} disabled={isDisabled} title="Move">
                    <span className={hudStyles.btnIcon}>🏃</span>
                    <span className={hudStyles.btnLabel}>MOVE</span>
                </button>
                <button className={hudStyles.primaryBtn} onClick={() => { onAttack(''); setActiveMenu('NONE'); }} disabled={isDisabled} title="Attack">
                    <span className={hudStyles.btnIcon}>⚔️</span>
                    <span className={hudStyles.btnLabel}>ATTACK</span>
                </button>
                <button onClick={() => { onDefend(); setActiveMenu('NONE'); }} disabled={isDisabled} title="Defend">
                    <span className={hudStyles.btnIcon}>🛡️</span>
                    <span className={hudStyles.btnLabel}>DEFEND</span>
                </button>

                <div className={hudStyles.menuContainer}>
                    <button
                        onClick={() => setActiveMenu(activeMenu === 'ITEM' ? 'NONE' : 'ITEM')}
                        disabled={isDisabled}
                        className={activeMenu === 'ITEM' ? hudStyles.activeBtn : ''}
                        title="Use Item"
                    >
                        <span className={hudStyles.btnIcon}>📦</span>
                        <span className={hudStyles.btnLabel}>ITEM</span>
                    </button>
                    {activeMenu === 'ITEM' && (
                        <div className={hudStyles.actionMenu}>
                            <div className={hudStyles.menuHeader}>Inventory</div>
                            <div className={hudStyles.menuList}>
                                {player?.items?.length ? player.items.map(item => (
                                    <button key={item.id} onClick={() => handleItemClick(item.id)} className={hudStyles.menuItem}>
                                        <span className={hudStyles.itemName}>{item.name}</span>
                                        <span className={hudStyles.itemQty}>x{item.quantity}</span>
                                    </button>
                                )) : <div className={hudStyles.emptyMessage}>No items</div>}
                            </div>
                        </div>
                    )}
                </div>

                <div className={hudStyles.menuContainer}>
                    <button
                        onClick={() => setActiveMenu(activeMenu === 'ABILITY' ? 'NONE' : 'ABILITY')}
                        disabled={isDisabled}
                        className={activeMenu === 'ABILITY' ? hudStyles.activeBtn : ''}
                        title="Use Ability"
                    >
                        <span className={hudStyles.btnIcon}>💡</span>
                        <span className={hudStyles.btnLabel}>ABILITY</span>
                    </button>
                    {activeMenu === 'ABILITY' && (
                        <div className={hudStyles.actionMenu}>
                            <div className={hudStyles.menuHeader}>Abilities</div>
                            <div className={hudStyles.menuList}>
                                {player?.abilities?.length ? player.abilities.map(ab => (
                                    <button key={ab.id} onClick={() => handleAbilityClick(ab.id)} className={hudStyles.menuItem}>
                                        <span className={hudStyles.itemName}>{ab.name}</span>
                                        {ab.apCost && <span className={hudStyles.apCost}>{ab.apCost} AP</span>}
                                    </button>
                                )) : <div className={hudStyles.emptyMessage}>No abilities</div>}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={() => { onEndTurn(); setActiveMenu('NONE'); }} disabled={isDisabled} className={hudStyles.endTurnBtn}>
                    <span className={hudStyles.btnIcon}>⏳</span>
                    <span className={hudStyles.btnLabel}>END TURN</span>
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// STATUS PANEL
// =============================================================================

interface StatusPanelProps {
    player?: Combatant;
}

function StatusPanel({ player }: StatusPanelProps) {
    if (!player) return null;

    const hpPercent = (player.hp / player.hpMax) * 100;

    return (
        <div className={`${styles.glassPanel} ${hudStyles.statusPanel}`}>
            <h3 className={`${styles.neonText} ${hudStyles.hudTitle}`}>UNIT STATUS</h3>
            <div className={hudStyles.statusContent}>
                <div className={hudStyles.hpBarContainer}>
                    <div className={hudStyles.barLabel}>
                        <span>HP</span>
                        <span>{player.hp} / {player.hpMax}</span>
                    </div>
                    <div className={hudStyles.barTrack}>
                        <div
                            className={hudStyles.barFill}
                            style={{ width: `${hpPercent}%`, background: 'linear-gradient(90deg, #ff0055, #ff00ff)' }}
                        />
                    </div>
                </div>

                <div className={hudStyles.hpBarContainer}>
                    <div className={hudStyles.barLabel}>
                        <span>ENERGY</span>
                        <span>100 / 100</span>
                    </div>
                    <div className={hudStyles.barTrack}>
                        <div
                            className={hudStyles.barFill}
                            style={{ width: '100%', background: 'linear-gradient(90deg, #00ffff, #0055ff)' }}
                        />
                    </div>
                </div>

                <div className={hudStyles.conditions}>
                    {player.conditions.map(c => (
                        <span key={c} className={hudStyles.conditionTag}>{c}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MODALS
// =============================================================================

interface EndModalProps {
    reason: CombatEndReason | null;
    rewards: { xp: number; credits: number; items: string[] } | null;
    onClose: () => void;
}

function EndModal({ reason, rewards, onClose }: EndModalProps) {
    return (
        <div className={hudStyles.modalOverlay}>
            <div className={`${styles.glassPanel} ${hudStyles.modal}`}>
                <h2 className={`${styles.neonText} ${hudStyles.modalTitle}`}>
                    {reason === 'VICTORY' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
                </h2>

                {rewards && (
                    <div className={hudStyles.rewards}>
                        <div className={hudStyles.rewardItem}>
                            <span>XP EARNED</span>
                            <span className={hudStyles.rewardVal}>+{rewards.xp}</span>
                        </div>
                        <div className={hudStyles.rewardItem}>
                            <span>CREDITS</span>
                            <span className={hudStyles.rewardVal}>+{rewards.credits}</span>
                        </div>
                    </div>
                )}

                <button className={hudStyles.closeBtn} onClick={onClose}>
                    RETURN TO CITY
                </button>
            </div>
        </div>
    );
}

export const CombatHUD = {
    TurnOrder,
    ActionBar,
    StatusPanel,
    EndModal,
};
