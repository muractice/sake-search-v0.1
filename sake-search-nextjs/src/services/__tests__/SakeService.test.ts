/**
 * SakeServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { SakeService, SakeSearchError } from '../SakeService';
import { ApiClient, ApiClientError } from '../core/ApiClient';
import { SakeData } from '@/types/sake';

// ApiClientのモック
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

  async get<T>(endpoint: string, query?: Record<string, string>): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    // クエリパラメータを含むキーでも検索
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
}

describe('SakeService', () => {
  let mockApiClient: MockApiClient;
  let sakeService: SakeService;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    sakeService = new SakeService(mockApiClient);
  });

  describe('searchSakes', () => {
    const mockSearchResult = {
      sakes: [
        {
          id: '1',
          name: '獺祭 純米大吟醸',
          brewery: '旭酒造',
          prefecture: '山口県',
          sweetness: 3,
          richness: 2,
        } as SakeData,
      ],
      total: 1,
      query: '獺祭',
      hasMore: false,
      timestamp: '2024-01-01T00:00:00Z',
    };

    it('should search sakes successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/sakes/search', mockSearchResult);

      const result = await sakeService.searchSakes({ query: '獺祭' });

      expect(result).toEqual(mockSearchResult);
    });

    it('should validate search query', async () => {
      await expect(
        sakeService.searchSakes({ query: '' })
      ).rejects.toThrow(SakeSearchError);

      await expect(
        sakeService.searchSakes({ query: '   ' })
      ).rejects.toThrow('検索クエリが空です');
    });

    it('should reject queries that are too long', async () => {
      const longQuery = 'a'.repeat(101);

      await expect(
        sakeService.searchSakes({ query: longQuery })
      ).rejects.toThrow('検索クエリが長すぎます');
    });

    it('should reject dangerous patterns', async () => {
      const dangerousQueries = [
        'test; DROP TABLE sakes;',
        'test -- comment',
        'test /* comment */',
        'xp_cmdshell',
        'sp_executesql',
      ];

      for (const query of dangerousQueries) {
        await expect(
          sakeService.searchSakes({ query })
        ).rejects.toThrow('無効な文字が含まれています');
      }
    });

    it('should handle API client errors', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      await expect(
        sakeService.searchSakes({ query: '獺祭' })
      ).rejects.toThrow('サーバーエラーが発生しました');
    });

    it('should handle rate limiting errors', async () => {
      mockApiClient.setError(new ApiClientError('Too Many Requests', 429));

      await expect(
        sakeService.searchSakes({ query: '獺祭' })
      ).rejects.toThrow('検索リクエストが多すぎます');
    });
  });

  describe('search (legacy method)', () => {
    it('should return first sake from search results', async () => {
      const mockSearchResult = {
        sakes: [
          { id: '1', name: '獺祭' } as SakeData,
          { id: '2', name: '久保田' } as SakeData,
        ],
        total: 2,
        query: '獺祭',
        hasMore: false,
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/sakes/search', mockSearchResult);

      const result = await sakeService.search('獺祭');

      expect(result).toEqual(mockSearchResult.sakes[0]);
    });

    it('should return null when no results', async () => {
      const mockSearchResult = {
        sakes: [],
        total: 0,
        query: 'nonexistent',
        hasMore: false,
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/sakes/search', mockSearchResult);

      const result = await sakeService.search('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSakeById', () => {
    it('should get sake by ID successfully', async () => {
      const mockSake = { id: '1', name: '獺祭' } as SakeData;
      mockApiClient.setMockResponse('/api/v1/sakes/1', mockSake);

      const result = await sakeService.getSakeById('1');

      expect(result).toEqual(mockSake);
    });

    it('should return null for non-existent sake', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      const result = await sakeService.getSakeById('999');

      expect(result).toBeNull();
    });

    it('should throw error for empty ID', async () => {
      await expect(
        sakeService.getSakeById('')
      ).rejects.toThrow('日本酒IDが指定されていません');
    });
  });

  describe('getTrendingSakes', () => {
    it('should get trending sakes successfully', async () => {
      const mockTrendingSakes = [
        { id: '1', name: '獺祭' } as SakeData,
        { id: '2', name: '久保田' } as SakeData,
      ];

      mockApiClient.setMockResponse('/api/v1/sakes/trending', mockTrendingSakes);

      const result = await sakeService.getTrendingSakes(10);

      expect(result).toEqual(mockTrendingSakes);
    });
  });

  describe('getSuggestions', () => {
    it('should get suggestions successfully', async () => {
      const mockSuggestions = ['獺祭', '獺祭 純米大吟醸'];
      // 単純にエンドポイントだけでモックを設定（クエリは無視）
      mockApiClient.setMockResponse('/api/v1/sakes/suggestions', mockSuggestions);

      const result = await sakeService.getSuggestions('獺祭');

      expect(result).toEqual(mockSuggestions);
    });

    it('should return empty array for short queries', async () => {
      const result = await sakeService.getSuggestions('a');

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      const result = await sakeService.getSuggestions('獺');

      expect(result).toEqual([]);
    });
  });
});