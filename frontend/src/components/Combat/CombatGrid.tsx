import { Combatant } from '@/stores/combatStore';
import gridStyles from './CombatGrid.module.css';

interface CombatGridProps {
    combatants: Combatant[];
    onMove: (x: number, y: number) => void;
    onAttack: (targetId: string) => void;
    isPlayerTurn: boolean;
    reachableCells?: { x: number; y: number }[];
    validTargets?: string[];
    floatingFeedbacks?: { id: string, x: number, y: number, text: string, type: string }[];
}

export function CombatGrid({ combatants, onMove, onAttack, isPlayerTurn, reachableCells = [], validTargets = [], floatingFeedbacks = [] }: CombatGridProps) {
    const GRID_SIZE = 10;

    // Render a grid cell
    const renderCell = (x: number, y: number) => {
        const combatant = combatants.find(c => c.position?.x === x && c.position?.y === y);
        const isOccupied = !!combatant;
        const isReachable = reachableCells.some(cell => cell.x === x && cell.y === y);
        const isValidTarget = combatant && validTargets.includes(combatant.id);

        return (
            <div
                key={`${x}-${y}`}
                className={`${gridStyles.cell} ${!isOccupied ? gridStyles.empty : ''} ${isReachable ? gridStyles.reachable : ''} ${isValidTarget ? gridStyles.targetable : ''}`}
                onClick={() => {
                    if (isPlayerTurn) {
                        if (isValidTarget && combatant) {
                            onAttack(combatant.id);
                        } else if (isReachable && !isOccupied) {
                            onMove(x, y);
                        }
                    }
                }}
            >
                {combatant && (
                    <div className={`${gridStyles.combatant} ${combatant.isPlayer ? gridStyles.player : gridStyles.enemy}`}>
                        <div className={gridStyles.portrait}>
                            <span className={gridStyles.hpLabel}>{combatant.hp}</span>
                        </div>
                        <span className={gridStyles.nameLabel}>{combatant.name}</span>
                    </div>
                )}

                {/* Floating feedback for this cell */}
                {floatingFeedbacks.filter(fb => fb.x === x && fb.y === y).map(fb => (
                    <div key={fb.id} className={`${gridStyles.feedback} ${gridStyles[fb.type]}`}>
                        {fb.text}
                    </div>
                ))}
            </div>
        );
    };

    const rows = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        const cells = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            cells.push(renderCell(x, y));
        }
        rows.push(<div key={y} className={gridStyles.row}>{cells}</div>);
    }

    return (
        <div className={gridStyles.gridWrapper}>
            <div className={gridStyles.grid}>
                {rows}
            </div>
        </div>
    );
}
