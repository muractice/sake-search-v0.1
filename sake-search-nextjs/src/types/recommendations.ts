import type { SakeData } from '@/types/sake';

export type RestaurantRecommendationType = 'similarity' | 'pairing' | 'random';

export interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

export interface RestaurantRecommendationsResult {
  recommendations: RecommendationResult[];
  notFound: string[];
  totalFound: number;
  requiresMoreFavorites?: boolean;
  favoritesCount?: number;
  message?: string;
}
