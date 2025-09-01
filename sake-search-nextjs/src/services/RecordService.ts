/**
 * 飲酒記録関連のビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { DrinkingRecord, CreateRecordInput, UpdateRecordInput } from '@/types/record';
import { ApiClient, ApiClientError } from './core/ApiClient';

export interface RecordFilters {
  sakeId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  ratingMin?: number;
  ratingMax?: number;
  prefecture?: string;
  brewery?: string;
  hasmemo?: boolean;
}

export interface RecordSearchOptions {
  filters?: RecordFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'rating' | 'created_at' | 'sake_name';
  sortOrder?: 'asc' | 'desc';
}

export interface RecordSearchResult {
  records: DrinkingRecord[];
  total: number;
  hasMore: boolean;
  filters?: RecordFilters;
  timestamp: string;
}

export interface RecordStatistics {
  totalRecords: number;
  uniqueSakes: number;
  averageRating: number;
  mostRatedPrefecture?: string;
  recentActivity: {
    thisWeek: number;
    thisMonth: number;
  };
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

export class RecordServiceError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'RecordServiceError';
  }
}

export class RecordService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * ユーザーの全飲酒記録を取得
   */
  async getRecords(options: RecordSearchOptions = {}): Promise<RecordSearchResult> {
    try {
      const response = await this.apiClient.post<RecordSearchResult>('/api/v1/records/search', {
        ...options,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'date',
        sortOrder: options.sortOrder || 'desc',
      });

      return response.data;
    } catch (error) {
      this.handleError('飲酒記録の取得に失敗しました', error);
    }
  }

  /**
   * 飲酒記録を作成
   */
  async createRecord(input: CreateRecordInput): Promise<DrinkingRecord> {
    try {
      // バリデーション
      this.validateCreateInput(input);

      const response = await this.apiClient.post<DrinkingRecord>('/api/v1/records', {
        ...input,
        date: input.date || new Date().toISOString().split('T')[0], // デフォルトは今日
      });

      return response.data;
    } catch (error) {
      this.handleError('飲酒記録の作成に失敗しました', error);
    }
  }

  /**
   * 飲酒記録を更新
   */
  async updateRecord(recordId: string, input: UpdateRecordInput): Promise<DrinkingRecord> {
    try {
      if (!recordId) {
        throw new RecordServiceError('記録IDが指定されていません');
      }

      this.validateUpdateInput(input);

      const response = await this.apiClient.put<DrinkingRecord>(`/api/v1/records/${recordId}`, input);
      return response.data;
    } catch (error) {
      this.handleError('飲酒記録の更新に失敗しました', error);
    }
  }

  /**
   * 飲酒記録を削除
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      if (!recordId) {
        throw new RecordServiceError('記録IDが指定されていません');
      }

      await this.apiClient.delete(`/api/v1/records/${recordId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        // 既に削除済みの場合は成功として扱う
        return;
      }
      this.handleError('飲酒記録の削除に失敗しました', error);
    }
  }

  /**
   * 特定の日本酒の記録を取得
   */
  async getRecordsForSake(sakeId: string): Promise<DrinkingRecord[]> {
    try {
      if (!sakeId) {
        throw new RecordServiceError('日本酒IDが指定されていません');
      }

      const result = await this.getRecords({
        filters: { sakeId },
        limit: 100, // 同じ日本酒の記録は通常多くない
      });

      return result.records;
    } catch (error) {
      this.handleError('日本酒の記録取得に失敗しました', error);
    }
  }

  /**
   * 特定の日本酒の記録があるかチェック
   */
  async hasRecordForSake(sakeId: string): Promise<boolean> {
    try {
      const records = await this.getRecordsForSake(sakeId);
      return records.length > 0;
    } catch (error) {
      // エラーの場合はfalseを返す（記録なしと同等）
      console.warn('記録チェック中にエラー:', error);
      return false;
    }
  }

  /**
   * 記録統計を取得
   */
  async getStatistics(): Promise<RecordStatistics> {
    try {
      const response = await this.apiClient.get<RecordStatistics>('/api/v1/records/statistics');
      return response.data;
    } catch (error) {
      this.handleError('記録統計の取得に失敗しました', error);
    }
  }

  /**
   * 月別記録サマリーを取得
   */
  async getMonthlyRecords(year: number, month: number): Promise<DrinkingRecord[]> {
    try {
      if (year < 2000 || year > 3000) {
        throw new RecordServiceError('無効な年が指定されました');
      }
      if (month < 1 || month > 12) {
        throw new RecordServiceError('無効な月が指定されました');
      }

      // 月の範囲を計算
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 月末日

      const result = await this.getRecords({
        filters: {
          dateFrom: startDate,
          dateTo: endDate,
        },
        limit: 1000, // 1ヶ月分なので多めに設定
        sortBy: 'date',
        sortOrder: 'desc',
      });

      return result.records;
    } catch (error) {
      this.handleError('月別記録の取得に失敗しました', error);
    }
  }

  /**
   * 最近の記録を取得（ダッシュボード用）
   */
  async getRecentRecords(limit: number = 10): Promise<DrinkingRecord[]> {
    try {
      const result = await this.getRecords({
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      return result.records;
    } catch (error) {
      this.handleError('最近の記録取得に失敗しました', error);
    }
  }

  /**
   * 高評価記録を取得
   */
  async getHighRatedRecords(minRating: number = 4, limit: number = 20): Promise<DrinkingRecord[]> {
    try {
      if (minRating < 1 || minRating > 5) {
        throw new RecordServiceError('評価は1-5の範囲で指定してください');
      }

      const result = await this.getRecords({
        filters: { ratingMin: minRating },
        limit,
        sortBy: 'rating',
        sortOrder: 'desc',
      });

      return result.records;
    } catch (error) {
      this.handleError('高評価記録の取得に失敗しました', error);
    }
  }

  /**
   * プライベートメソッド: 作成入力のバリデーション
   */
  private validateCreateInput(input: CreateRecordInput): void {
    if (!input.sakeId || typeof input.sakeId !== 'string') {
      throw new RecordServiceError('日本酒IDが必要です');
    }

    if (!input.sakeName || typeof input.sakeName !== 'string' || input.sakeName.trim().length === 0) {
      throw new RecordServiceError('日本酒名が必要です');
    }

    if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5) {
      throw new RecordServiceError('評価は1-5の範囲で入力してください');
    }

    if (input.date && !this.isValidDate(input.date)) {
      throw new RecordServiceError('日付の形式が正しくありません (YYYY-MM-DD)');
    }

    if (input.memo && input.memo.length > 1000) {
      throw new RecordServiceError('メモは1000文字以内で入力してください');
    }
  }

  /**
   * プライベートメソッド: 更新入力のバリデーション
   */
  private validateUpdateInput(input: UpdateRecordInput): void {
    if (input.rating !== undefined) {
      if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5) {
        throw new RecordServiceError('評価は1-5の範囲で入力してください');
      }
    }

    if (input.date !== undefined && !this.isValidDate(input.date)) {
      throw new RecordServiceError('日付の形式が正しくありません (YYYY-MM-DD)');
    }

    if (input.memo !== undefined && input.memo.length > 1000) {
      throw new RecordServiceError('メモは1000文字以内で入力してください');
    }
  }

  /**
   * プライベートメソッド: 日付形式チェック
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    
    return date.getFullYear() === year &&
           date.getMonth() + 1 === month &&
           date.getDate() === day;
  }

  /**
   * プライベートメソッド: エラーハンドリング
   */
  private handleError(message: string, error: unknown): never {
    if (error instanceof RecordServiceError) {
      throw error;
    }

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          throw new RecordServiceError('入力データが無効です');
        case 401:
          throw new RecordServiceError('ログインが必要です');
        case 403:
          throw new RecordServiceError('この操作の権限がありません');
        case 404:
          throw new RecordServiceError('指定された記録が見つかりません');
        case 429:
          throw new RecordServiceError('リクエストが多すぎます。しばらく待ってから再試行してください');
        case 500:
          throw new RecordServiceError('サーバーエラーが発生しました。時間をおいて再試行してください');
        default:
          throw new RecordServiceError(`${message} (${error.statusCode})`);
      }
    }

    // その他のエラー
    throw new RecordServiceError(message, error);
  }
}