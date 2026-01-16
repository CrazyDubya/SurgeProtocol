/**
 * Game Components
 * Re-export all game-specific components
 */

// Character Status
export { CharacterStatus, CharacterStatusMini } from './CharacterStatus';
export type { CharacterStatusProps } from './CharacterStatus';

// Attribute Display
export { AttributeDisplay, AttributeSummary, DerivedStats } from './AttributeDisplay';
export type { AttributeDisplayProps, AttributeSummaryProps, DerivedStatsProps } from './AttributeDisplay';

// Augmentation Slots
export { AugmentationSlots } from './AugmentationSlots';
export type { AugmentationSlotsProps } from './AugmentationSlots';

// Mission Card
export { MissionCard, MissionListItem } from './MissionCard';
export type { MissionCardProps } from './MissionCard';

// Mission Filters
export { MissionFilters } from './MissionFilters';
export type { MissionFiltersProps, MissionSortOption } from './MissionFilters';

// Mission Detail
export { MissionDetail } from './MissionDetail';
export type { MissionDetailProps } from './MissionDetail';

// Active Mission Tracker
export { ActiveMissionTracker } from './ActiveMissionTracker';
export type { ActiveMissionTrackerProps, MissionObjective } from './ActiveMissionTracker';

// Algorithm Panel (compact)
export { AlgorithmPanel, AlgorithmIndicator } from './AlgorithmPanel';
export type { AlgorithmPanelProps } from './AlgorithmPanel';

// Algorithm Terminal (full screen)
export { AlgorithmTerminal } from './AlgorithmTerminal';
export type { AlgorithmTerminalProps } from './AlgorithmTerminal';

// Response Options
export { ResponseOptions } from './ResponseOptions';
export type { ResponseOptionsProps, ResponseOption } from './ResponseOptions';

// Message History
export { MessageHistory } from './MessageHistory';
export type { MessageHistoryProps, HistoryMessage } from './MessageHistory';

// Reputation Display
export { ReputationDisplay } from './ReputationDisplay';
export type { ReputationDisplayProps, ReputationChange } from './ReputationDisplay';

// Inventory Grid
export { InventoryGrid } from './InventoryGrid';
export type { InventoryGridProps } from './InventoryGrid';

// Item Detail
export { ItemDetail } from './ItemDetail';
export type { ItemDetailProps } from './ItemDetail';

// Quick Actions
export { QuickActions, NavActions, StatAction } from './QuickActions';
export type { QuickActionsProps, QuickAction, NavActionsProps, NavAction, StatActionProps } from './QuickActions';
