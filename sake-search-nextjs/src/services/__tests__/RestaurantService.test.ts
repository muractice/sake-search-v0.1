/**
 * RestaurantServiceの単体テスト
 * ビジネスロジックの動作を確認
 */

import { RestaurantService, RestaurantServiceError } from '../RestaurantService';
import { ApiClient, ApiClientError } from '../core/ApiClient';
import { IRestaurantRepository } from '@/repositories/restaurants/RestaurantRepository';
import { 
  RestaurantMenu, 
  RestaurantMenuFormData,
  RestaurantMenuSakeFormData,
  RestaurantMenuSake,
  RestaurantMenuWithSakes,
  RestaurantDrinkingRecordDetail
} from '@/types/restaurant';
// import { SakeData } from '@/types/sake';

// ApiClientのモック（RecordService.test.tsから流用・拡張）
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

    return { data: {} as T };
  }
}

// Repository のモック
class MockRestaurantRepository implements IRestaurantRepository {
  listResult: RestaurantMenu[] = [];
  listError: unknown = null;

  createResult: RestaurantMenu | import('@/types/restaurant').RestaurantCreationConflictResponse | null = null;
  createError: unknown = null;

  deleteError: unknown = null;

  addSakeToMenuResult: RestaurantMenuSake | null = null;
  addSakeToMenuError: unknown = null;

  menuSakeIdsResult: string[] = [];
  menuSakeIdsError: unknown = null;

  updateMenuSakesResult: RestaurantMenuSake[] = [];
  updateMenuSakesError: unknown = null;

  addMultipleSakesResult: RestaurantMenuSake[] = [];
  addMultipleSakesError: unknown = null;

  updateMenuSakeResult: RestaurantMenuSake | null = null;
  updateMenuSakeError: unknown = null;

  removeSakeFromMenuError: unknown = null;

  withSakesResult: RestaurantMenuWithSakes[] = [];
  withSakesError: unknown = null;

  recentRecordsResult: RestaurantDrinkingRecordDetail[] = [];
  recentRecordsError: unknown = null;

  deleteRecordError: unknown = null;

  async listForCurrentUser(): Promise<RestaurantMenu[]> {
    if (this.listError) throw this.listError;
    return this.listResult;
  }
  async createForCurrentUser(_input: RestaurantMenuFormData) {
    void _input;
    if (this.createError) throw this.createError;
    return this.createResult;
  }
  async delete(_menuId: string): Promise<void> {
    void _menuId;
    if (this.deleteError) throw this.deleteError;
  }
  async addSakeToMenu(_menuId: string, _input: RestaurantMenuSakeFormData) {
    void _menuId; void _input;
    if (this.addSakeToMenuError) throw this.addSakeToMenuError;
    return this.addSakeToMenuResult;
  }
  async getMenuSakeIds(_menuId: string): Promise<string[]> {
    void _menuId;
    if (this.menuSakeIdsError) throw this.menuSakeIdsError;
    return this.menuSakeIdsResult;
  }
  async updateMenuSakes(
    _menuId: string,
    _sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[],
    _options?: { upsert?: boolean; toDelete?: string[] }
  ) {
    void _menuId; void _sakes; void _options;
    if (this.updateMenuSakesError) throw this.updateMenuSakesError;
    return this.updateMenuSakesResult;
  }
  async addMultipleSakesToMenu(
    _menuId: string,
    _sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[]
  ) {
    void _menuId; void _sakes;
    if (this.addMultipleSakesError) throw this.addMultipleSakesError;
    return this.addMultipleSakesResult;
  }
  async updateMenuSake(_menuSakeId: string, _input: Partial<RestaurantMenuSakeFormData>) {
    void _menuSakeId; void _input;
    if (this.updateMenuSakeError) throw this.updateMenuSakeError;
    return this.updateMenuSakeResult;
  }
  async removeSakeFromMenu(_menuSakeId: string): Promise<void> {
    void _menuSakeId;
    if (this.removeSakeFromMenuError) throw this.removeSakeFromMenuError;
  }
  async getRestaurantWithSakes(_menuId: string): Promise<RestaurantMenuWithSakes[]> {
    void _menuId;
    if (this.withSakesError) throw this.withSakesError;
    return this.withSakesResult;
  }
  async getRecentRecords(_limit: number): Promise<RestaurantDrinkingRecordDetail[]> {
    void _limit;
    if (this.recentRecordsError) throw this.recentRecordsError;
    return this.recentRecordsResult;
  }
  async deleteRecord(_recordId: string): Promise<void> {
    void _recordId;
    if (this.deleteRecordError) throw this.deleteRecordError;
  }
}

