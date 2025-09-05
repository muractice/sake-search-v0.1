/**
 * RecordServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { RecordService, RecordServiceError } from '../RecordService';
import { ApiClient, ApiClientError } from '../core/ApiClient';
import { DrinkingRecord, CreateRecordInput, UpdateRecordInput } from '@/types/record';

// ApiClientのモック（SakeService.test.tsから流用）
class MockApiClient extends ApiClient {
  private mockResponses: Map<string, unknown> = new Map();
  private shouldThrowError = false;
  private errorToThrow: unknown = null;

  setMockResponse(endpoint: string, response: unknown) {
    this.mockResponses.set(endpoint, response);
  }

  setError(error: unknown) {
    this.shouldThrowError = true;
    this.errorToThrow = error;
  }

  clearError() {
    this.shouldThrowError = false;
    this.errorToThrow = null;
  }

  async post<T>(endpoint: string): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    const mockResponse = this.mockResponses.get(endpoint);
    if (mockResponse) {
      return { data: mockResponse };
    }

    throw new Error(`No mock response for ${endpoint}`);
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    let searchKey = endpoint;
    if (query) {
      const params = new URLSearchParams(query);
      searchKey = `${endpoint}?${params.toString()}`;
    }

    const mockResponse = this.mockResponses.get(endpoint) || this.mockResponses.get(searchKey);
    if (mockResponse) {
      return { data: mockResponse };
    }

    throw new Error(`No mock response for ${endpoint}`);
  }

  async put<T>(endpoint: string): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    const mockResponse = this.mockResponses.get(endpoint);
    if (mockResponse) {
      return { data: mockResponse };
    }

    throw new Error(`No mock response for ${endpoint}`);
  }

  async delete<T>(): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    // 削除は成功レスポンスを返す
    return { data: {} as T };
  }
}

describe('RecordService', () => {
  let mockApiClient: MockApiClient;
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
    mockApiClient = new MockApiClient();
    recordService = new RecordService(mockApiClient);
  });

  describe('getRecords', () => {
    it('should get records successfully', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/records/search', mockResult);

      const result = await recordService.getRecords();

      expect(result).toEqual(mockResult);
    });

    it('should handle API errors', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      await expect(recordService.getRecords()).rejects.toThrow('サーバーエラーが発生しました');
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
      mockApiClient.setMockResponse('/api/v1/records', mockRecord);

      const result = await recordService.createRecord(validInput);

      expect(result).toEqual(mockRecord);
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
        '2024-13-01', // 無効な月
        '2024-01-32', // 無効な日
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
      const expectedRecord = { ...mockRecord, date: today };
      
      mockApiClient.setMockResponse('/api/v1/records', expectedRecord);

      const result = await recordService.createRecord(validInput);

      expect(result.date).toBe(today);
    });
  });

  describe('updateRecord', () => {
    const validUpdate: UpdateRecordInput = {
      rating: 4,
      memo: '更新されたメモ',
    };

    it('should update record successfully', async () => {
      const updatedRecord = { ...mockRecord, ...validUpdate };
      mockApiClient.setMockResponse('/api/v1/records/1', updatedRecord);

      const result = await recordService.updateRecord('1', validUpdate);

      expect(result).toEqual(updatedRecord);
    });

    it('should validate record ID', async () => {
      await expect(
        recordService.updateRecord('', validUpdate)
      ).rejects.toThrow('記録IDが指定されていません');
    });

    it('should validate update input', async () => {
      const invalidUpdates = [
        { rating: 0 },
        { rating: 6 },
        { date: 'invalid-date' },
        { memo: 'a'.repeat(1001) },
      ];

      for (const update of invalidUpdates) {
        await expect(
          recordService.updateRecord('1', update)
        ).rejects.toThrow(RecordServiceError);
      }
    });
  });

  describe('deleteRecord', () => {
    it('should delete record successfully', async () => {
      await expect(recordService.deleteRecord('1')).resolves.not.toThrow();
    });

    it('should validate record ID', async () => {
      await expect(
        recordService.deleteRecord('')
      ).rejects.toThrow('記録IDが指定されていません');
    });

    it('should handle 404 errors gracefully', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      // 404の場合は成功として扱う
      await expect(recordService.deleteRecord('1')).resolves.not.toThrow();
    });

    it('should handle other errors', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      await expect(recordService.deleteRecord('1')).rejects.toThrow('サーバーエラーが発生しました');
    });
  });

  describe('getRecordsForSake', () => {
    it('should get records for specific sake', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/records/search', mockResult);

      const result = await recordService.getRecordsForSake('sake-1');

      expect(result).toEqual([mockRecord]);
    });

    it('should validate sake ID', async () => {
      await expect(
        recordService.getRecordsForSake('')
      ).rejects.toThrow('日本酒IDが指定されていません');
    });
  });

  describe('hasRecordForSake', () => {
    it('should return true when records exist', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/records/search', mockResult);

      const result = await recordService.hasRecordForSake('sake-1');

      expect(result).toBe(true);
    });

    it('should return false when no records exist', async () => {
      const mockResult = {
        records: [],
        total: 0,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/records/search', mockResult);

      const result = await recordService.hasRecordForSake('sake-1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      const result = await recordService.hasRecordForSake('sake-1');

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should get statistics successfully', async () => {
      const mockStats = {
        totalRecords: 10,
        uniqueSakes: 8,
        averageRating: 4.2,
        mostRatedPrefecture: '山口県',
        recentActivity: {
          thisWeek: 2,
          thisMonth: 5,
        },
        ratingDistribution: [
          { rating: 5, count: 3 },
          { rating: 4, count: 4 },
          { rating: 3, count: 2 },
          { rating: 2, count: 1 },
          { rating: 1, count: 0 },
        ],
      };

      mockApiClient.setMockResponse('/api/v1/records/statistics', mockStats);

      const result = await recordService.getStatistics();

      expect(result).toEqual(mockStats);
    });
  });

  describe('getMonthlyRecords', () => {
    it('should get monthly records successfully', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/records/search', mockResult);

      const result = await recordService.getMonthlyRecords(2024, 1);

      expect(result).toEqual([mockRecord]);
    });

    it('should validate year and month', async () => {
      const invalidInputs = [
        { year: 1999, month: 1 },
        { year: 3001, month: 1 },
        { year: 2024, month: 0 },
        { year: 2024, month: 13 },
      ];

      for (const { year, month } of invalidInputs) {
        await expect(
          recordService.getMonthlyRecords(year, month)
        ).rejects.toThrow(RecordServiceError);
      }
    });
  });

  describe('getHighRatedRecords', () => {
    it('should get high rated records successfully', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/records/search', mockResult);

      const result = await recordService.getHighRatedRecords(4);

      expect(result).toEqual([mockRecord]);
    });

    it('should validate rating range', async () => {
      await expect(
        recordService.getHighRatedRecords(0)
      ).rejects.toThrow('評価は1-5の範囲で指定してください');

      await expect(
        recordService.getHighRatedRecords(6)
      ).rejects.toThrow('評価は1-5の範囲で指定してください');
    });
  });
});