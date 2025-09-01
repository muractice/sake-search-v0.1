/**
 * レコメンドシステムのビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { SakeData } from '@/types/sake';
import { ApiClient, ApiClientError } from './core/ApiClient';

export interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

export interface RecommendationOptions {
  count?: number;
  mood?: 'usual' | 'adventurous' | 'conservative' | 'trendy';
  includeSimilar?: boolean;
  includeExplore?: boolean;
  includeTrending?: boolean;
}

export interface RestaurantRecommendationOptions {
  type: 'similarity' | 'pairing' | 'random';
  menuItems: string[];
  restaurantMenuSakeData?: SakeData[];
  dishType?: string;
  count?: number;
}

export interface TrendingRecommendationOptions {
  count?: number;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface RecommendationResponse {
  recommendations: RecommendationResult[];
  notFound?: string[];
  totalFound?: number;
  requiresMoreFavorites?: boolean;
  favoritesCount?: number;
  message?: string;
}

export class RecommendationServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'RecommendationServiceError';
  }
}

export class RecommendationService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 飲食店向けレコメンドを取得
   */
  async getRestaurantRecommendations(options: RestaurantRecommendationOptions): Promise<RecommendationResponse> {
    this.validateRestaurantOptions(options);

    try {
      const response = await this.apiClient.post<RecommendationResponse>('/api/recommendations/restaurant', {
        type: options.type,
        menuItems: options.menuItems,
        restaurantMenuSakeData: options.restaurantMenuSakeData,
        dishType: options.dishType,
        count: options.count || 10
      });

      return response.data;
    } catch (error) {
      this.handleError('飲食店レコメンドの取得に失敗しました', error);
    }
  }

  /**
   * 個人向けレコメンドを取得
   */
  async getPersonalRecommendations(options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    try {
      const response = await this.apiClient.post<{ recommendations: RecommendationResult[] }>('/api/recommendations', {
        count: options.count || 20,
        mood: options.mood || 'usual',
        includeSimilar: options.includeSimilar !== false,
        includeExplore: options.includeExplore !== false,
        includeTrending: options.includeTrending !== false
      });

      return response.data.recommendations;
    } catch (error) {
      this.handleError('個人レコメンドの取得に失敗しました', error);
    }
  }

  /**
   * トレンドレコメンドを取得
   */
  async getTrendingRecommendations(options: TrendingRecommendationOptions = {}): Promise<RecommendationResult[]> {
    try {
      const response = await this.apiClient.get<{ recommendations: RecommendationResult[] }>('/api/recommendations/trending', {
        count: (options.count || 10).toString(),
        period: options.period || 'weekly'
      });

      return response.data.recommendations;
    } catch (error) {
      this.handleError('トレンドレコメンドの取得に失敗しました', error);
    }
  }

  /**
   * 類似性ベースレコメンドを取得
   */
  async getSimilarityRecommendations(sakeIds: string[], count: number = 10): Promise<RecommendationResult[]> {
    if (!sakeIds || sakeIds.length === 0) {
      throw new RecommendationServiceError('比較する日本酒が指定されていません');
    }

    try {
      const response = await this.apiClient.post<{ recommendations: RecommendationResult[] }>('/api/recommendations/similarity', {
        sakeIds,
        count
      });

      return response.data.recommendations;
    } catch (error) {
      this.handleError('類似性レコメンドの取得に失敗しました', error);
    }
  }

  /**
   * 気分別レコメンドを取得
   */
  async getMoodRecommendations(mood: RecommendationOptions['mood'], count: number = 10): Promise<RecommendationResult[]> {
    try {
      const response = await this.apiClient.post<{ recommendations: RecommendationResult[] }>('/api/recommendations/mood', {
        mood,
        count
      });

      return response.data.recommendations;
    } catch (error) {
      this.handleError('気分別レコメンドの取得に失敗しました', error);
    }
  }

  /**
   * ユーザーのお気に入りをクリア
   */
  async clearRecommendationCache(): Promise<void> {
    try {
      await this.apiClient.delete('/api/recommendations/cache');
    } catch (error) {
      this.handleError('レコメンドキャッシュのクリアに失敗しました', error);
    }
  }

  /**
   * レコメンド履歴を取得
   */
  async getRecommendationHistory(limit: number = 20): Promise<RecommendationResult[]> {
    try {
      const response = await this.apiClient.get<{ recommendations: RecommendationResult[] }>('/api/recommendations/history', {
        limit: limit.toString()
      });

      return response.data.recommendations;
    } catch (error) {
      this.handleError('レコメンド履歴の取得に失敗しました', error);
    }
  }

  /**
   * ランダムピック（おすすめガチャ）を取得
   */
  async getRandomPick(menuItems?: string[]): Promise<RecommendationResult> {
    try {
      const response = await this.apiClient.post<{ recommendation: RecommendationResult }>('/api/recommendations/random', {
        menuItems
      });

      return response.data.recommendation;
    } catch (error) {
      this.handleError('おすすめガチャの取得に失敗しました', error);
    }
  }

  /**
   * 料理とのペアリングレコメンドを取得
   */
  async getPairingRecommendations(
    dishType: string, 
    availableSakes: SakeData[], 
    count: number = 5
  ): Promise<RecommendationResult[]> {
    try {
      const response = await this.apiClient.post<{ recommendations: RecommendationResult[] }>('/api/recommendations/pairing', {
        dishType,
        availableSakes: availableSakes.map(sake => ({
          id: sake.id,
          name: sake.name,
          brewery: sake.brewery,
          sweetness: sake.sweetness,
          richness: sake.richness,
          flavorChart: sake.flavorChart
        })),
        count
      });

      return response.data.recommendations;
    } catch (error) {
      this.handleError('ペアリングレコメンドの取得に失敗しました', error);
    }
  }

  /**
   * プライベートメソッド: バリデーション
   */
  private validateRestaurantOptions(options: RestaurantRecommendationOptions): void {
    if (!options.menuItems || !Array.isArray(options.menuItems) || options.menuItems.length === 0) {
      throw new RecommendationServiceError('メニューアイテムが指定されていません');
    }

    if (!['similarity', 'pairing', 'random'].includes(options.type)) {
      throw new RecommendationServiceError('無効なレコメンドタイプです');
    }

    if (options.count && (options.count < 1 || options.count > 50)) {
      throw new RecommendationServiceError('取得件数は1〜50の範囲で指定してください');
    }
  }

  /**
   * プライベートメソッド: エラーハンドリング
   */
  private handleError(message: string, error: any): never {
    if (error instanceof RecommendationServiceError) {
      throw error;
    }

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          throw new RecommendationServiceError('リクエストが無効です');
        case 401:
          throw new RecommendationServiceError('ログインが必要です');
        case 403:
          throw new RecommendationServiceError('この機能の利用権限がありません');
        case 404:
          throw new RecommendationServiceError('レコメンドデータが見つかりません');
        case 429:
          throw new RecommendationServiceError('リクエストが多すぎます。しばらく待ってから再試行してください');
        case 500:
          throw new RecommendationServiceError('サーバーでエラーが発生しました。時間をおいて再試行してください');
        default:
          throw new RecommendationServiceError(`${message} (${error.statusCode})`);
      }
    }

    throw new RecommendationServiceError(message, error);
  }
}