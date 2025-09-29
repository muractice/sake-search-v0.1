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

      if (!records || records.length === 0) {
        const fallbackData = this.getFallbackData();
        this.updateCache(cacheKey, fallbackData);
        return fallbackData;
      }

      const sakes = records.map((record) => this.formatSakeData(record));
      this.updateCache(cacheKey, sakes);
      return sakes;
    } catch (error) {
      console.error('Error fetching sake master data:', error);
      const fallbackData = this.getFallbackData();
      this.updateCache(cacheKey, fallbackData);
      return fallbackData;
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
  private getFallbackData(): SakeData[] {
    return [
      {
        id: 'dassai-50',
        brandId: 1,
        name: '獺祭 純米大吟醸 50',
        brewery: '旭酒造',
        breweryId: 1,
        sweetness: 1,
        richness: -2,
        description: '山口県の銘酒。フルーティーで洗練された味わい',
        flavorChart: {
          brandId: 1,
          f1: 0.8,
          f2: 0.6,
          f3: 0.3,
          f4: 0.7,
          f5: 0.6,
          f6: 0.8,
        },
      },
      {
        id: 'aramasa-no6',
        brandId: 2,
        name: '新政 No.6',
        brewery: '新政酒造',
        breweryId: 2,
        sweetness: 0,
        richness: -1,
        description: '秋田県の革新的な純米酒。独特の酸味と爽やかさ',
        flavorChart: {
          brandId: 2,
          f1: 0.9,
          f2: 0.4,
          f3: 0.2,
          f4: 0.5,
          f5: 0.8,
          f6: 0.9,
        },
      },
      {
        id: 'juyondai',
        brandId: 3,
        name: '十四代 本丸',
        brewery: '高木酒造',
        breweryId: 3,
        sweetness: 2,
        richness: 1,
        description: '山形県の幻の銘酒。濃厚な旨味と上品な甘み',
        flavorChart: {
          brandId: 3,
          f1: 0.7,
          f2: 0.9,
          f3: 0.7,
          f4: 0.8,
          f5: 0.3,
          f6: 0.4,
        },
      },
      {
        id: 'sharaku',
        brandId: 4,
        name: '写楽 純米吟醸',
        brewery: '宮泉銘醸',
        breweryId: 4,
        sweetness: -1,
        richness: 0,
        description: '福島県の人気銘柄。バランスの良い辛口',
        flavorChart: {
          brandId: 4,
          f1: 0.5,
          f2: 0.5,
          f3: 0.5,
          f4: 0.6,
          f5: 0.7,
          f6: 0.6,
        },
      },
      {
        id: 'hiroki',
        brandId: 5,
        name: '飛露喜 特別純米',
        brewery: '廣木酒造',
        breweryId: 5,
        sweetness: 0,
        richness: 1,
        description: '福島県の希少銘柄。深い味わいと余韻',
        flavorChart: {
          brandId: 5,
          f1: 0.6,
          f2: 0.7,
          f3: 0.6,
          f4: 0.7,
          f5: 0.5,
          f6: 0.5,
        },
      },
      {
        id: 'jikon',
        brandId: 6,
        name: '而今 特別純米',
        brewery: '木屋正酒造',
        breweryId: 6,
        sweetness: 1,
        richness: 0,
        description: '三重県の人気銘柄。フレッシュで華やか',
        flavorChart: {
          brandId: 6,
          f1: 0.8,
          f2: 0.6,
          f3: 0.4,
          f4: 0.6,
          f5: 0.6,
          f6: 0.7,
        },
      },
      {
        id: 'kamoshibito',
        brandId: 7,
        name: '醸し人九平次 純米大吟醸',
        brewery: '萬乗醸造',
        breweryId: 7,
        sweetness: -1,
        richness: -1,
        description: '愛知県の国際的銘柄。ワインのような優雅さ',
        flavorChart: {
          brandId: 7,
          f1: 0.7,
          f2: 0.4,
          f3: 0.3,
          f4: 0.5,
          f5: 0.8,
          f6: 0.8,
        },
      },
      {
        id: 'kokuryu',
        brandId: 8,
        name: '黒龍 石田屋',
        brewery: '黒龍酒造',
        breweryId: 8,
        sweetness: 0,
        richness: 2,
        description: '福井県の最高峰。深遠な味わいと複雑さ',
        flavorChart: {
          brandId: 8,
          f1: 0.5,
          f2: 0.8,
          f3: 0.8,
          f4: 0.7,
          f5: 0.4,
          f6: 0.3,
        },
      },
      {
        id: 'denshu',
        brandId: 9,
        name: '田酒 特別純米',
        brewery: '西田酒造店',
        breweryId: 9,
        sweetness: 1,
        richness: 1,
        description: '青森県の銘酒。米の旨味を活かした王道の味',
        flavorChart: {
          brandId: 9,
          f1: 0.6,
          f2: 0.7,
          f3: 0.6,
          f4: 0.8,
          f5: 0.4,
          f6: 0.5,
        },
      },
      {
        id: 'isojiman',
        brandId: 10,
        name: '磯自慢 純米吟醸',
        brewery: '磯自慢酒造',
        breweryId: 10,
        sweetness: -2,
        richness: -1,
        description: '静岡県の代表銘柄。キレのある辛口',
        flavorChart: {
          brandId: 10,
          f1: 0.4,
          f2: 0.3,
          f3: 0.3,
          f4: 0.4,
          f5: 0.9,
          f6: 0.8,
        },
      },
    ];
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = null;
  }
}
