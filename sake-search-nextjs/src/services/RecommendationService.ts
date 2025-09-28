/**
 * レコメンドシステムのビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { SakeData } from '@/types/sake';
import { ApiClient } from './core/ApiClient';
import { mapToServiceError } from './core/errorMapping';

export interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

export interface RestaurantRecommendationOptions {
  type: 'similarity' | 'pairing' | 'random';
  menuItems: string[];
  restaurantMenuSakeData?: SakeData[];
  dishType?: string;
  count?: number;
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
  constructor(message: string, public originalError?: unknown) {
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
  private handleError(message: string, error: unknown): never {
    const mapped = mapToServiceError(error, RecommendationServiceError, {
      defaultMessage: message,
      invalidInputMessage: 'リクエストが無効です',
      unauthorizedMessage: 'ログインが必要です',
      forbiddenMessage: 'この機能の利用権限がありません',
      notFoundMessage: 'レコメンドデータが見つかりません',
      tooManyRequestsMessage: 'リクエストが多すぎます。しばらく待ってから再試行してください',
      serverErrorMessage: 'サーバーでエラーが発生しました。時間をおいて再試行してください',
    });
    throw mapped;
  }
}
