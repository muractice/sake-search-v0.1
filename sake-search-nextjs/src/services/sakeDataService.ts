import { SakeData } from '@/types/sake';
import { supabase } from '@/lib/supabase';

export class SakeDataService {
  private static instance: SakeDataService;
  private cache: Map<string, SakeData[]> = new Map();
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分

  static getInstance(): SakeDataService {
    if (!SakeDataService.instance) {
      SakeDataService.instance = new SakeDataService();
    }
    return SakeDataService.instance;
  }

  /**
   * 全ての日本酒データを取得（キャッシュ付き）
   */
  async getAllSakes(): Promise<SakeData[]> {
    const cacheKey = 'all_sakes';
    
    // キャッシュチェック
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Supabaseから日本酒データを取得
      const { data: sakes, error } = await supabase
        .from('sake_master')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // エラー時はフォールバックデータを返す
        const fallbackData = this.getFallbackData();
        this.cache.set(cacheKey, fallbackData);
        this.lastFetch = new Date();
        return fallbackData;
      }

      // データが存在しない場合はフォールバックデータを返す
      if (!sakes || sakes.length === 0) {
        console.log('No sakes data found, using fallback data');
        const fallbackData = this.getFallbackData();
        this.cache.set(cacheKey, fallbackData);
        this.lastFetch = new Date();
        return fallbackData;
      }

      // データを整形
      const formattedSakes: SakeData[] = sakes.map(sake => ({
        id: sake.id,
        brandId: sake.brand_id || 1,
        name: sake.brand_name || '不明な日本酒',
        brewery: sake.brewery_name || '不明な蔵元',
        breweryId: sake.brewery_id || 1,
        sweetness: sake.sweetness || 0,
        richness: sake.richness || 0,
        description: sake.description || '',
        flavorChart: {
          brandId: sake.brand_id || 1,
          f1: sake.f1_floral || 0.5,
          f2: sake.f2_mellow || 0.5,
          f3: sake.f3_heavy || 0.5,
          f4: sake.f4_mild || 0.5,
          f5: sake.f5_dry || 0.5,
          f6: sake.f6_light || 0.5,
        }
      }));

      console.log('Formatted sakes:', formattedSakes.length, 'items');

      // キャッシュに保存
      this.cache.set(cacheKey, formattedSakes);
      this.lastFetch = new Date();

