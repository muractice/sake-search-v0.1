/**
 * RecommendationServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { RecommendationService, RecommendationServiceError } from '../RecommendationService';
import { ApiClient, ApiClientError } from '../core/ApiClient';
import type { SakeData } from '@/types/sake';

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
      return { data: mockResponse } as { data: T };
    }

    throw new Error(`No mock response for ${endpoint}`);
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
    score: 0.9 - index * 0.1,
    type: 'similar',
    reason: 'あなたの好みに近い味わい',
    similarityScore: 0.8 - index * 0.1,
    predictedRating: 4.5 - index * 0.2,
  }));

  const validOptions = {
    type: 'similarity' as const,
    menuItems: ['獺祭', '久保田'],
    count: 5,
  };

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    recommendationService = new RecommendationService(mockApiClient);
  });

  describe('getRestaurantRecommendations', () => {
    it('should get restaurant recommendations successfully', async () => {
      const mockResponse = {
        recommendations: mockRecommendations,
        notFound: [],
        totalFound: mockRecommendations.length,
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
          count: 5,
        })
      ).rejects.toThrow('メニューアイテムが指定されていません');
    });

    it('should validate invalid recommendation type', async () => {
      await expect(
        recommendationService.getRestaurantRecommendations({
          type: 'invalid' as never,
          menuItems: ['test'],
          count: 5,
        })
      ).rejects.toThrow('無効なレコメンドタイプです');
    });

    it.skip('should validate count range', () => {
      const service = recommendationService as { validateRestaurantOptions: (options: unknown) => void };

      expect(() => {
        service.validateRestaurantOptions({
          type: 'similarity',
          menuItems: ['test'],
          count: 0,
        });
      }).toThrow('取得件数は1〜50の範囲で指定してください');

      expect(() => {
        service.validateRestaurantOptions({
          type: 'similarity',
          menuItems: ['test'],
          count: 51,
        });
      }).toThrow('取得件数は1〜50の範囲で指定してください');
    });

    it('should handle requires more favorites response', async () => {
      const mockResponse = {
        recommendations: [],
        requiresMoreFavorites: true,
        favoritesCount: 1,
        message: 'お気に入りを3件以上登録してください',
      };
      mockApiClient.setMockResponse('/api/recommendations/restaurant', mockResponse);

      const result = await recommendationService.getRestaurantRecommendations(validOptions);

      expect(result.requiresMoreFavorites).toBe(true);
      expect(result.message).toEqual('お気に入りを3件以上登録してください');
    });
  });

  describe('error handling', () => {
    it('should map API status codes to service errors', async () => {
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
          recommendationService.getRestaurantRecommendations(validOptions)
        ).rejects.toThrow(expectedMessage);

        mockApiClient.clearError();
      }
    });

    it('should pass through RecommendationServiceError', async () => {
      const customError = new RecommendationServiceError('Custom error');
      mockApiClient.setError(customError);

      await expect(
        recommendationService.getRestaurantRecommendations(validOptions)
      ).rejects.toThrow('Custom error');
    });

    it('should handle generic errors with default message', async () => {
      mockApiClient.setError(new Error('Generic error'));

      await expect(
        recommendationService.getRestaurantRecommendations(validOptions)
      ).rejects.toThrow('飲食店レコメンドの取得に失敗しました');
    });
  });
});
