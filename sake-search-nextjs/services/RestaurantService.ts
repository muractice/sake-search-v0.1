/**
 * 飲食店関連のビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { 
  RestaurantMenu, 
  RestaurantMenuWithSakes,
  RestaurantMenuFormData,
  RestaurantMenuSake,
  RestaurantMenuSakeFormData,
  RestaurantDrinkingRecord,
  RestaurantDrinkingRecordFormData,
  RestaurantDrinkingRecordDetail
} from '@/types/restaurant';
import { SakeData } from '@/types/sake';
import { ApiClient, ApiClientError } from './core/ApiClient';

export interface RestaurantFilters {
  restaurantName?: string;
  location?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  ratingMin?: number;
  ratingMax?: number;
  priceMin?: number;
  priceMax?: number;
  hasAvailableSakes?: boolean;
}

export interface RestaurantSearchOptions {
  filters?: RestaurantFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'restaurant_name' | 'location' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface RestaurantSearchResult {
  restaurants: RestaurantMenu[];
  total: number;
  hasMore: boolean;
  filters?: RestaurantFilters;
  timestamp: string;
}

export interface RestaurantRecordSearchResult {
  records: RestaurantDrinkingRecordDetail[];
  total: number;
  hasMore: boolean;
  filters?: RestaurantFilters;
  timestamp: string;
}

export interface RestaurantStatistics {
  totalRestaurants: number;
  totalRecords: number;
  uniqueSakes: number;
  averageRating: number;
  mostVisitedRestaurant?: string;
  recentActivity: {
    thisWeek: number;
    thisMonth: number;
  };
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

export interface RecommendationOptions {
  type: 'similarity' | 'pairing' | 'random';
  restaurantId?: string;
  dishType?: string;
  limit?: number;
  excludeSakeIds?: string[];
}

export interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

export class RestaurantServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'RestaurantServiceError';
  }
}

export class RestaurantService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 飲食店一覧を取得（既存の /api/restaurant/menus エンドポイントを使用）
   */
  async getRestaurants(): Promise<RestaurantMenu[]> {
    try {
      console.log('RestaurantService.getRestaurants: APIを呼び出します');
      const data = await this.apiClient.get<{ restaurants: RestaurantMenu[] }>('/api/restaurant/menus') as unknown as { restaurants: RestaurantMenu[] };
      console.log('RestaurantService.getRestaurants: レスポンス取得成功', data);
      return data.restaurants || [];
    } catch (error) {
      console.error('RestaurantService.getRestaurants: エラー詳細', error);
      this.handleError('飲食店の取得に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを作成
   */
  async createRestaurant(input: RestaurantMenuFormData): Promise<RestaurantMenu> {
    try {
      this.validateRestaurantInput(input);

      const response = await this.apiClient.post<RestaurantMenu>('/api/v1/restaurants', input);
      return response.data;
    } catch (error) {
      this.handleError('飲食店の作成に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを更新
   */
  async updateRestaurant(restaurantId: string, input: Partial<RestaurantMenuFormData>): Promise<RestaurantMenu> {
    try {
      if (!restaurantId) {
        throw new RestaurantServiceError('飲食店IDが指定されていません');
      }

      if (input.restaurant_name !== undefined) {
        this.validateRestaurantInput(input as RestaurantMenuFormData);
      }

      const response = await this.apiClient.put<RestaurantMenu>(`/api/v1/restaurants/${restaurantId}`, input);
      return response.data;
    } catch (error) {
      this.handleError('飲食店の更新に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを削除
   */
  async deleteRestaurant(restaurantId: string): Promise<void> {
    try {
      if (!restaurantId) {
        throw new RestaurantServiceError('飲食店IDが指定されていません');
      }

      await this.apiClient.delete(`/api/v1/restaurants/${restaurantId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return;
      }
      this.handleError('飲食店の削除に失敗しました', error);
    }
  }

  /**
   * 飲食店のメニューに日本酒を追加
   */
  async addSakeToMenu(restaurantId: string, input: RestaurantMenuSakeFormData): Promise<RestaurantMenuSake> {
    try {
      if (!restaurantId) {
        throw new RestaurantServiceError('飲食店IDが指定されていません');
      }

      this.validateMenuSakeInput(input);

      const response = await this.apiClient.post<RestaurantMenuSake>(`/api/v1/restaurants/${restaurantId}/sakes`, input);
      return response.data;
    } catch (error) {
      this.handleError('メニューへの日本酒追加に失敗しました', error);
    }
  }

  /**
   * メニューの日本酒情報を更新
   */
  async updateMenuSake(menuSakeId: string, input: Partial<RestaurantMenuSakeFormData>): Promise<RestaurantMenuSake> {
    try {
      if (!menuSakeId) {
        throw new RestaurantServiceError('メニュー日本酒IDが指定されていません');
      }

      const response = await this.apiClient.put<RestaurantMenuSake>(`/api/v1/restaurants/sakes/${menuSakeId}`, input);
      return response.data;
    } catch (error) {
      this.handleError('メニュー日本酒の更新に失敗しました', error);
    }
  }

  /**
   * メニューから日本酒を削除
   */
  async removeSakeFromMenu(menuSakeId: string): Promise<void> {
    try {
      if (!menuSakeId) {
        throw new RestaurantServiceError('メニュー日本酒IDが指定されていません');
      }

      await this.apiClient.delete(`/api/v1/restaurants/sakes/${menuSakeId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return;
      }
      this.handleError('メニューからの日本酒削除に失敗しました', error);
    }
  }

  /**
   * 飲食店の詳細情報（日本酒メニュー含む）を取得（/api/restaurant/menus/list エンドポイントを使用）
   */
  async getRestaurantWithSakes(restaurantId: string): Promise<RestaurantMenuWithSakes[]> {
    try {
      if (!restaurantId) {
        throw new RestaurantServiceError('飲食店IDが指定されていません');
      }

      console.log('RestaurantService.getRestaurantWithSakes: 詳細取得開始', restaurantId);
      const data = await this.apiClient.get<{ menuWithSakes: RestaurantMenuWithSakes[] }>(`/api/restaurant/menus/list?restaurant_id=${restaurantId}`) as unknown as { menuWithSakes: RestaurantMenuWithSakes[] };
      console.log('RestaurantService.getRestaurantWithSakes: 取得結果', data);
      return data.menuWithSakes || [];
    } catch (error) {
      console.error('RestaurantService.getRestaurantWithSakes: エラー', error);
      this.handleError('飲食店詳細の取得に失敗しました', error);
    }
  }

  /**
   * 飲食店記録を作成
   */
  async createRecord(input: RestaurantDrinkingRecordFormData): Promise<RestaurantDrinkingRecord> {
    try {
      this.validateRecordInput(input);

      const response = await this.apiClient.post<RestaurantDrinkingRecord>('/api/v1/restaurants/records', {
        ...input,
        date: input.date || new Date().toISOString().split('T')[0],
      });

      return response.data;
    } catch (error) {
      this.handleError('飲食店記録の作成に失敗しました', error);
    }
  }

  /**
   * 飲食店記録を更新
   */
  async updateRecord(recordId: string, input: Partial<RestaurantDrinkingRecordFormData>): Promise<RestaurantDrinkingRecord> {
    try {
      if (!recordId) {
        throw new RestaurantServiceError('記録IDが指定されていません');
      }

      const response = await this.apiClient.put<RestaurantDrinkingRecord>(`/api/v1/restaurants/records/${recordId}`, input);
      return response.data;
    } catch (error) {
      this.handleError('飲食店記録の更新に失敗しました', error);
    }
  }

  /**
   * 飲食店記録を削除（既存の /api/restaurant/records エンドポイントを使用）
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      if (!recordId) {
        throw new RestaurantServiceError('記録IDが指定されていません');
      }

      await this.apiClient.delete(`/api/restaurant/records?id=${recordId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return;
      }
      this.handleError('飲食店記録の削除に失敗しました', error);
    }
  }

  /**
   * 飲食店記録を検索・取得
   */
  async getRecords(options: RestaurantSearchOptions = {}): Promise<RestaurantRecordSearchResult> {
    try {
      const response = await this.apiClient.post<RestaurantRecordSearchResult>('/api/v1/restaurants/records/search', {
        ...options,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc',
      });

      return response.data;
    } catch (error) {
      this.handleError('飲食店記録の取得に失敗しました', error);
    }
  }

  /**
   * 飲食店記録統計を取得
   */
  async getStatistics(): Promise<RestaurantStatistics> {
    try {
      const response = await this.apiClient.get<RestaurantStatistics>('/api/v1/restaurants/statistics');
      return response.data;
    } catch (error) {
      this.handleError('飲食店記録統計の取得に失敗しました', error);
    }
  }

  /**
   * 飲食店向け日本酒レコメンドを取得
   */
  async getRecommendations(options: RecommendationOptions): Promise<RecommendationResult[]> {
    try {
      this.validateRecommendationOptions(options);

      const response = await this.apiClient.post<RecommendationResult[]>('/api/v1/restaurants/recommendations', {
        ...options,
        limit: options.limit || 10,
      });

      return response.data;
    } catch (error) {
      this.handleError('レコメンドの取得に失敗しました', error);
    }
  }

  /**
   * 最近の飲食店記録を取得（既存の /api/restaurant/records エンドポイントを使用）
   */
  async getRecentRecords(limit: number = 10): Promise<RestaurantDrinkingRecordDetail[]> {
    try {
      const data = await this.apiClient.get<{ records: RestaurantDrinkingRecordDetail[] }>(`/api/restaurant/records?limit=${limit}`) as unknown as { records: RestaurantDrinkingRecordDetail[] };
      return data.records || [];
    } catch (error) {
      this.handleError('最近の飲食店記録取得に失敗しました', error);
    }
  }

  /**
   * 特定飲食店の記録を取得
   */
  async getRecordsByRestaurant(restaurantId: string): Promise<RestaurantDrinkingRecordDetail[]> {
    try {
      if (!restaurantId) {
        throw new RestaurantServiceError('飲食店IDが指定されていません');
      }

      const result = await this.getRecords({
        filters: { restaurantName: restaurantId }, // TODO: 実装ではrestaurant_idでフィルター
        limit: 100,
      });

      return result.records;
    } catch (error) {
      this.handleError('飲食店記録の取得に失敗しました', error);
    }
  }

  /**
   * 高評価飲食店記録を取得
   */
  async getHighRatedRecords(minRating: number = 4, limit: number = 20): Promise<RestaurantDrinkingRecordDetail[]> {
    try {
      if (minRating < 1 || minRating > 5) {
        throw new RestaurantServiceError('評価は1-5の範囲で指定してください');
      }

      const result = await this.getRecords({
        filters: { ratingMin: minRating },
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      return result.records;
    } catch (error) {
      this.handleError('高評価飲食店記録の取得に失敗しました', error);
    }
  }

  /**
   * プライベートメソッド: 飲食店入力のバリデーション
   */
  private validateRestaurantInput(input: RestaurantMenuFormData): void {
    if (!input.restaurant_name || typeof input.restaurant_name !== 'string' || input.restaurant_name.trim().length === 0) {
      throw new RestaurantServiceError('飲食店名が必要です');
    }

    if (input.restaurant_name.length > 100) {
      throw new RestaurantServiceError('飲食店名は100文字以内で入力してください');
    }

    if (input.location && input.location.length > 200) {
      throw new RestaurantServiceError('住所・場所は200文字以内で入力してください');
    }

    if (input.notes && input.notes.length > 1000) {
      throw new RestaurantServiceError('メモは1000文字以内で入力してください');
    }
  }

  /**
   * プライベートメソッド: メニュー日本酒入力のバリデーション
   */
  private validateMenuSakeInput(input: RestaurantMenuSakeFormData): void {
    if (!input.sake_id || typeof input.sake_id !== 'string') {
      throw new RestaurantServiceError('日本酒IDが必要です');
    }

    if (typeof input.is_available !== 'boolean') {
      throw new RestaurantServiceError('提供可否が必要です');
    }

    if (input.menu_notes && input.menu_notes.length > 500) {
      throw new RestaurantServiceError('メニューメモは500文字以内で入力してください');
    }
  }

  /**
   * プライベートメソッド: 飲食店記録入力のバリデーション
   */
  private validateRecordInput(input: RestaurantDrinkingRecordFormData): void {
    if (!input.restaurant_menu_id || typeof input.restaurant_menu_id !== 'string') {
      throw new RestaurantServiceError('飲食店IDが必要です');
    }

    if (!input.restaurant_menu_sake_id || typeof input.restaurant_menu_sake_id !== 'string') {
      throw new RestaurantServiceError('メニュー日本酒IDが必要です');
    }

    if (!input.sake_id || typeof input.sake_id !== 'string') {
      throw new RestaurantServiceError('日本酒IDが必要です');
    }

    if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5) {
      throw new RestaurantServiceError('評価は1-5の範囲で入力してください');
    }

    if (input.date && !this.isValidDate(input.date)) {
      throw new RestaurantServiceError('日付の形式が正しくありません (YYYY-MM-DD)');
    }

    if (input.memo && input.memo.length > 1000) {
      throw new RestaurantServiceError('メモは1000文字以内で入力してください');
    }

    if (input.price_paid && (input.price_paid < 0 || input.price_paid > 100000)) {
      throw new RestaurantServiceError('支払い金額は0-100000円の範囲で入力してください');
    }

    if (input.glass_ml && (input.glass_ml < 0 || input.glass_ml > 1000)) {
      throw new RestaurantServiceError('グラス容量は0-1000mlの範囲で入力してください');
    }
  }

  /**
   * プライベートメソッド: レコメンド オプションのバリデーション
   */
  private validateRecommendationOptions(options: RecommendationOptions): void {
    if (!['similarity', 'pairing', 'random'].includes(options.type)) {
      throw new RestaurantServiceError('無効なレコメンドタイプです');
    }

    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      throw new RestaurantServiceError('取得件数は1-100の範囲で指定してください');
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
  private handleError(message: string, error: any): never {
    if (error instanceof RestaurantServiceError) {
      throw error;
    }

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          throw new RestaurantServiceError('入力データが無効です');
        case 401:
          throw new RestaurantServiceError('ログインが必要です');
        case 403:
          throw new RestaurantServiceError('この操作の権限がありません');
        case 404:
          throw new RestaurantServiceError('指定された飲食店が見つかりません');
        case 429:
          throw new RestaurantServiceError('リクエストが多すぎます。しばらく待ってから再試行してください');
        case 500:
          throw new RestaurantServiceError('サーバーエラーが発生しました。時間をおいて再試行してください');
        default:
          throw new RestaurantServiceError(`${message} (${error.statusCode})`);
      }
    }

    throw new RestaurantServiceError(message, error);
  }
}