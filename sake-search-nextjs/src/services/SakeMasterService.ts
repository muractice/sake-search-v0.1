import { SakeData } from '@/types/sake';
import type { IFavoritesRepository } from '@/repositories/favorites/FavoritesRepository';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import type { ISakeMasterRepository, SakeMasterRecord } from '@/repositories/sakeMaster/SakeMasterRepository';
import { SupabaseSakeMasterRepository } from '@/repositories/sakeMaster/SupabaseSakeMasterRepository';

export class SakeMasterService {
  private static instance: SakeMasterService;
  private cache: Map<string, SakeData[]> = new Map();
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分

  constructor(
    private readonly sakeMasterRepository: ISakeMasterRepository,
    private readonly favoritesRepository: IFavoritesRepository,
  ) {}

  static getInstance(): SakeMasterService {
    if (!SakeMasterService.instance) {
      SakeMasterService.instance = new SakeMasterService(
        new SupabaseSakeMasterRepository(),
        new SupabaseFavoritesRepository(),
      );
    }
    return SakeMasterService.instance;
  }

  /**
   * 全ての日本酒データを取得（キャッシュ付き）
   */
  async getAllSakes(): Promise<SakeData[]> {
    const cacheKey = 'all_sakes';

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const records = await this.sakeMasterRepository.listAll();

      const sakes = records.map((record) => this.formatSakeData(record));
      this.updateCache(cacheKey, sakes);
      return sakes;
    } catch (error) {
      console.error('Error fetching sake master data:', error);
      this.cache.delete(cacheKey);
      this.lastFetch = null;
      return [];
    }
  }

  /**
   * 特定ユーザーのお気に入りを除外した日本酒データを取得
   */
  async getAvailableSakes(userId: string): Promise<SakeData[]> {
    const allSakes = await this.getAllSakes();

    try {
      const favorites = await this.favoritesRepository.list(userId);
      if (!favorites || favorites.length === 0) return allSakes;

      const favoriteSakeIds = new Set(favorites.map((favorite) => favorite.sakeId));
      return allSakes.filter((sake) => !favoriteSakeIds.has(sake.id));
    } catch (error) {
      console.error('Error fetching favorites for availability check:', error);
      return allSakes;
    }
  }

  /**
   * カテゴリごとの人気日本酒を取得
   */
  async getPopularByCategory(): Promise<{
    sweet: SakeData[];
    dry: SakeData[];
    rich: SakeData[];
    light: SakeData[];
  }> {
    const allSakes = await this.getAllSakes();

    return {
      sweet: allSakes
        .filter((s) => s.sweetness > 1)
        .sort((a, b) => b.sweetness - a.sweetness)
        .slice(0, 5),
      dry: allSakes
        .filter((s) => s.sweetness < -1)
        .sort((a, b) => a.sweetness - b.sweetness)
        .slice(0, 5),
      rich: allSakes
        .filter((s) => s.richness > 1)
        .sort((a, b) => b.richness - a.richness)
        .slice(0, 5),
      light: allSakes
        .filter((s) => s.richness < -1)
        .sort((a, b) => a.richness - b.richness)
        .slice(0, 5),
    };
  }

  /**
   * キャッシュが有効かチェック
   */
  private isCacheValid(key: string): boolean {
    if (!this.cache.has(key) || !this.lastFetch) return false;

    const now = new Date();
    return now.getTime() - this.lastFetch.getTime() < this.CACHE_DURATION;
  }

  private updateCache(key: string, value: SakeData[]): void {
    this.cache.set(key, value);
    this.lastFetch = new Date();
  }

  /**
   * 日本酒データのフォーマット
   */
  private formatSakeData(record: SakeMasterRecord): SakeData {
    return {
      id: record.id,
      brandId: record.brand_id || 1,
      name: record.brand_name || 'Unknown',
      brewery: record.brewery_name || 'Unknown',
      breweryId: record.brewery_id || 1,
      sweetness: record.sweetness || 0,
      richness: record.richness || 0,
      description: record.description || '',
      flavorChart: {
        brandId: record.brand_id || 1,
        f1: record.f1_floral || 0.5,
        f2: record.f2_mellow || 0.5,
        f3: record.f3_heavy || 0.5,
        f4: record.f4_mild || 0.5,
        f5: record.f5_dry || 0.5,
        f6: record.f6_light || 0.5,
      },
    };
  }

  /**
   * フォールバックデータ（開発用）
   */
  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = null;
  }
}
