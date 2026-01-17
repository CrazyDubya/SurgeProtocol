/**
 * UI Components
 * Re-export all UI components for convenient imports
 */

// Button
export { Button, ButtonGroup } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonGroupProps } from './Button';

// Card
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardVariant, CardPadding, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

// Progress
export { Progress, CircularProgress } from './Progress';
export type { ProgressProps, ProgressVariant, ProgressSize, CircularProgressProps } from './Progress';

// Badge
export { Badge, BadgeGroup, StatusDot } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeGroupProps, StatusDotProps } from './Badge';

// Stat
export { Stat, StatGroup, AttributeStat } from './Stat';
export type { StatProps, StatVariant, StatSize, StatGroupProps, AttributeStatProps } from './Stat';

// Skeleton
export {
  Skeleton,
  SkeletonMissionCard,
  SkeletonStat,
  SkeletonCard,
  SkeletonDashboard,
  // WebSocket data stream skeletons
  SkeletonWarCard,
  SkeletonTerritoryCard,
  SkeletonFactionRank,
  SkeletonEventCard,
  SkeletonWorldClock,
  SkeletonCombatantCard,
  SkeletonCombatPanel,
  SkeletonWarTheater,
} from './Skeleton';

// PageLoader
export { PageLoader } from './PageLoader';
export type { PageLoaderProps } from './PageLoader';

// LoadingState
export { LoadingState } from './LoadingState';
export type { LoadingStateProps, LoadingVariant } from './LoadingState';
