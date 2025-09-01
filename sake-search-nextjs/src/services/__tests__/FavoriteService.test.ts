/**
 * FavoriteServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { FavoriteService, FavoriteServiceError } from '../FavoriteService';
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

  async put<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    const mockResponse = this.mockResponses.get(endpoint);
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

describe('FavoriteService', () => {
  let mockApiClient: MockApiClient;
  let favoriteService: FavoriteService;

  const mockSake: SakeData = {
    id: 'sake-1',
    name: '獺祭 純米大吟醸',
    brewery: '旭酒造',
    brandId: 1,
    breweryId: 1,
    sweetness: 3,
    richness: 4,
    description: '山口県の代表的な日本酒',
  };

  const mockFavorite = {
    id: 'favorite-1',
    userId: 'user-1',
    sakeId: 'sake-1',
    sakeData: mockSake,
    createdAt: '2024-01-15T10:00:00Z',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockSession = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    favoriteService = new FavoriteService(mockApiClient);
  });

  describe('getFavorites', () => {
    it('should get favorites successfully', async () => {
      const mockFavorites = [mockFavorite];
      mockApiClient.setMockResponse('/api/v1/favorites', mockFavorites);

      const result = await favoriteService.getFavorites();

      expect(result).toEqual(mockFavorites);
    });

    it('should handle API errors', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      await expect(favoriteService.getFavorites()).rejects.toThrow('サーバーエラーが発生しました');
    });
  });

  describe('addFavorite', () => {
    it('should add favorite successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/favorites', mockFavorite);
      mockApiClient.setMockResponse('/api/v1/recommendations/cache', {});

      const result = await favoriteService.addFavorite(mockSake);

      expect(result).toEqual(mockFavorite);
    });

    it('should validate sake data', async () => {
      await expect(favoriteService.addFavorite(null as any)).rejects.toThrow('日本酒データが無効です');
      await expect(favoriteService.addFavorite({ ...mockSake, id: '' })).rejects.toThrow('日本酒データが無効です');
    });

    it('should handle duplicate favorites', async () => {
      mockApiClient.setError(new ApiClientError('Duplicate', 409));

      await expect(favoriteService.addFavorite(mockSake)).rejects.toThrow('既に登録されています');
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/recommendations/cache', {});

      await expect(favoriteService.removeFavorite('sake-1')).resolves.not.toThrow();
    });

    it('should validate sake ID', async () => {
      await expect(favoriteService.removeFavorite('')).rejects.toThrow('日本酒IDが指定されていません');
    });

    it('should handle 404 errors gracefully', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      await expect(favoriteService.removeFavorite('sake-1')).resolves.not.toThrow();
    });
  });

  describe('isFavorite', () => {
    it('should check if sake is favorite', async () => {
      mockApiClient.setMockResponse('/api/v1/favorites/check/sake-1', { isFavorite: true });

      const result = await favoriteService.isFavorite('sake-1');

      expect(result).toBe(true);
    });

    it('should return false for invalid ID', async () => {
      const result = await favoriteService.isFavorite('');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      const result = await favoriteService.isFavorite('sake-1');

      expect(result).toBe(false);
    });
  });

  describe('syncFavorites', () => {
    it('should sync favorites successfully', async () => {
      const mockSyncedFavorites = [mockFavorite];
      mockApiClient.setMockResponse('/api/v1/favorites/sync', mockSyncedFavorites);

      const result = await favoriteService.syncFavorites(['sake-1']);

      expect(result).toEqual(mockSyncedFavorites);
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences successfully', async () => {
      const mockPreferences = {
        userId: 'user-1',
        showFavorites: true,
        updatedAt: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/preferences', mockPreferences);

      const result = await favoriteService.getUserPreferences();

      expect(result).toEqual(mockPreferences);
    });

    it('should return null for 404', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      const result = await favoriteService.getUserPreferences();

      expect(result).toBeNull();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update preferences successfully', async () => {
      const updatedPreferences = {
        userId: 'user-1',
        showFavorites: false,
        updatedAt: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/preferences', updatedPreferences);

      const result = await favoriteService.updateUserPreferences({ showFavorites: false });

      expect(result).toEqual(updatedPreferences);
    });
  });

  describe('toggleShowFavorites', () => {
    it('should toggle show favorites setting', async () => {
      const updatedPreferences = {
        userId: 'user-1',
        showFavorites: false,
        updatedAt: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/preferences', updatedPreferences);

      const result = await favoriteService.toggleShowFavorites(true);

      expect(result).toBe(false);
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/auth/signin', mockSession);

      const result = await favoriteService.signInWithEmail({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockSession);
    });

    it('should validate email format', async () => {
      await expect(
        favoriteService.signInWithEmail({ email: 'invalid', password: 'password123' })
      ).rejects.toThrow('有効なメールアドレスを入力してください');
    });

    it('should validate password length', async () => {
      await expect(
        favoriteService.signInWithEmail({ email: 'test@example.com', password: '12345' })
      ).rejects.toThrow('パスワードは6文字以上で入力してください');
    });
  });

  describe('signUpWithEmail', () => {
    it('should sign up successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/auth/signup', mockSession);

      const result = await favoriteService.signUpWithEmail({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockSession);
    });

    it('should validate credentials', async () => {
      await expect(
        favoriteService.signUpWithEmail({ email: '', password: 'password123' })
      ).rejects.toThrow('有効なメールアドレスを入力してください');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/auth/signout', {});
      
      await expect(favoriteService.signOut()).resolves.not.toThrow();
    });
  });

  describe('getSession', () => {
    it('should get session successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/auth/session', mockSession);

      const result = await favoriteService.getSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null user on error', async () => {
      mockApiClient.setError(new ApiClientError('Unauthorized', 401));

      const result = await favoriteService.getSession();

      expect(result).toEqual({ user: null });
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/auth/refresh', mockSession);

      const result = await favoriteService.refreshSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null user on error', async () => {
      mockApiClient.setError(new ApiClientError('Unauthorized', 401));

      const result = await favoriteService.refreshSession();

      expect(result).toEqual({ user: null });
    });
  });

  describe('getFavoriteStatistics', () => {
    it('should get statistics successfully', async () => {
      const mockStats = {
        totalFavorites: 10,
        mostFavoritedBrewery: '旭酒造',
        mostFavoritedPrefecture: '山口県',
        averageSweetness: 3.5,
        averageRichness: 4.2,
        flavorDistribution: [
          { type: 'sweet', count: 5 },
          { type: 'dry', count: 5 },
        ],
      };

      mockApiClient.setMockResponse('/api/v1/favorites/statistics', mockStats);

      const result = await favoriteService.getFavoriteStatistics();

      expect(result).toEqual(mockStats);
    });
  });

  describe('getFavoriteRecommendations', () => {
    it('should get recommendations successfully', async () => {
      const mockRecommendations = [mockSake];
      mockApiClient.setMockResponse('/api/v1/favorites/recommendations?limit=10', mockRecommendations);

      const result = await favoriteService.getFavoriteRecommendations(10);

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('clearRecommendationCache', () => {
    it('should clear cache without throwing on error', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      // エラーが発生してもthrowしない
      await expect(favoriteService.clearRecommendationCache()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 400, expectedMessage: '入力データが無効です' },
        { status: 401, expectedMessage: 'ログインが必要です' },
        { status: 403, expectedMessage: 'この操作の権限がありません' },
        { status: 404, expectedMessage: 'データが見つかりません' },
        { status: 409, expectedMessage: '既に登録されています' },
        { status: 429, expectedMessage: 'リクエストが多すぎます' },
        { status: 500, expectedMessage: 'サーバーエラーが発生しました' },
      ];

      for (const { status, expectedMessage } of testCases) {
        mockApiClient.setError(new ApiClientError('Test Error', status));

        await expect(favoriteService.getFavorites()).rejects.toThrow(expectedMessage);

        mockApiClient.clearError();
      }
    });
  });
});