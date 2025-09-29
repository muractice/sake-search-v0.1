import { IFavoritesRepository } from '@/repositories/favorites/FavoritesRepository';
import { PreferenceAnalyzer } from '@/services/preferenceAnalyzer';
import { RecommendationEngine } from '@/services/recommendationEngine';
import type { FavoriteItem } from '@/types/favorites';
import type {
  RecommendationResult,
  RestaurantRecommendationType,
  RestaurantRecommendationsResult,
} from '@/types/recommendations';
import type { SakeData } from '@/types/sake';

export interface RestaurantRecommendationsRequest {
  type: RestaurantRecommendationType;
  menuItems: string[];
  restaurantMenuSakeData?: SakeData[];
  dishType?: string;
  count?: number;
  userId?: string | null;
}

export class RestaurantRecommendationsService {
  private readonly analyzer = new PreferenceAnalyzer();
  private readonly engine = new RecommendationEngine();

  constructor(
    private readonly favoritesRepository: IFavoritesRepository,
  ) {}

  async getRecommendations(
    request: RestaurantRecommendationsRequest,
  ): Promise<RestaurantRecommendationsResult> {
    const {
      type,
      menuItems,
      restaurantMenuSakeData,
      dishType,
      count = 10,
      userId,
    } = request;

    if (!menuItems || menuItems.length === 0) {
      throw new Error('Menu items are required');
    }

    const { menuSakeData, notFound } = this.buildMenuSakeData(
      restaurantMenuSakeData,
    );

    if (menuSakeData.length === 0) {
      throw new Error('No sake data found for menu items');
    }

    switch (type) {
      case 'similarity':
        return this.buildSimilarityRecommendations(
          menuSakeData,
          notFound,
          count,
          userId,
        );
      case 'pairing':
        return this.buildPairingRecommendations(menuSakeData, notFound, dishType, count);
      case 'random':
        return this.buildRandomRecommendation(menuSakeData, notFound);
      default:
        throw new Error('Invalid recommendation type');
    }
  }

  private buildMenuSakeData(
    provided: SakeData[] | undefined,
  ): { menuSakeData: SakeData[]; notFound: string[] } {
    if (!provided || provided.length === 0) {
      throw new Error('Menu sake data is required');
    }

    return {
      menuSakeData: provided,
      notFound: [],
    };
  }

