/**
 * 飲酒記録関連のビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { DrinkingRecord, CreateRecordInput, UpdateRecordInput } from '@/types/record';
import { mapToServiceError } from './core/errorMapping';
import type { IRecordRepository } from '@/repositories/records/RecordRepository';
import type {
  RecordFilters,
  RecordSearchOptions,
  RecordSearchResult,
  RecordStatistics,
} from './records/types';

export class RecordServiceError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'RecordServiceError';
  }
}

export class RecordService {
  private repository: IRecordRepository;

  constructor(repository: IRecordRepository) {
    this.repository = repository;
  }

  /**
   * ユーザーの全飲酒記録を取得
   */
  async getRecords(options: RecordSearchOptions = {}): Promise<RecordSearchResult> {
    try {
      return await this.repository.searchForCurrentUser({
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'date',
        sortOrder: options.sortOrder || 'desc',
        filters: options.filters,
      });
    } catch (error) {
      this.handleError('飲酒記録の取得に失敗しました', error);
    }
  }

  /**
   * 飲酒記録を作成
   */
  async createRecord(input: CreateRecordInput): Promise<DrinkingRecord> {
    try {
      this.validateCreateInput(input);
      return await this.repository.createForCurrentUser({
        ...input,
        date: input.date || new Date().toISOString().split('T')[0],
      });
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
      return await this.repository.updateForCurrentUser(recordId, input);
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

      await this.repository.delete(recordId);
    } catch (error) {
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

      const result = await this.repository.searchForCurrentUser({
        filters: { sakeId },
        limit: 100,
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
      console.warn('記録チェック中にエラー:', error);
      return false;
    }
  }

  /**
   * 記録統計を取得
   */
  async getStatistics(): Promise<RecordStatistics> {
    try {
      const records = await this.fetchAllRecords();
      const totalRecords = records.length;
      const uniqueSakes = new Set(records.map((r) => r.sakeId)).size;
      const averageRating = totalRecords === 0
        ? 0
        : records.reduce((sum, r) => sum + r.rating, 0) / totalRecords;

      const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: records.filter((r) => r.rating === rating).length,
      }));

      const recentActivity = this.calculateRecentActivity(records);
      const mostRatedPrefecture = this.findMostRatedPrefecture(records);

      return {
        totalRecords,
        uniqueSakes,
        averageRating,
        mostRatedPrefecture,
        recentActivity,
        ratingDistribution,
      };
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

      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];

      const result = await this.repository.searchForCurrentUser({
        filters: {
          dateFrom: startDate,
          dateTo: endDate,
        },
        limit: 1000,
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
      const result = await this.repository.searchForCurrentUser({
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

      const result = await this.repository.searchForCurrentUser({
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

  private async fetchAllRecords(filters?: RecordFilters): Promise<DrinkingRecord[]> {
    const pageSize = 200;
    let offset = 0;
    const allRecords: DrinkingRecord[] = [];
    let hasMore = true;

    while (hasMore) {
      const result = await this.repository.searchForCurrentUser({
        filters,
        limit: pageSize,
        offset,
        sortBy: 'date',
        sortOrder: 'desc',
      });

      allRecords.push(...result.records);
      hasMore = result.hasMore;
      offset += pageSize;

      if (!hasMore && result.records.length === 0) {
        break;
      }
    }

    return allRecords;
  }

  private calculateRecentActivity(records: DrinkingRecord[]) {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    const thisWeek = records.filter((record) => new Date(record.date) >= weekAgo).length;
    const thisMonth = records.filter((record) => new Date(record.date) >= monthAgo).length;

    return { thisWeek, thisMonth };
  }

  private findMostRatedPrefecture(records: DrinkingRecord[]) {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      if (!record.sakePrefecture) return;
      counts.set(record.sakePrefecture, (counts.get(record.sakePrefecture) ?? 0) + 1);
    });

    let maxPrefecture: string | undefined;
    let maxCount = 0;
    counts.forEach((count, prefecture) => {
      if (count > maxCount) {
        maxCount = count;
        maxPrefecture = prefecture;
      }
    });

    return maxPrefecture;
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
    const mapped = mapToServiceError(error, RecordServiceError, {
      defaultMessage: message,
      invalidInputMessage: '入力データが無効です',
      unauthorizedMessage: 'ログインが必要です',
      forbiddenMessage: 'この操作の権限がありません',
      notFoundMessage: '指定された記録が見つかりません',
      tooManyRequestsMessage: 'リクエストが多すぎます。しばらく待ってから再試行してください',
    });
    throw mapped;
  }
}
