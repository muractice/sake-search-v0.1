/**
 * RestaurantServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { RestaurantService, RestaurantServiceError } from '../RestaurantService';
import { ApiClient, ApiClientError } from '../core/ApiClient';
import { 
  RestaurantMenu, 
  RestaurantMenuFormData,
  RestaurantMenuSakeFormData,
  RestaurantDrinkingRecordFormData,
  RestaurantMenuWithSakes,
  RestaurantDrinkingRecordDetail
} from '@/types/restaurant';
import { SakeData } from '@/types/sake';

// ApiClientのモック（RecordService.test.tsから流用・拡張）
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

describe('RestaurantService', () => {
  let mockApiClient: MockApiClient;
  let restaurantService: RestaurantService;

  const mockRestaurant: RestaurantMenu = {
    id: 'restaurant-1',
    user_id: 'user-1',
    restaurant_name: '鮨 銀座',
    location: '東京都中央区銀座',
    notes: '高級鮨店',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockRestaurantWithSakes: RestaurantMenuWithSakes[] = [
    {
      restaurant_menu_id: 'restaurant-1',
      user_id: 'user-1',
      restaurant_name: '鮨 銀座',
      location: '東京都中央区銀座',
      restaurant_notes: '高級鮨店',
      restaurant_created_at: '2024-01-15T10:00:00Z',
      menu_sake_id: 'menu-sake-1',
      sake_id: 'sake-1',
      brand_id: 1,
      is_available: true,
      menu_notes: '店長おすすめ',
      sake_added_at: '2024-01-15T11:00:00Z',
      sake_name: '獺祭 純米大吟醸',
      sake_brewery: '旭酒造',
      sweetness: 3,
      richness: 4,
    },
  ];

  const mockRecord: RestaurantDrinkingRecordDetail = {
    record_id: 'record-1',
    user_id: 'user-1',
    date: '2024-01-15',
    rating: 5,
    memo: '美味しかった',
    price_paid: 2000,
    glass_ml: 120,
    record_created_at: '2024-01-15T12:00:00Z',
    restaurant_name: '鮨 銀座',
    location: '東京都中央区銀座',
    sake_id: 'sake-1',
    brand_id: 1,
    is_available: true,
    menu_notes: '店長おすすめ',
    sake_name: '獺祭 純米大吟醸',
    sake_brewery: '旭酒造',
    sweetness: 3,
    richness: 4,
  };

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    restaurantService = new RestaurantService(mockApiClient);
  });

  describe('getRestaurants', () => {
    it('should get restaurants successfully', async () => {
      const mockResult = {
        restaurants: [mockRestaurant],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/search', mockResult);

      const result = await restaurantService.getRestaurants();

      expect(result).toEqual(mockResult);
    });

    it('should handle API errors', async () => {
      mockApiClient.setError(new ApiClientError('Server Error', 500));

      await expect(restaurantService.getRestaurants()).rejects.toThrow('サーバーエラーが発生しました');
    });
  });

  describe('createRestaurant', () => {
    const validInput: RestaurantMenuFormData = {
      restaurant_name: '鮨 銀座',
      location: '東京都中央区銀座',
      notes: '高級鮨店',
    };

    it('should create restaurant successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/restaurants', mockRestaurant);

      const result = await restaurantService.createRestaurant(validInput);

      expect(result).toEqual(mockRestaurant);
    });

    it('should validate required fields', async () => {
      const invalidInputs = [
        { ...validInput, restaurant_name: '' },
        { ...validInput, restaurant_name: '   ' },
        { ...validInput, restaurant_name: undefined as any },
      ];

      for (const input of invalidInputs) {
        await expect(restaurantService.createRestaurant(input)).rejects.toThrow(RestaurantServiceError);
      }
    });

    it('should validate field lengths', async () => {
      const invalidInputs = [
        { ...validInput, restaurant_name: 'a'.repeat(101) },
        { ...validInput, location: 'a'.repeat(201) },
        { ...validInput, notes: 'a'.repeat(1001) },
      ];

      for (const input of invalidInputs) {
        await expect(restaurantService.createRestaurant(input)).rejects.toThrow(RestaurantServiceError);
      }
    });
  });

  describe('updateRestaurant', () => {
    const validUpdate = {
      restaurant_name: '鮨 銀座 新店',
      location: '東京都中央区銀座8-1-1',
    };

    it('should update restaurant successfully', async () => {
      const updatedRestaurant = { ...mockRestaurant, ...validUpdate };
      mockApiClient.setMockResponse('/api/v1/restaurants/restaurant-1', updatedRestaurant);

      const result = await restaurantService.updateRestaurant('restaurant-1', validUpdate);

      expect(result).toEqual(updatedRestaurant);
    });

    it('should validate restaurant ID', async () => {
      await expect(
        restaurantService.updateRestaurant('', validUpdate)
      ).rejects.toThrow('飲食店IDが指定されていません');
    });

    it('should validate updated fields', async () => {
      const invalidUpdate = { restaurant_name: 'a'.repeat(101) };

      await expect(
        restaurantService.updateRestaurant('restaurant-1', invalidUpdate)
      ).rejects.toThrow(RestaurantServiceError);
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete restaurant successfully', async () => {
      await expect(restaurantService.deleteRestaurant('restaurant-1')).resolves.not.toThrow();
    });

    it('should validate restaurant ID', async () => {
      await expect(
        restaurantService.deleteRestaurant('')
      ).rejects.toThrow('飲食店IDが指定されていません');
    });

    it('should handle 404 errors gracefully', async () => {
      mockApiClient.setError(new ApiClientError('Not Found', 404));

      await expect(restaurantService.deleteRestaurant('restaurant-1')).resolves.not.toThrow();
    });
  });

  describe('getRestaurantWithSakes', () => {
    it('should get restaurant with sakes successfully', async () => {
      mockApiClient.setMockResponse('/api/v1/restaurants/restaurant-1/with-sakes', mockRestaurantWithSakes);

      const result = await restaurantService.getRestaurantWithSakes('restaurant-1');

      expect(result).toEqual(mockRestaurantWithSakes);
    });

    it('should validate restaurant ID', async () => {
      await expect(
        restaurantService.getRestaurantWithSakes('')
      ).rejects.toThrow('飲食店IDが指定されていません');
    });
  });

  describe('addSakeToMenu', () => {
    const validInput: RestaurantMenuSakeFormData = {
      sake_id: 'sake-1',
      brand_id: 1,
      is_available: true,
      menu_notes: '店長おすすめ',
    };

    it('should add sake to menu successfully', async () => {
      const mockMenuSake = {
        id: 'menu-sake-1',
        restaurant_menu_id: 'restaurant-1',
        ...validInput,
        created_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/restaurant-1/sakes', mockMenuSake);

      const result = await restaurantService.addSakeToMenu('restaurant-1', validInput);

      expect(result).toEqual(mockMenuSake);
    });

    it('should validate required fields', async () => {
      const invalidInputs = [
        { ...validInput, sake_id: '' },
        { ...validInput, sake_id: undefined as any },
        { ...validInput, is_available: undefined as any },
      ];

      for (const input of invalidInputs) {
        await expect(
          restaurantService.addSakeToMenu('restaurant-1', input)
        ).rejects.toThrow(RestaurantServiceError);
      }
    });

    it('should validate menu notes length', async () => {
      const invalidInput = { ...validInput, menu_notes: 'a'.repeat(501) };

      await expect(
        restaurantService.addSakeToMenu('restaurant-1', invalidInput)
      ).rejects.toThrow('メニューメモは500文字以内で入力してください');
    });
  });

  describe('createRecord', () => {
    const validInput: RestaurantDrinkingRecordFormData = {
      restaurant_menu_id: 'restaurant-1',
      restaurant_menu_sake_id: 'menu-sake-1',
      sake_id: 'sake-1',
      brand_id: 1,
      date: '2024-01-15',
      rating: 5,
      memo: '美味しかった',
      price_paid: 2000,
      glass_ml: 120,
    };

    it('should create record successfully', async () => {
      const mockNewRecord = {
        id: 'record-1',
        user_id: 'user-1',
        ...validInput,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/records', mockNewRecord);

      const result = await restaurantService.createRecord(validInput);

      expect(result).toEqual(mockNewRecord);
    });

    it('should validate required fields', async () => {
      const invalidInputs = [
        { ...validInput, restaurant_menu_id: '' },
        { ...validInput, restaurant_menu_sake_id: '' },
        { ...validInput, sake_id: '' },
        { ...validInput, rating: 0 },
        { ...validInput, rating: 6 },
      ];

      for (const input of invalidInputs) {
        await expect(restaurantService.createRecord(input)).rejects.toThrow(RestaurantServiceError);
      }
    });

    it('should validate date format', async () => {
      const invalidDates = [
        'invalid-date',
        '2024/01/15',
        '15-01-2024',
      ];

      for (const date of invalidDates) {
        await expect(
          restaurantService.createRecord({ ...validInput, date })
        ).rejects.toThrow('日付の形式が正しくありません');
      }
    });

    it('should validate numeric ranges', async () => {
      const invalidInputs = [
        { ...validInput, price_paid: -1 },
        { ...validInput, price_paid: 100001 },
        { ...validInput, glass_ml: -1 },
        { ...validInput, glass_ml: 1001 },
      ];

      for (const input of invalidInputs) {
        await expect(restaurantService.createRecord(input)).rejects.toThrow(RestaurantServiceError);
      }
    });

    it('should set default date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const inputWithoutDate = { ...validInput };
      delete inputWithoutDate.date;

      const mockNewRecord = {
        id: 'record-1',
        user_id: 'user-1',
        ...inputWithoutDate,
        date: today,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/records', mockNewRecord);

      const result = await restaurantService.createRecord(inputWithoutDate);

      expect(result.date).toBe(today);
    });
  });

  describe('getRecords', () => {
    it('should get records successfully', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T12:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/records/search', mockResult);

      const result = await restaurantService.getRecords();

      expect(result).toEqual(mockResult);
    });
  });

  describe('getStatistics', () => {
    it('should get statistics successfully', async () => {
      const mockStats = {
        totalRestaurants: 5,
        totalRecords: 20,
        uniqueSakes: 15,
        averageRating: 4.3,
        mostVisitedRestaurant: '鮨 銀座',
        recentActivity: {
          thisWeek: 3,
          thisMonth: 8,
        },
        priceRange: {
          min: 800,
          max: 5000,
          average: 2500,
        },
        ratingDistribution: [
          { rating: 5, count: 8 },
          { rating: 4, count: 7 },
          { rating: 3, count: 3 },
          { rating: 2, count: 2 },
          { rating: 1, count: 0 },
        ],
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/statistics', mockStats);

      const result = await restaurantService.getStatistics();

      expect(result).toEqual(mockStats);
    });
  });

  describe('getRecommendations', () => {
    it('should get recommendations successfully', async () => {
      const mockRecommendations = [
        {
          sake: {
            id: 'sake-rec-1',
            name: '久保田 萬寿',
            brewery: '朝日酒造',
            brandId: 2,
            breweryId: 2,
            sweetness: 2,
            richness: 3,
            description: '上品な味わい',
          } as SakeData,
          score: 0.95,
          type: 'similarity',
          reason: '過去の高評価銘柄との類似性',
          similarityScore: 0.95,
          predictedRating: 4.8,
        },
      ];

      mockApiClient.setMockResponse('/api/v1/restaurants/recommendations', mockRecommendations);

      const result = await restaurantService.getRecommendations({ type: 'similarity' });

      expect(result).toEqual(mockRecommendations);
    });

    it('should validate recommendation options', async () => {
      const invalidOptions = [
        { type: 'invalid' as any },
        { type: 'similarity', limit: 0 },
        { type: 'similarity', limit: 101 },
      ];

      for (const options of invalidOptions) {
        await expect(restaurantService.getRecommendations(options)).rejects.toThrow(RestaurantServiceError);
      }
    });
  });

  describe('getRecentRecords', () => {
    it('should get recent records successfully', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T12:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/records/search', mockResult);

      const result = await restaurantService.getRecentRecords(5);

      expect(result).toEqual([mockRecord]);
    });
  });

  describe('getHighRatedRecords', () => {
    it('should get high rated records successfully', async () => {
      const mockResult = {
        records: [mockRecord],
        total: 1,
        hasMore: false,
        timestamp: '2024-01-15T12:00:00Z',
      };

      mockApiClient.setMockResponse('/api/v1/restaurants/records/search', mockResult);

      const result = await restaurantService.getHighRatedRecords(4);

      expect(result).toEqual([mockRecord]);
    });

    it('should validate rating range', async () => {
      await expect(
        restaurantService.getHighRatedRecords(0)
      ).rejects.toThrow('評価は1-5の範囲で指定してください');

      await expect(
        restaurantService.getHighRatedRecords(6)
      ).rejects.toThrow('評価は1-5の範囲で指定してください');
    });
  });

  describe('error handling', () => {
    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 400, expectedMessage: '入力データが無効です' },
        { status: 401, expectedMessage: 'ログインが必要です' },
        { status: 403, expectedMessage: 'この操作の権限がありません' },
        { status: 404, expectedMessage: '指定された飲食店が見つかりません' },
        { status: 429, expectedMessage: 'リクエストが多すぎます' },
        { status: 500, expectedMessage: 'サーバーエラーが発生しました' },
      ];

      for (const { status, expectedMessage } of testCases) {
        mockApiClient.setError(new ApiClientError('Test Error', status));

        await expect(restaurantService.getRestaurants()).rejects.toThrow(expectedMessage);

        mockApiClient.clearError();
      }
    });
  });
});