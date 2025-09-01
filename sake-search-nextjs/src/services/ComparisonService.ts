/**
 * 日本酒比較関連のビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { SakeData } from '@/types/sake';
import { ApiClient, ApiClientError } from './core/ApiClient';

export interface ComparisonSession {
  id: string;
  userId?: string;
  sakes: SakeData[];
  createdAt: string;
  updatedAt: string;
  sharedUrl?: string;
}

export interface ComparisonAnalysis {
  sakes: SakeData[];
  averageSweetness: number;
  averageRichness: number;
  priceRange?: {
    min: number;
    max: number;
    average: number;
  };
  commonCharacteristics: string[];
  differences: {
    aspect: string;
    description: string;
  }[];
  recommendations: SakeData[];
}

export interface ComparisonShareOptions {
  expiresIn?: number; // 共有リンクの有効期限（秒）
  allowAnonymous?: boolean; // 匿名ユーザーのアクセス許可
}

export class ComparisonServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ComparisonServiceError';
  }
}

export class ComparisonService {
  private apiClient: ApiClient;
  private readonly MAX_COMPARISON_ITEMS = 10;
  private readonly MIN_COMPARISON_ITEMS = 2;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 比較セッションを作成または更新
   */
  async saveComparisonSession(sakes: SakeData[]): Promise<ComparisonSession> {
    try {
      this.validateComparisonItems(sakes);

      const response = await this.apiClient.post<ComparisonSession>('/api/v1/comparison/session', {
        sakes: sakes.map(sake => ({
          id: sake.id,
          name: sake.name,
          brewery: sake.brewery,
          brandId: sake.brandId,
          breweryId: sake.breweryId,
          sweetness: sake.sweetness,
          richness: sake.richness,
          description: sake.description,
        })),
      });

      return response.data;
    } catch (error) {
      this.handleError('比較セッションの保存に失敗しました', error);
    }
  }

  /**
   * 比較セッションを取得
   */
  async getComparisonSession(sessionId: string): Promise<ComparisonSession> {
    try {
      if (!sessionId) {
        throw new ComparisonServiceError('セッションIDが指定されていません');
      }

      const response = await this.apiClient.get<ComparisonSession>(`/api/v1/comparison/session/${sessionId}`);
      return response.data;
    } catch (error) {
      this.handleError('比較セッションの取得に失敗しました', error);
    }
  }

  /**
   * 現在のユーザーの比較セッションを取得
   */
  async getCurrentUserSession(): Promise<ComparisonSession | null> {
    try {
      const response = await this.apiClient.get<ComparisonSession>('/api/v1/comparison/current');
      return response.data;
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return null;
      }
      this.handleError('現在の比較セッションの取得に失敗しました', error);
    }
  }

  /**
   * 比較分析を実行
   */
  async analyzeComparison(sakes: SakeData[]): Promise<ComparisonAnalysis> {
    try {
      if (sakes.length < this.MIN_COMPARISON_ITEMS) {
        throw new ComparisonServiceError(`比較には最低${this.MIN_COMPARISON_ITEMS}個の日本酒が必要です`);
      }

      const response = await this.apiClient.post<ComparisonAnalysis>('/api/v1/comparison/analyze', {
        sakeIds: sakes.map(sake => sake.id),
      });

      return response.data;
    } catch (error) {
      this.handleError('比較分析の実行に失敗しました', error);
    }
  }

  /**
   * 比較リストを共有用URLを生成
   */
  async createShareableLink(
    sakes: SakeData[],
    options: ComparisonShareOptions = {}
  ): Promise<string> {
    try {
      this.validateComparisonItems(sakes);

      const response = await this.apiClient.post<{ url: string }>('/api/v1/comparison/share', {
        sakes: sakes.map(sake => ({
          id: sake.id,
          name: sake.name,
          brewery: sake.brewery,
        })),
        expiresIn: options.expiresIn || 86400 * 7, // デフォルト7日間
        allowAnonymous: options.allowAnonymous !== false, // デフォルトtrue
      });

      return response.data.url;
    } catch (error) {
      this.handleError('共有リンクの生成に失敗しました', error);
    }
  }

  /**
   * 共有リンクから比較リストを取得
   */
  async getSharedComparison(shareId: string): Promise<ComparisonSession> {
    try {
      if (!shareId) {
        throw new ComparisonServiceError('共有IDが指定されていません');
      }

      const response = await this.apiClient.get<ComparisonSession>(`/api/v1/comparison/shared/${shareId}`);
      return response.data;
    } catch (error) {
      this.handleError('共有比較リストの取得に失敗しました', error);
    }
  }

  /**
   * 比較に基づくレコメンドを取得
   */
  async getComparisonRecommendations(
    sakes: SakeData[],
    limit: number = 5
  ): Promise<SakeData[]> {
    try {
      if (sakes.length === 0) {
        return [];
      }

      const response = await this.apiClient.post<SakeData[]>('/api/v1/comparison/recommendations', {
        sakeIds: sakes.map(sake => sake.id),
        limit,
      });

      return response.data;
    } catch (error) {
      this.handleError('比較レコメンドの取得に失敗しました', error);
    }
  }

  /**
   * 比較履歴を取得
   */
  async getComparisonHistory(limit: number = 10): Promise<ComparisonSession[]> {
    try {
      const response = await this.apiClient.get<ComparisonSession[]>('/api/v1/comparison/history', {
        limit: limit.toString(),
      });

      return response.data;
    } catch (error) {
      this.handleError('比較履歴の取得に失敗しました', error);
    }
  }

  /**
   * 比較セッションを削除
   */
  async deleteComparisonSession(sessionId: string): Promise<void> {
    try {
      if (!sessionId) {
        throw new ComparisonServiceError('セッションIDが指定されていません');
      }

      await this.apiClient.delete(`/api/v1/comparison/session/${sessionId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return; // 既に削除済み
      }
      this.handleError('比較セッションの削除に失敗しました', error);
    }
  }

  /**
   * 比較可能な最大数を取得
   */
  getMaxComparisonItems(): number {
    return this.MAX_COMPARISON_ITEMS;
  }

  /**
   * 比較可能な最小数を取得
   */
  getMinComparisonItems(): number {
    return this.MIN_COMPARISON_ITEMS;
  }

  /**
   * 比較リストに追加可能かチェック
   */
  canAddToComparison(currentCount: number): boolean {
    return currentCount < this.MAX_COMPARISON_ITEMS;
  }

  /**
   * 比較分析が可能かチェック
   */
  canAnalyze(itemCount: number): boolean {
    return itemCount >= this.MIN_COMPARISON_ITEMS;
  }

  /**
   * プライベートメソッド: 比較アイテムのバリデーション
   */
  private validateComparisonItems(sakes: SakeData[]): void {
    if (!sakes || !Array.isArray(sakes)) {
      throw new ComparisonServiceError('比較リストが無効です');
    }

    if (sakes.length === 0) {
      throw new ComparisonServiceError('比較リストが空です');
    }

    if (sakes.length > this.MAX_COMPARISON_ITEMS) {
      throw new ComparisonServiceError(`比較は最大${this.MAX_COMPARISON_ITEMS}個までです`);
    }

    // 重複チェック
    const uniqueIds = new Set(sakes.map(sake => sake.id));
    if (uniqueIds.size !== sakes.length) {
      throw new ComparisonServiceError('比較リストに重複があります');
    }
  }

  /**
   * プライベートメソッド: エラーハンドリング
   */
  private handleError(message: string, error: any): never {
    if (error instanceof ComparisonServiceError) {
      throw error;
    }

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          throw new ComparisonServiceError('入力データが無効です');
        case 401:
          throw new ComparisonServiceError('ログインが必要です');
        case 403:
          throw new ComparisonServiceError('この操作の権限がありません');
        case 404:
          throw new ComparisonServiceError('データが見つかりません');
        case 429:
          throw new ComparisonServiceError('リクエストが多すぎます。しばらく待ってから再試行してください');
        case 500:
          throw new ComparisonServiceError('サーバーエラーが発生しました。時間をおいて再試行してください');
        default:
          throw new ComparisonServiceError(`${message} (${error.statusCode})`);
      }
    }

    throw new ComparisonServiceError(message, error);
  }
}