      return formattedSakes;
    } catch (error) {
      console.error('Error fetching sakes:', error);
      
      // エラー時はフォールバックデータを返す
      const fallbackData = this.getFallbackData();
      this.cache.set(cacheKey, fallbackData);
      this.lastFetch = new Date();
      return fallbackData;
    }
  }

  /**
   * 特定のユーザーのお気に入りを除外した日本酒データを取得
   */
  async getAvailableSakes(userId: string): Promise<SakeData[]> {
    const allSakes = await this.getAllSakes();
    
    try {
      // ユーザーのお気に入りを取得
      const { data: favorites } = await supabase
        .from('favorites')
        .select('sake_id')
        .eq('user_id', userId);

      if (!favorites) return allSakes;

      const favoriteSakeIds = new Set(favorites.map(f => f.sake_id));
      
      // お気に入りを除外
      return allSakes.filter(sake => !favoriteSakeIds.has(sake.id));
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return allSakes;
    }
  }

  /**
   * トレンドの日本酒を取得（お気に入り数が多い順）
   */
  async getTrendingSakes(limit: number = 10): Promise<SakeData[]> {
    try {
      // お気に入り数でソートして取得
      const { data: favoriteStats, error: statsError } = await supabase
        .from('favorites')
        .select('sake_id')
        .limit(limit * 2);

      if (statsError) throw statsError;

      // お気に入り数をカウント
      const sakeCounts = new Map<string, number>();
      (favoriteStats || []).forEach(fav => {
        const count = sakeCounts.get(fav.sake_id) || 0;
        sakeCounts.set(fav.sake_id, count + 1);
      });

      // 上位のsake_idを取得
      const topSakeIds = Array.from(sakeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      if (topSakeIds.length === 0) {
        // お気に入りデータがない場合は全件から取得
        const { data, error } = await supabase
          .from('sake_master')
          .select('*')
          .limit(limit);

        if (error) throw error;
        return (data || []).map(sake => this.formatSakeData(sake));
      }

      // 該当する日本酒データを取得
      const { data, error } = await supabase
        .from('sake_master')
        .select('*')
        .in('id', topSakeIds);

      if (error) throw error;

      return (data || []).map(sake => this.formatSakeData(sake));
    } catch (error) {
      console.error('Error fetching trending sakes:', error);
      return [];
    }
  }

  /**
   * 特定の条件に基づいて日本酒を検索
   */
  async searchSakes(criteria: {
    sweetness?: { min: number; max: number };
    richness?: { min: number; max: number };
    brewery?: string;
    keywords?: string[];
  }): Promise<SakeData[]> {
    let query = supabase
      .from('sake_master')
      .select('*');

    // 甘辛度でフィルタ
    if (criteria.sweetness) {
      query = query
        .gte('sweetness', criteria.sweetness.min)
        .lte('sweetness', criteria.sweetness.max);
    }

    // 淡濃度でフィルタ
    if (criteria.richness) {
      query = query
        .gte('richness', criteria.richness.min)
        .lte('richness', criteria.richness.max);
    }

    // 蔵元でフィルタ
    if (criteria.brewery) {
      query = query.ilike('brewery_name', `%${criteria.brewery}%`);
    }

    // キーワード検索
    if (criteria.keywords && criteria.keywords.length > 0) {
      const searchPattern = criteria.keywords.join('|');
      query = query.or(`brand_name.ilike.%${searchPattern}%,description.ilike.%${searchPattern}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching sakes:', error);
      return [];
    }

    return (data || []).map(sake => this.formatSakeData(sake));
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
        .filter(s => s.sweetness > 1)
        .sort((a, b) => b.sweetness - a.sweetness)
        .slice(0, 5),
      dry: allSakes
        .filter(s => s.sweetness < -1)
        .sort((a, b) => a.sweetness - b.sweetness)
        .slice(0, 5),
      rich: allSakes
        .filter(s => s.richness > 1)
        .sort((a, b) => b.richness - a.richness)
        .slice(0, 5),
      light: allSakes
        .filter(s => s.richness < -1)
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
    const elapsed = now.getTime() - this.lastFetch.getTime();
    
    return elapsed < this.CACHE_DURATION;
  }

  /**
   * 日本酒データのフォーマット
   */
  private formatSakeData(sake: Record<string, unknown>): SakeData {
    return {
      id: sake.id as string,
      brandId: (sake.brand_id as number) || 1,
      name: (sake.brand_name as string) || 'Unknown',
      brewery: (sake.brewery_name as string) || 'Unknown',
      breweryId: (sake.brewery_id as number) || 1,
      sweetness: (sake.sweetness as number) || 0,
      richness: (sake.richness as number) || 0,
      description: (sake.description as string) || '',
      flavorChart: {
        brandId: (sake.brand_id as number) || 1,
        f1: (sake.f1_floral as number) || 0.5,
        f2: (sake.f2_mellow as number) || 0.5,
        f3: (sake.f3_heavy as number) || 0.5,
        f4: (sake.f4_mild as number) || 0.5,
        f5: (sake.f5_dry as number) || 0.5,
        f6: (sake.f6_light as number) || 0.5,
      }
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
          f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.7, f5: 0.6, f6: 0.8
        }
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
          f1: 0.9, f2: 0.4, f3: 0.2, f4: 0.5, f5: 0.8, f6: 0.9
        }
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
          f1: 0.7, f2: 0.9, f3: 0.7, f4: 0.8, f5: 0.3, f6: 0.4
        }
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
          f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.6, f5: 0.7, f6: 0.6
        }
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
          f1: 0.6, f2: 0.7, f3: 0.6, f4: 0.7, f5: 0.5, f6: 0.5
        }
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
          f1: 0.8, f2: 0.6, f3: 0.4, f4: 0.6, f5: 0.6, f6: 0.7
        }
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
          f1: 0.7, f2: 0.4, f3: 0.3, f4: 0.5, f5: 0.8, f6: 0.8
        }
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
          f1: 0.5, f2: 0.8, f3: 0.8, f4: 0.7, f5: 0.4, f6: 0.3
        }
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
          f1: 0.6, f2: 0.7, f3: 0.6, f4: 0.8, f5: 0.4, f6: 0.5
        }
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
          f1: 0.4, f2: 0.3, f3: 0.3, f4: 0.4, f5: 0.9, f6: 0.8
        }
      }
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