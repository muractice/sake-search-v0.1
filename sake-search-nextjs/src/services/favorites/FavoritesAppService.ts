import { IFavoritesRepository } from '@/repositories/favorites/FavoritesRepository';
import { IRecommendationCacheRepository } from '@/repositories/recommendations/RecommendationCacheRepository';
import type { FavoriteItem } from '@/types/favorites';
import type { SakeData } from '@/types/sake';

/**
 * Webアプリ用のお気に入りドメインサービス
 * - I/O は Repository に委譲
 * - UI都合の最小ロジック（重複排除、キャッシュクリアの握りつぶし など）を集約
 */
export class FavoritesAppService {
  constructor(
    private readonly repo: IFavoritesRepository,
    private readonly recCacheRepo: IRecommendationCacheRepository,
  ) {}

  async list(userId: string): Promise<FavoriteItem[]> {
    if (!userId) return [];
    const items = await this.repo.list(userId);
    // sakeId で重複排除（先勝ち）
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
    } catch {
      // キャッシュクリア失敗は致命的でないため握りつぶし
    }
  }

  async remove(userId: string, sakeId: string): Promise<void> {
    if (!userId) return;
    await this.repo.remove(userId, sakeId);
    try {
      await this.recCacheRepo.clearByUser(userId);
    } catch {
      // キャッシュクリア失敗は致命的でないため握りつぶし
    }
  }

}

