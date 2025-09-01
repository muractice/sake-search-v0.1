/**
 * ComparisonServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { ComparisonService, ComparisonServiceError } from '../ComparisonService';
import { ApiClient, ApiClientError } from '../core/ApiClient';
import { SakeData } from '@/types/sake';

// ApiClientのモック
class MockApiClient extends ApiClient {
  private mockResponses: Map<string, any> = new Map();
  private shouldThrowError = false;
  private errorToThrow: any = null;

  setMockResponse(endpoint: string, response: any) {
    this.mockResponses.set(endpoint, response);
  }

  setError(error: any) {
    this.shouldThrowError = true;
    this.errorToThrow = error;
  }

  clearError() {
    this.shouldThrowError = false;
    this.errorToThrow = null;
  }

  async post<T>(endpoint: string, body?: any): Promise<{ data: T }> {
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

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    return { data: {} as T };
  }
}

describe('ComparisonService', () => {
  let mockApiClient: MockApiClient;
  let comparisonService: ComparisonService;

  const mockSakes: SakeData[] = [
    {
      id: 'sake-1',
      name: '獺祭 純米大吟醸',
      brewery: '旭酒造',
      brandId: 1,
      breweryId: 1,
      sweetness: 3,
      richness: 4,
      description: '山口県の代表的な日本酒',
    },
    {
      id: 'sake-2',
      name: '久保田 萬寿',
      brewery: '朝日酒造',
      brandId: 2,
      breweryId: 2,
      sweetness: 2,
      richness: 3,
      description: '新潟県の代表的な日本酒',
    },
  ];

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    sakes: mockSakes,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockAnalysis = {
    sakes: mockSakes,
    averageSweetness: 2.5,
    averageRichness: 3.5,
    priceRange: {
      min: 3000,
      max: 5000,
      average: 4000,
    },
    commonCharacteristics: ['純米大吟醸', '高級'],
    differences: [
      { aspect: '甘さ', description: '獺祭の方が甘口' },
      { aspect: '産地', description: '山口県と新潟県' },
    ],
    recommendations: [],
  };

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    comparisonService = new ComparisonService(mockApiClient);
  });

  describe('saveComparisonSession', () => {
    it('should save comparison session successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/comparison/session', mockSession);

      const result = await comparisonService.saveComparisonSession(mockSakes);

      expect(result).toEqual(mockSession);
    });

    it('should validate empty list', async () => {
      await expect(
        comparisonService.saveComparisonSession([])
      ).rejects.toThrow('比較リストが空です');
    });

    it('should validate maximum items', async () => {
      const tooManySakes = Array.from({ length: 11 }, (_, i) => ({
        ...mockSakes[0],
        id: `sake-${i}`,
      }));

      await expect(
        comparisonService.saveComparisonSession(tooManySakes)
      ).rejects.toThrow('比較は最大10個までです');
    });

    it('should validate duplicates', async () => {
      const duplicateSakes = [mockSakes[0], mockSakes[0]];

      await expect(
        comparisonService.saveComparisonSession(duplicateSakes)
      ).rejects.toThrow('比較リストに重複があります');
    });
  });

  describe('getComparisonSession', () => {
    it('should get session successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/comparison/session/session-1', mockSession);

      const result = await comparisonService.getComparisonSession('session-1');

      expect(result).toEqual(mockSession);
    });

    it('should validate session ID', async () => {
      await expect(
        comparisonService.getComparisonSession('')
      ).rejects.toThrow('セッションIDが指定されていません');
    });
  });

  describe('getCurrentUserSession', () => {
    it('should get current session successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/comparison/current', mockSession);

      const result = await comparisonService.getCurrentUserSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null for 404', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      const result = await comparisonService.getCurrentUserSession();

      expect(result).toBeNull();
    });
  });

  describe('analyzeComparison', () => {
    it('should analyze comparison successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/comparison/analyze', mockAnalysis);

      const result = await comparisonService.analyzeComparison(mockSakes);

      expect(result).toEqual(mockAnalysis);
    });

    it('should validate minimum items', async () => {
      await expect(
        comparisonService.analyzeComparison([mockSakes[0]])
      ).rejects.toThrow('比較には最低2個の日本酒が必要です');
    });
  });

  describe('createShareableLink', () => {
    it('should create shareable link successfully', async () => {
      const mockUrl = 'https://example.com/share/abc123';
      mockApiClient.setMockResponse('/api/v1/comparison/share', { url: mockUrl });

      const result = await comparisonService.createShareableLink(mockSakes);

      expect(result).toBe(mockUrl);
    });

    it('should validate empty list', async () => {
      await expect(
        comparisonService.createShareableLink([])
      ).rejects.toThrow('比較リストが空です');
    });

    it('should accept custom options', async () => {
      const mockUrl = 'https://example.com/share/custom';
      mockApiClient.setMockResponse('/api/v1/comparison/share', { url: mockUrl });

      const result = await comparisonService.createShareableLink(mockSakes, {
        expiresIn: 3600,
        allowAnonymous: false,
      });

      expect(result).toBe(mockUrl);
    });
  });

  describe('getSharedComparison', () => {
    it('should get shared comparison successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/comparison/shared/share-1', mockSession);

      const result = await comparisonService.getSharedComparison('share-1');

      expect(result).toEqual(mockSession);
    });

    it('should validate share ID', async () => {
      await expect(
        comparisonService.getSharedComparison('')
      ).rejects.toThrow('共有IDが指定されていません');
    });
  });

  describe('getComparisonRecommendations', () => {
    it('should get recommendations successfully', async () => {
      const mockRecommendations = [mockSakes[0]];
      mockApiClient.setMockResponse('/api/v1/comparison/recommendations', mockRecommendations);

      const result = await comparisonService.getComparisonRecommendations(mockSakes);

      expect(result).toEqual(mockRecommendations);
    });

    it('should return empty array for empty list', async () => {
      const result = await comparisonService.getComparisonRecommendations([]);

      expect(result).toEqual([]);
    });
  });

  describe('getComparisonHistory', () => {
    it('should get history successfully', async () => {
      const mockHistory = [mockSession];
      mockApiClient.setMockResponse('/api/v1/comparison/history?limit=10', mockHistory);

      const result = await comparisonService.getComparisonHistory();

      expect(result).toEqual(mockHistory);
    });
  });

  describe('deleteComparisonSession', () => {
    it('should delete session successfully', async () => {
      await expect(
        comparisonService.deleteComparisonSession('session-1')
      ).resolves.not.toThrow();
    });

    it('should validate session ID', async () => {
      await expect(
        comparisonService.deleteComparisonSession('')
      ).rejects.toThrow('セッションIDが指定されていません');
    });

    it('should handle 404 gracefully', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      await expect(
        comparisonService.deleteComparisonSession('session-1')
      ).resolves.not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should get max comparison items', () => {
      expect(comparisonService.getMaxComparisonItems()).toBe(10);
    });

    it('should get min comparison items', () => {
      expect(comparisonService.getMinComparisonItems()).toBe(2);
    });

    it('should check if can add to comparison', () => {
      expect(comparisonService.canAddToComparison(0)).toBe(true);
      expect(comparisonService.canAddToComparison(9)).toBe(true);
      expect(comparisonService.canAddToComparison(10)).toBe(false);
      expect(comparisonService.canAddToComparison(11)).toBe(false);
    });

    it('should check if can analyze', () => {
      expect(comparisonService.canAnalyze(0)).toBe(false);
      expect(comparisonService.canAnalyze(1)).toBe(false);
      expect(comparisonService.canAnalyze(2)).toBe(true);
      expect(comparisonService.canAnalyze(10)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 400, expectedMessage: '入力データが無効です' },
        { status: 401, expectedMessage: 'ログインが必要です' },
        { status: 403, expectedMessage: 'この操作の権限がありません' },
        { status: 404, expectedMessage: 'データが見つかりません' },
        { status: 429, expectedMessage: 'リクエストが多すぎます' },
        { status: 500, expectedMessage: 'サーバーエラーが発生しました' },
      ];

      for (const { status, expectedMessage } of testCases) {
        mockApiClient.setError(new ApiClientError('Test Error', status));

        await expect(
          comparisonService.getComparisonSession('test')
        ).rejects.toThrow(expectedMessage);

        mockApiClient.clearError();
      }
    });
  });
});