describe('RestaurantService', () => {
  let mockApiClient: MockApiClient;
  let mockRepo: MockRestaurantRepository;
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
    mockRepo = new MockRestaurantRepository();
    restaurantService = new RestaurantService(mockApiClient, mockRepo as IRestaurantRepository);
  });

  describe('getRestaurants', () => {
    it('should get restaurants successfully', async () => {
      mockRepo.listResult = [mockRestaurant];
      const result = await restaurantService.getRestaurants();
      expect(result).toEqual([mockRestaurant]);
    });

    it('should handle API errors', async () => {
      mockRepo.listError = new ApiClientError('Server Error', 500);
      await expect(restaurantService.getRestaurants()).rejects.toThrow('サーバーエラーが発生しました');
    });
  });

  describe('createRestaurant', () => {
    const validInput: RestaurantMenuFormData = {
      restaurant_name: '鮨 銀座',
      registration_date: '2024-01-15',
      location: '東京都中央区銀座',
      notes: '高級鮨店',
    };

    it('should create restaurant successfully', async () => {
      mockRepo.createResult = mockRestaurant;
      const result = await restaurantService.createRestaurant(validInput);
      expect(result).toEqual(mockRestaurant);
    });

    it('should validate required fields', async () => {
      const invalidInputs = [
        { ...validInput, restaurant_name: '' },
        { ...validInput, restaurant_name: '   ' },
        { ...validInput, restaurant_name: undefined as unknown as string },
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

  // updateRestaurant は削除済み

  describe('deleteRestaurant', () => {
    it('should delete restaurant successfully', async () => {
      await expect(restaurantService.deleteRestaurant('restaurant-1')).resolves.not.toThrow();
    });

    it('should validate restaurant ID', async () => {
      await expect(
        restaurantService.deleteRestaurant('')
      ).rejects.toThrow('メニューIDが指定されていません');
    });

    // 404 の握りつぶしは廃止（Repository 経由で例外へ）
  });

  describe('getRestaurantWithSakes', () => {
    it('should get restaurant with sakes successfully', async () => {
      mockRepo.withSakesResult = [mockRestaurantWithSakes];
      const result = await restaurantService.getRestaurantWithSakes('restaurant-1');
      expect(result).toEqual([mockRestaurantWithSakes]);
    });

    it('should validate restaurant ID', async () => {
      await expect(
        restaurantService.getRestaurantWithSakes('')
      ).rejects.toThrow('メニューIDが指定されていません');
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
      const mockMenuSake: RestaurantMenuSake = {
        id: 'menu-sake-1',
        restaurant_menu_id: 'restaurant-1',
        ...validInput,
        created_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };

      mockRepo.addSakeToMenuResult = mockMenuSake;
      const result = await restaurantService.addSakeToMenu('restaurant-1', validInput);
      expect(result).toEqual(mockMenuSake);
    });

    it('should validate required fields', async () => {
      const invalidInputs = [
        { ...validInput, sake_id: '' },
        { ...validInput, sake_id: undefined as unknown as string },
        { ...validInput, is_available: undefined as unknown as boolean },
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

  // createRecord は削除済み（RecordService に集約）

  // getRecords は削除済み（RecordService に集約）

  // getStatistics は削除済み（RecordService に集約）

  // getRecommendations は削除済み（RecommendationService に集約）

  describe('getRecentRecords', () => {
    it('should get recent records successfully', async () => {
      mockRepo.recentRecordsResult = [mockRecord];
      const result = await restaurantService.getRecentRecords(5);
      expect(result).toEqual([mockRecord]);
    });
  });
  // getHighRatedRecords は削除済み（RecordService に集約）

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
        mockRepo.listError = new ApiClientError('Test Error', status);
        await expect(restaurantService.getRestaurants()).rejects.toThrow(expectedMessage);
        mockRepo.listError = null;
      }
    });
  });
});
