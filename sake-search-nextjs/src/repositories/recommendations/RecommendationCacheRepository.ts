export interface IRecommendationCacheRepository {
  clearByUser(userId: string): Promise<void>;
}

