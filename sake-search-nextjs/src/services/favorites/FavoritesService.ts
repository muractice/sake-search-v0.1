import { IFavoritesRepository } from '@/repositories/favorites/FavoritesRepository';
import { IRecommendationCacheRepository } from '@/repositories/recommendations/RecommendationCacheRepository';
import { IUserPreferencesRepository } from '@/repositories/preferences/UserPreferencesRepository';
import { FavoriteItem } from '@/types/favorites';
import { SakeData } from '@/types/sake';
import { UserPreferences } from '@/types/preferences';

export class FavoritesService {
  constructor(
    private readonly repo: IFavoritesRepository,
    private readonly recCacheRepo: IRecommendationCacheRepository,
    private readonly prefsRepo?: IUserPreferencesRepository,
  ) {}

  async list(userId: string): Promise<FavoriteItem[]> {
    if (!userId) return [];
    const items = await this.repo.list(userId);
    // Minimal rule: dedupe by sakeId preserving order
    const seen = new Set<string>();
    const deduped: FavoriteItem[] = [];
    for (const item of items) {
      if (!seen.has(item.sakeId)) {
        seen.add(item.sakeId);
        deduped.push(item);
      }
    }
    return deduped;
  }

  async add(userId: string, sake: SakeData): Promise<void> {
    if (!userId) return;
    await this.repo.add(userId, sake);
    try {
      await this.recCacheRepo.clearByUser(userId);
    } catch (e) {
      // Cache clear failure should not break user operation
      // eslint-disable-next-line no-console
      console.error('Failed to clear recommendation cache', e);
    }
  }

  async remove(userId: string, sakeId: string): Promise<void> {
    if (!userId) return;
    await this.repo.remove(userId, sakeId);
    try {
      await this.recCacheRepo.clearByUser(userId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear recommendation cache', e);
    }
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    if (!userId || !this.prefsRepo) return null;
    try {
      return await this.prefsRepo.get(userId);
    } catch (e) {
      // Keep UI resilient; return null to fallback to default
      // eslint-disable-next-line no-console
      console.error('Failed to load user preferences', e);
      return null;
    }
  }

  async updateShowFavorites(userId: string, show: boolean): Promise<UserPreferences | null> {
    if (!userId || !this.prefsRepo) return null;
    try {
      return await this.prefsRepo.updateShowFavorites(userId, show);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to update user preferences', e);
      return null;
    }
  }
}
