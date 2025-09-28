import type { FavoriteItem } from '@/types/favorites';

export interface IRestaurantRecommendationsRepository {
  listFavorites(userId: string): Promise<FavoriteItem[]>;
}
