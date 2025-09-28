import type { SakeData } from '@/types/sake';
import type { RecommendationResult } from '@/types/recommendations';

export type { RestaurantRecommendationType, RecommendationResult } from '@/types/recommendations';

export interface GachaAnimationState {
  isSlotAnimating: boolean;
  slotItems: SakeData[];
  selectedGachaItem: RecommendationResult | null;
}

export interface RestaurantRecommendationsProps {
  restaurantMenuItems: string[];
  restaurantMenuSakeData: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onTabChange?: (tabId: string) => void;
}
