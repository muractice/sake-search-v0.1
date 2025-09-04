import { SakeData } from '@/types/sake';

export type RestaurantRecommendationType = 'similarity' | 'pairing' | 'random';

export interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

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