  private async buildSimilarityRecommendations(
    menuSakeData: SakeData[],
    notFound: string[],
    count: number,
    userId?: string | null,
  ): Promise<RestaurantRecommendationsResult> {
    if (!userId) {
      return {
        recommendations: [],
        notFound,
        totalFound: menuSakeData.length,
        requiresMoreFavorites: true,
        message: 'レコメンド機能を利用するにはログインが必要です',
      };
    }

    const favorites = await this.favoritesRepository.list(userId);
    if (!favorites || favorites.length < 3) {
      return {
        recommendations: [],
        notFound,
        totalFound: menuSakeData.length,
        requiresMoreFavorites: true,
        favoritesCount: favorites.length,
        message: 'レコメンド機能を利用するには、お気に入りを3件以上登録してください',
      };
    }

    const favoriteSakes = this.extractFavoriteSakes(favorites);
    if (favoriteSakes.length < 3) {
      return {
        recommendations: [],
        notFound,
        totalFound: menuSakeData.length,
        requiresMoreFavorites: true,
        favoritesCount: favoriteSakes.length,
        message: 'お気に入りデータが不足しています。日本酒を追加してください。',
      };
    }

    const preferenceVector = this.analyzer.calculatePreferenceVector(favoriteSakes);

    const recommendations = menuSakeData
      .map<RecommendationResult>((sake) => {
        const similarity = this.engine.calculateSimilarity(preferenceVector, sake);
        return {
          sake,
          score: similarity,
          type: 'similar',
          reason: this.generateSimilarityReason(similarity),
          similarityScore: similarity,
          predictedRating: 1 + similarity * 4,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return {
      recommendations,
      notFound,
      totalFound: menuSakeData.length,
    };
  }

  private buildPairingRecommendations(
    menuSakeData: SakeData[],
    notFound: string[],
    dishType: string | undefined,
    count: number,
  ): RestaurantRecommendationsResult {
    const recommendations = this.generatePairingRecommendations(
      menuSakeData,
      dishType ?? 'general',
      count,
    );

    return {
      recommendations,
      notFound,
      totalFound: menuSakeData.length,
    };
  }

  private buildRandomRecommendation(
    menuSakeData: SakeData[],
    notFound: string[],
  ): RestaurantRecommendationsResult {
    if (menuSakeData.length === 0) {
      throw new Error('メニューに日本酒がありません');
    }

    const randomIndex = Math.floor(Math.random() * menuSakeData.length);
    const selectedSake = menuSakeData[randomIndex];

    return {
      recommendations: [
        {
          sake: selectedSake,
          score: 1,
          type: 'random',
          reason: this.generateRandomReason(),
          similarityScore: 0.5 + Math.random() * 0.3,
          predictedRating: 3.5 + Math.random() * 1.5,
        },
      ],
      notFound,
      totalFound: menuSakeData.length,
    };
  }

  private extractFavoriteSakes(favorites: FavoriteItem[]): (SakeData & { createdAt?: Date })[] {
    return favorites
      .map((favorite) => {
        if (!favorite.sakeData) return null;
        const createdAt = favorite.createdAt ? new Date(favorite.createdAt) : undefined;
        return {
          ...favorite.sakeData,
          createdAt,
        } as SakeData & { createdAt?: Date };
      })
      .filter((sake): sake is SakeData & { createdAt?: Date } => Boolean(sake));
  }

  private generateSimilarityReason(similarity: number): string {
    if (similarity > 0.9) return 'あなたの好みにぴったりの一本';
    if (similarity > 0.8) return 'あなたの好みに非常に近い味わい';
    if (similarity > 0.7) return 'お気に入りと似た特徴があります';
    if (similarity > 0.6) return 'バランスの良い味わいです';
    return '新しい味わいの発見におすすめ';
  }

  private generatePairingRecommendations(
    sakes: SakeData[],
    dishType: string,
    count: number,
  ): RecommendationResult[] {
    const pairingRules: Record<string, (sake: SakeData) => number> = {
      sashimi: (sake) => (sake.richness < 0 ? 1 : 0.5) + (sake.flavorChart?.f6 || 0.5),
      grilled: (sake) => (sake.richness > 0 ? 1 : 0.5) + (sake.flavorChart?.f5 || 0.5),
      fried: (sake) => (sake.sweetness < 0 ? 1 : 0.5) + (sake.flavorChart?.f5 || 0.5),
      soup: (sake) => (sake.flavorChart?.f2 || 0.5) + (sake.flavorChart?.f4 || 0.5),
      dessert: (sake) => (sake.sweetness > 0 ? 1 : 0.5) + (sake.flavorChart?.f1 || 0.5),
      general: () => 0.5 + Math.random() * 0.5,
    };

    const scoringFunction = pairingRules[dishType] || pairingRules.general;

    return sakes
      .map<RecommendationResult>((sake) => {
        const score = scoringFunction(sake);
        return {
          sake,
          score,
          type: 'pairing',
          reason: this.generatePairingReason(dishType),
          similarityScore: score / 2,
          predictedRating: 3 + score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private generatePairingReason(dishType: string): string {
    const reasons: Record<string, string> = {
      sashimi: '刺身の繊細な味わいを引き立てます',
      grilled: '焼き物の香ばしさと相性抜群',
      fried: '揚げ物の油をさっぱりと流します',
      soup: '汁物の温かさに寄り添う優しい味わい',
      dessert: 'デザートと楽しむ贅沢な時間に',
      general: '幅広い料理と合わせやすい万能タイプ',
    };

    return reasons[dishType] || reasons.general;
  }

  private generateRandomReason(): string {
    const reasons = [
      '本日のラッキー酒',
      '隠れた名酒を発見',
      '新しい味わいとの出会い',
      'スタッフおすすめの一本',
      '今宵の特別な一杯',
      '運命の出会いかも？',
      '気分転換にぴったり',
      '話題作りにもってこい',
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }
}
