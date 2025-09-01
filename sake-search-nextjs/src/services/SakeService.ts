/**
 * 日本酒関連のビジネスロジックを担当するService
 * Web/Mobileで共通利用可能
 */

import { SakeData } from '@/types/sake';
import { ApiClient, ApiClientError } from './core/ApiClient';

export interface SakeSearchFilters {
  prefecture?: string;
  type?: string;
  sweetness?: {
    min?: number;
    max?: number;
  };
  richness?: {
    min?: number;
    max?: number;
  };
  minRating?: number;
  maxPrice?: number;
}

export interface SakeSearchOptions {
  query: string;
  filters?: SakeSearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'rating' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface SakeSearchResult {
  sakes: SakeData[];
  total: number;
  query: string;
  filters?: SakeSearchFilters;
  hasMore: boolean;
  timestamp: string;
}

export class SakeSearchError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'SakeSearchError';
  }
}

export class SakeService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 日本酒を検索する
   */
  async searchSakes(options: SakeSearchOptions): Promise<SakeSearchResult> {
    try {
      // 入力バリデーション
      this.validateSearchQuery(options.query);

      const response = await this.apiClient.post<SakeSearchResult>('/api/v1/sakes/search', {
        ...options,
        limit: options.limit || 20,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'relevance',
      });

      return response.data;
    } catch (error) {
      this.handleSearchError(error);
    }
  }

  /**
   * 単純な検索（後方互換性のため）
   */
  async search(query: string): Promise<SakeData | null> {
    try {
      const result = await this.searchSakes({ query, limit: 1 });
      return result.sakes.length > 0 ? result.sakes[0] : null;
    } catch (error) {
      this.handleSearchError(error);
    }
  }

  /**
   * 日本酒IDで詳細取得
   */
  async getSakeById(id: string): Promise<SakeData | null> {
    try {
      if (!id) {
        throw new SakeSearchError('日本酒IDが指定されていません');
      }

      const response = await this.apiClient.get<SakeData>(`/api/v1/sakes/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof SakeSearchError) {
        throw error;
      }
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return null;
      }
      throw new SakeSearchError('日本酒の詳細取得に失敗しました', error);
    }
  }

  /**
   * トレンド日本酒を取得
   */
  async getTrendingSakes(limit: number = 10): Promise<SakeData[]> {
    try {
      const response = await this.apiClient.get<SakeData[]>('/api/v1/sakes/trending', {
        limit: limit.toString(),
      });
      return response.data;
    } catch (error) {
      throw new SakeSearchError('トレンド日本酒の取得に失敗しました', error);
    }
  }

  /**
   * 検索候補を取得（オートコンプリート用）
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const response = await this.apiClient.get<string[]>('/api/v1/sakes/suggestions', {
        q: query,
        limit: limit.toString(),
      });
      return response.data;
    } catch (error) {
      // 候補取得は失敗してもエラーにしない
      console.warn('検索候補の取得に失敗しました:', error);
      return [];
    }
  }

  /**
   * プライベートメソッド: クエリバリデーション
   */
  private validateSearchQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new SakeSearchError('検索クエリが空です');
    }

    if (query.trim().length === 0) {
      throw new SakeSearchError('検索クエリが空です');
    }

    if (query.length > 100) {
      throw new SakeSearchError('検索クエリが長すぎます（100文字以内）');
    }

    // SQLインジェクション的な文字列をチェック（基本的な防御）
    const dangerousPatterns = [';', '--', '/*', '*/', 'xp_', 'sp_'];
    if (dangerousPatterns.some(pattern => query.toLowerCase().includes(pattern))) {
      throw new SakeSearchError('無効な文字が含まれています');
    }
  }

  /**
   * プライベートメソッド: エラーハンドリング
   */
  private handleSearchError(error: unknown): never {
    if (error instanceof SakeSearchError) {
      throw error;
    }

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          throw new SakeSearchError('検索パラメータが無効です');
        case 429:
          throw new SakeSearchError('検索リクエストが多すぎます。しばらく待ってから再試行してください');
        case 500:
          throw new SakeSearchError('サーバーエラーが発生しました。時間をおいて再試行してください');
        default:
          throw new SakeSearchError(`検索に失敗しました (${error.statusCode})`);
      }
    }

    // その他のエラー
    throw new SakeSearchError('日本酒の検索に失敗しました', error);
  }
}