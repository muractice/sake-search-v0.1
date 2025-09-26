/**
 * RecordServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { RecordService, RecordServiceError } from '../RecordService';
import type { IRecordRepository } from '@/repositories/records/RecordRepository';
import type { RecordSearchOptions, RecordSearchResult } from '../records/types';
import { DrinkingRecord, CreateRecordInput, UpdateRecordInput } from '@/types/record';

class MockRecordRepository implements IRecordRepository {
  public lastSearchOptions?: RecordSearchOptions;
  public lastCreatePayload?: CreateRecordInput;
  public lastUpdatePayload?: UpdateRecordInput;
  public deletedRecordIds: string[] = [];
  public shouldThrowError = false;
  public errorToThrow: unknown = null;
  public searchResult: RecordSearchResult;
  public nextCreateResult?: DrinkingRecord;
  public nextUpdateResult?: DrinkingRecord;

  constructor(initialRecord: DrinkingRecord) {
    this.searchResult = {
      records: [initialRecord],
      total: 1,
      hasMore: false,
      timestamp: '2024-01-15T10:00:00Z',
      filters: undefined,
    };
    this.nextCreateResult = initialRecord;
    this.nextUpdateResult = initialRecord;
  }

  private maybeThrow(): void {
    if (this.shouldThrowError) {
      throw this.errorToThrow ?? Object.assign(new Error('mock error'), { status: 500 });
    }
  }

  async searchForCurrentUser(options: RecordSearchOptions = {}): Promise<RecordSearchResult> {
    this.maybeThrow();
    this.lastSearchOptions = options;
    return this.searchResult;
  }

  async getById(): Promise<DrinkingRecord | null> {
    this.maybeThrow();
    return this.searchResult.records[0] ?? null;
  }

  async createForCurrentUser(input: CreateRecordInput): Promise<DrinkingRecord> {
    this.maybeThrow();
    this.lastCreatePayload = input;
    return {
      ...this.nextCreateResult!,
      ...input,
      id: this.nextCreateResult?.id ?? 'created-id',
      userId: this.nextCreateResult?.userId ?? 'user-1',
      date: input.date ?? this.nextCreateResult?.date ?? new Date().toISOString().split('T')[0],
      createdAt: this.nextCreateResult?.createdAt ?? new Date().toISOString(),
      updatedAt: this.nextCreateResult?.updatedAt ?? new Date().toISOString(),
    };
  }

  async updateForCurrentUser(recordId: string, input: UpdateRecordInput): Promise<DrinkingRecord> {
    this.maybeThrow();
    this.lastUpdatePayload = input;
    return {
      ...this.nextUpdateResult!,
      id: recordId,
      ...input,
      updatedAt: new Date().toISOString(),
    } as DrinkingRecord;
  }

  async delete(recordId: string): Promise<void> {
    this.maybeThrow();
    this.deletedRecordIds.push(recordId);
  }
}

describe('RecordService', () => {
  let mockRepository: MockRecordRepository;
  let recordService: RecordService;

  const mockRecord: DrinkingRecord = {
    id: '1',
    userId: 'user-1',
    sakeId: 'sake-1',
    sakeName: '獺祭 純米大吟醸',
    sakeBrewery: '旭酒造',
    sakePrefecture: '山口県',
    date: '2024-01-15',
    rating: 5,
    memo: '美味しかった',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    mockRepository = new MockRecordRepository(mockRecord);
    recordService = new RecordService(mockRepository);
  });

  describe('getRecords', () => {
    it('should get records successfully', async () => {
      const result = await recordService.getRecords();

      expect(result).toEqual(mockRepository.searchResult);
      expect(mockRepository.lastSearchOptions).toEqual({
        limit: 50,
        offset: 0,
        sortBy: 'date',
        sortOrder: 'desc',
        filters: undefined,
      });
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.getRecords()).rejects.toThrow('飲酒記録の取得に失敗しました');
    });
  });

  describe('createRecord', () => {
    const validInput: CreateRecordInput = {
      sakeId: 'sake-1',
      sakeName: '獺祭',
      sakeBrewery: '旭酒造',
      rating: 4,
      memo: '美味しかった',
    };

    it('should create record successfully', async () => {
      const result = await recordService.createRecord(validInput);

      expect(result).toEqual(expect.objectContaining({
        id: mockRecord.id,
        sakeId: validInput.sakeId,
        sakeName: validInput.sakeName,
      }));
    });

    it('should validate required fields', async () => {
      const invalidInputs = [
        { ...validInput, sakeId: '' },
        { ...validInput, sakeId: undefined as unknown as string },
        { ...validInput, sakeName: '' },
        { ...validInput, sakeName: '   ' },
        { ...validInput, rating: 0 },
        { ...validInput, rating: 6 },
        { ...validInput, rating: 'invalid' as unknown as number },
      ];

      for (const input of invalidInputs) {
        await expect(recordService.createRecord(input)).rejects.toThrow(RecordServiceError);
      }
    });

    it('should validate date format', async () => {
      const invalidDates = [
        'invalid-date',
        '2024/01/15',
        '15-01-2024',
        '2024-13-01',
        '2024-01-32',
      ];

      for (const date of invalidDates) {
        await expect(
          recordService.createRecord({ ...validInput, date })
        ).rejects.toThrow('日付の形式が正しくありません');
      }
    });

    it('should validate memo length', async () => {
      const longMemo = 'a'.repeat(1001);
      
      await expect(
        recordService.createRecord({ ...validInput, memo: longMemo })
      ).rejects.toThrow('メモは1000文字以内で入力してください');
    });

    it('should set default date', async () => {
      const today = new Date().toISOString().split('T')[0];

      const result = await recordService.createRecord(validInput);

      expect(result.date).toBe(today);
      expect(mockRepository.lastCreatePayload?.date).toBe(today);
    });
  });

  describe('updateRecord', () => {
    it('should update record successfully', async () => {
      const recordId = '1';
      const updateData: UpdateRecordInput = {
        rating: 4,
        memo: 'いい香り',
      };

      const result = await recordService.updateRecord(recordId, updateData);

      expect(result).toEqual(expect.objectContaining(updateData));
      expect(mockRepository.lastUpdatePayload).toEqual(updateData);
    });

    it('should validate recordId', async () => {
      await expect(recordService.updateRecord('', {})).rejects.toThrow('記録IDが指定されていません');
    });

    it('should validate rating range', async () => {
      await expect(
        recordService.updateRecord('1', { rating: 6 })
      ).rejects.toThrow('評価は1-5の範囲で入力してください');
    });

    it('should validate date format', async () => {
      await expect(
        recordService.updateRecord('1', { date: '2024/01/15' })
      ).rejects.toThrow('日付の形式が正しくありません');
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.updateRecord('1', { rating: 4 })).rejects.toThrow('飲酒記録の更新に失敗しました');
    });
  });

  describe('deleteRecord', () => {
    it('should delete record successfully', async () => {
      await expect(recordService.deleteRecord('1')).resolves.toBeUndefined();
      expect(mockRepository.deletedRecordIds).toContain('1');
    });

    it('should validate recordId', async () => {
      await expect(recordService.deleteRecord('')).rejects.toThrow('記録IDが指定されていません');
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.deleteRecord('1')).rejects.toThrow('飲酒記録の削除に失敗しました');
    });
  });

  describe('getRecordsForSake', () => {
    it('should get records for sake', async () => {
      const result = await recordService.getRecordsForSake('sake-1');

      expect(result).toEqual(mockRepository.searchResult.records);
      expect(mockRepository.lastSearchOptions?.filters).toEqual({ sakeId: 'sake-1' });
    });

    it('should validate sakeId', async () => {
      await expect(recordService.getRecordsForSake('')).rejects.toThrow('日本酒IDが指定されていません');
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.getRecordsForSake('sake-1')).rejects.toThrow('日本酒の記録取得に失敗しました');
    });
  });

  describe('hasRecordForSake', () => {
    it('should return true when records exist', async () => {
      await expect(recordService.hasRecordForSake('sake-1')).resolves.toBe(true);
    });

    it('should return false when repository throws error', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.hasRecordForSake('sake-1')).resolves.toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should compute statistics correctly', async () => {
      const records: DrinkingRecord[] = [
        { ...mockRecord, rating: 5 },
        { ...mockRecord, id: '2', rating: 4, sakePrefecture: '広島県', date: '2024-01-10' },
      ];
      mockRepository.searchResult = {
        records,
        total: records.length,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
        filters: undefined,
      };

      const stats = await recordService.getStatistics();

      expect(stats.totalRecords).toBe(2);
      expect(stats.uniqueSakes).toBe(1);
      expect(stats.averageRating).toBeCloseTo(4.5);
      expect(stats.recentActivity.thisMonth).toBeGreaterThanOrEqual(0);
      expect(stats.ratingDistribution.find((r) => r.rating === 5)?.count).toBe(1);
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.getStatistics()).rejects.toThrow('記録統計の取得に失敗しました');
    });
  });

  describe('getMonthlyRecords', () => {
    it('should get monthly records', async () => {
      const result = await recordService.getMonthlyRecords(2024, 1);

      expect(result).toEqual(mockRepository.searchResult.records);
      expect(mockRepository.lastSearchOptions?.filters).toEqual({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });
    });

    it('should validate year and month', async () => {
      await expect(recordService.getMonthlyRecords(1999, 1)).rejects.toThrow('無効な年が指定されました');
      await expect(recordService.getMonthlyRecords(2024, 13)).rejects.toThrow('無効な月が指定されました');
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.getMonthlyRecords(2024, 1)).rejects.toThrow('月別記録の取得に失敗しました');
    });
  });

  describe('getRecentRecords', () => {
    it('should get recent records', async () => {
      const result = await recordService.getRecentRecords(5);

      expect(result).toEqual(mockRepository.searchResult.records);
      expect(mockRepository.lastSearchOptions).toEqual({
        limit: 5,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.getRecentRecords()).rejects.toThrow('最近の記録取得に失敗しました');
    });
  });

  describe('getHighRatedRecords', () => {
    it('should get high rated records', async () => {
      const result = await recordService.getHighRatedRecords(4, 10);

      expect(result).toEqual(mockRepository.searchResult.records);
      expect(mockRepository.lastSearchOptions).toEqual({
        filters: { ratingMin: 4 },
        limit: 10,
        sortBy: 'rating',
        sortOrder: 'desc',
      });
    });

    it('should validate minRating', async () => {
      await expect(recordService.getHighRatedRecords(0)).rejects.toThrow('評価は1-5の範囲で指定してください');
      await expect(recordService.getHighRatedRecords(6)).rejects.toThrow('評価は1-5の範囲で指定してください');
    });

    it('should handle repository errors', async () => {
      mockRepository.shouldThrowError = true;
      mockRepository.errorToThrow = { status: 500 };

      await expect(recordService.getHighRatedRecords()).rejects.toThrow('高評価記録の取得に失敗しました');
    });
  });
});
