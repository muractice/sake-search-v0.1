/**
 * RecommendationServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { RecommendationService, RecommendationServiceError } from '../RecommendationService';
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

  async delete<T>(): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    return { data: {} as T };
  }
}

describe('RecommendationService', () => {
  let mockApiClient: MockApiClient;
  let recommendationService: RecommendationService;

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

  const mockRecommendations = mockSakes.map((sake, index) => ({
    sake,
    score: 0.9 - (index * 0.1),
    type: 'similar',
    reason: 'あなたの好みに近い味わい',
    similarityScore: 0.8 - (index * 0.1),
    predictedRating: 4.5 - (index * 0.2)
  }));

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    recommendationService = new RecommendationService(mockApiClient);
  });

  describe('getRestaurantRecommendations', () => {
    const validOptions = {
      type: 'similarity' as const,
      menuItems: ['獺祭', '久保田'],
      count: 5
    };

    it('should get restaurant recommendations successfully', async () => {
      const mockResponse = {
        recommendations: mockRecommendations,
        notFound: [],
        totalFound: 2
      };
      mockApiClient.setMockResponse('/api/recommendations/restaurant', mockResponse);

      const result = await recommendationService.getRestaurantRecommendations(validOptions);

      expect(result).toEqual(mockResponse);
    });

    it('should validate empty menu items', async () => {
      await expect(
        recommendationService.getRestaurantRecommendations({
          type: 'similarity',
          menuItems: [],
          count: 5
        })
      ).rejects.toThrow('メニューアイテムが指定されていません');
    });

    it('should validate invalid recommendation type', async () => {
      await expect(
        recommendationService.getRestaurantRecommendations({
          type: 'invalid' as never,
          menuItems: ['test'],
          count: 5
        })
      ).rejects.toThrow('無効なレコメンドタイプです');
    });

    it.skip('should validate count range', () => {
      // バリデーションエラーはvalidateRestaurantOptions内で直接発生する
      const service = recommendationService as { validateRestaurantOptions: (options: unknown) => void };
      
      // count: 0 のテスト
      expect(() => {
        service.validateRestaurantOptions({
          type: 'similarity',
          menuItems: ['test'],
          count: 0
        });
      }).toThrow('取得件数は1〜50の範囲で指定してください');

      // count: 51 のテスト
      expect(() => {
        service.validateRestaurantOptions({
          type: 'similarity',
          menuItems: ['test'],
          count: 51
        });
      }).toThrow('取得件数は1〜50の範囲で指定してください');
    });

    it('should handle requires more favorites response', async () => {
      const mockResponse = {
        recommendations: [],
        requiresMoreFavorites: true,
        favoritesCount: 1,
        message: 'お気に入りを3件以上登録してください'
      };
      mockApiClient.setMockResponse('/api/recommendations/restaurant', mockResponse);

      const result = await recommendationService.getRestaurantRecommendations(validOptions);

      expect(result.requiresMoreFavorites).toBe(true);
      expect(result.message).toEqual('お気に入りを3件以上登録してください');
    });
  });

  describe('getPersonalRecommendations', () => {
    it('should get personal recommendations successfully', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations', mockResponse);

      const result = await recommendationService.getPersonalRecommendations();

      expect(result).toEqual(mockRecommendations);
    });

    it('should use default options', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations', mockResponse);

      const result = await recommendationService.getPersonalRecommendations();

      expect(result).toEqual(mockRecommendations);
    });

    it('should accept custom options', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations', mockResponse);

      const result = await recommendationService.getPersonalRecommendations({
        count: 10,
        mood: 'adventurous',
        includeSimilar: true,
        includeExplore: false
      });

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('getTrendingRecommendations', () => {
    it('should get trending recommendations successfully', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/trending?count=10&period=weekly', mockResponse);

      const result = await recommendationService.getTrendingRecommendations();

      expect(result).toEqual(mockRecommendations);
    });

    it('should accept custom options', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/trending', mockResponse);

      const result = await recommendationService.getTrendingRecommendations({
        count: 5,
        period: 'daily'
      });

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('getSimilarityRecommendations', () => {
    it('should get similarity recommendations successfully', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/similarity', mockResponse);

      const result = await recommendationService.getSimilarityRecommendations(['sake-1', 'sake-2']);

      expect(result).toEqual(mockRecommendations);
    });

    it('should validate empty sake IDs', async () => {
      await expect(
        recommendationService.getSimilarityRecommendations([])
      ).rejects.toThrow('比較する日本酒が指定されていません');

      await expect(
        recommendationService.getSimilarityRecommendations(null as unknown as string[])
      ).rejects.toThrow('比較する日本酒が指定されていません');
    });
  });

  describe('getMoodRecommendations', () => {
    it('should get mood recommendations successfully', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/mood', mockResponse);

      const result = await recommendationService.getMoodRecommendations('adventurous');

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('getPairingRecommendations', () => {
    it('should get pairing recommendations successfully', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/pairing', mockResponse);

      const result = await recommendationService.getPairingRecommendations('sashimi', mockSakes);

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('getRandomPick', () => {
    it('should get random pick successfully', async () => {
      const mockResponse = { recommendation: mockRecommendations[0] };
      mockApiClient.setMockResponse('/api/recommendations/random', mockResponse);

      const result = await recommendationService.getRandomPick(['獺祭', '久保田']);

      expect(result).toEqual(mockRecommendations[0]);
    });

    it('should work without menu items', async () => {
      const mockResponse = { recommendation: mockRecommendations[0] };
      mockApiClient.setMockResponse('/api/recommendations/random', mockResponse);

      const result = await recommendationService.getRandomPick();

      expect(result).toEqual(mockRecommendations[0]);
    });
  });

  describe('clearRecommendationCache', () => {
    it('should clear cache successfully', async () => {
      await expect(
        recommendationService.clearRecommendationCache()
      ).resolves.not.toThrow();
    });
  });

  describe('getRecommendationHistory', () => {
    it('should get recommendation history successfully', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/history?limit=20', mockResponse);

      const result = await recommendationService.getRecommendationHistory();

      expect(result).toEqual(mockRecommendations);
    });

    it('should accept custom limit', async () => {
      const mockResponse = { recommendations: mockRecommendations };
      mockApiClient.setMockResponse('/api/recommendations/history', mockResponse);

      const result = await recommendationService.getRecommendationHistory(10);

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('error handling', () => {
    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 400, expectedMessage: 'リクエストが無効です' },
        { status: 401, expectedMessage: 'ログインが必要です' },
        { status: 403, expectedMessage: 'この機能の利用権限がありません' },
        { status: 404, expectedMessage: 'レコメンドデータが見つかりません' },
        { status: 429, expectedMessage: 'リクエストが多すぎます' },
        { status: 500, expectedMessage: 'サーバーでエラーが発生しました' },
      ];

      for (const { status, expectedMessage } of testCases) {
        mockApiClient.setError(new ApiClientError('Test Error', status));

        await expect(
          recommendationService.getPersonalRecommendations()
        ).rejects.toThrow(expectedMessage);

        mockApiClient.clearError();
      }
    });

    it('should handle recommendation service errors', async () => {
      const customError = new RecommendationServiceError('Custom error');
      mockApiClient.setError(customError);

      await expect(
        recommendationService.getPersonalRecommendations()
      ).rejects.toThrow('Custom error');
    });

    it('should handle generic errors', async () => {
      mockApiClient.setError(new Error('Generic error'));

      await expect(
        recommendationService.getPersonalRecommendations()
      ).rejects.toThrow('個人レコメンドの取得に失敗しました');
    });
  });
});