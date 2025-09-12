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
  RestaurantDrinkingRecordDetail,
  RestaurantCreationResponse,
  RestaurantCreationSuccessResponse,
  RestaurantCreationConflictResponse,
  isConflictResponse,
  isRestaurantMenu
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
  menuId?: string;
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
  constructor(message: string, public originalError?: unknown) {
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
      const response = await this.apiClient.get<{ restaurants: RestaurantMenu[] }>('/api/restaurant/menus');
      console.log('RestaurantService.getRestaurants: レスポンス取得成功', response);
      console.log('RestaurantService.getRestaurants: response.data:', response.data);
      console.log('RestaurantService.getRestaurants: response.restaurants:', (response as unknown as { restaurants: RestaurantMenu[] }).restaurants);
      
      // APIは直接 { restaurants: [...] } を返すので response.restaurants にアクセス
      const restaurants = (response as unknown as { restaurants: RestaurantMenu[] }).restaurants || [];
      console.log('RestaurantService.getRestaurants: 最終的なrestaurants:', restaurants);
      return restaurants;
    } catch (error) {
      console.error('RestaurantService.getRestaurants: エラー詳細', error);
      this.handleError('飲食店の取得に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを作成
   */
  async createRestaurant(input: RestaurantMenuFormData): Promise<RestaurantCreationResponse> {
    try {
      this.validateRestaurantInput(input);

      console.log('[RestaurantService] createRestaurant - 送信データ:', input);
      const apiResponse = await this.apiClient.post<RestaurantCreationSuccessResponse | RestaurantCreationConflictResponse>('/api/restaurant/menus', input);
      console.log('[RestaurantService] createRestaurant - APIレスポンス:', apiResponse);
      
      // ApiResponse構造からdataを取得
      const response = (apiResponse.data || apiResponse) as RestaurantCreationResponse;
      
      // conflictフラグがある場合は特別な処理
      if (isConflictResponse(response)) {
        console.log('[RestaurantService] createRestaurant - 重複検出:', response.message);
        return response;
      }
      
      // 成功レスポンスの場合 - type guardを使用
      if (isRestaurantMenu(response)) {
        console.log('[RestaurantService] createRestaurant - response.id:', response.id);
        return response;
      }
      
      // 成功レスポンスでrestaurantプロパティを持つ場合
      const successResponse = response as RestaurantCreationSuccessResponse;
      if (successResponse.restaurant) {
        console.log('[RestaurantService] createRestaurant - response.restaurant:', successResponse.restaurant);
        return successResponse.restaurant;
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('[RestaurantService] createRestaurant - エラー:', error);
      this.handleError('飲食店の作成に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを更新
   */
  async updateRestaurant(menuId: string, input: Partial<RestaurantMenuFormData>): Promise<RestaurantMenu> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      if (input.restaurant_name !== undefined) {
        this.validateRestaurantInput(input as RestaurantMenuFormData);
      }

      const response = await this.apiClient.put<RestaurantMenu>(`/api/restaurant/menus/${menuId}`, input);
      return response.data;
    } catch (error) {
      this.handleError('飲食店の更新に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを削除
   */
  async deleteRestaurant(menuId: string): Promise<void> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      await this.apiClient.delete(`/api/restaurant/menus/${menuId}`);
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
  async addSakeToMenu(menuId: string, input: RestaurantMenuSakeFormData): Promise<RestaurantMenuSake> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      this.validateMenuSakeInput(input);

      const response = await this.apiClient.post<RestaurantMenuSake>(`/api/restaurant/${menuId}/menus/${input.sake_id}`, input);
      return response.data;
    } catch (error) {
      this.handleError('メニューへの日本酒追加に失敗しました', error);
    }
  }

  /**
   * メニューの現在の日本酒リストを取得
   */
  async getMenuSakes(menuId: string): Promise<string[]> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      const response = await this.apiClient.get<{ menuWithSakes: RestaurantMenuWithSakes[] }>(
        `/api/restaurant/menus/list?restaurant_id=${menuId}`
      );

      const menuWithSakes = (response as unknown as { menuWithSakes: RestaurantMenuWithSakes[] }).menuWithSakes || [];
      return menuWithSakes.map(item => item.sake_id).filter((id): id is string => Boolean(id));
    } catch (error) {
      console.error('メニューの日本酒リスト取得エラー:', error);
      return [];
    }
  }

  /**
   * 飲食店のメニューを更新（差分検出による追加・削除）
   */
  async updateMenuSakes(menuId: string, sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[]): Promise<RestaurantMenuSake[]> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      // 空配列の場合は全削除として扱う
      if (!Array.isArray(sakes)) {
        throw new RestaurantServiceError('日本酒データが不正です');
      }

      // 現在のDB状態を取得
      const existingSakeIds = await this.getMenuSakes(menuId);
      const newSakeIds = sakes.map(s => s.sake_id);

      // 差分を計算
      const toDelete = existingSakeIds.filter(id => !newSakeIds.includes(id));
      const toAdd = sakes.filter(s => !existingSakeIds.includes(s.sake_id));
      const toUpdate = sakes.filter(s => existingSakeIds.includes(s.sake_id));

      console.log('[RestaurantService] 差分検出結果:', {
        existing: existingSakeIds,
        new: newSakeIds,
        toDelete,
        toAdd: toAdd.map(s => s.sake_id),
        toUpdate: toUpdate.map(s => s.sake_id)
      });

      // 差分処理を実行
      const response = await this.apiClient.post<{ menuSakes: RestaurantMenuSake[] }>('/api/restaurant/menus/list', {
        restaurant_menu_id: menuId,
        sakes,
        upsert: true,  // UPSERTモードを指定
        toDelete,      // 削除対象のIDリスト
        diffMode: true // 差分モードを指定
      });

      return (response as unknown as { menuSakes: RestaurantMenuSake[] }).menuSakes || [];
    } catch (error) {
      this.handleError('メニューの更新に失敗しました', error);
    }
  }

  /**
   * 飲食店のメニューに複数の日本酒を一括追加（後方互換性のため維持）
   */
  async addMultipleSakesToMenu(menuId: string, sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[]): Promise<RestaurantMenuSake[]> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      if (!Array.isArray(sakes) || sakes.length === 0) {
        throw new RestaurantServiceError('日本酒データが必要です');
      }

      const response = await this.apiClient.post<{ menuSakes: RestaurantMenuSake[] }>('/api/restaurant/menus/list', {
        restaurant_menu_id: menuId,
        sakes
      });

      // APIは直接 { menuSakes: [...] } を返すので response.menuSakes にアクセス
      return (response as unknown as { menuSakes: RestaurantMenuSake[] }).menuSakes || [];
    } catch (error) {
      this.handleError('メニューへの日本酒一括追加に失敗しました', error);
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

      await this.apiClient.delete(`/api/restaurant/menus/list?id=${menuSakeId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return;
      }
      this.handleError('メニューからの日本酒削除に失敗しました', error);
    }
  }

  /**
   * 単一の日本酒をメニューに追加
   */
  async addSingleSakeToMenu(menuId: string, sakeData: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }): Promise<void> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      await this.apiClient.post('/api/restaurant/menus/list', {
        restaurant_menu_id: menuId,
        sakes: [sakeData]
      });
    } catch (error) {
      this.handleError('メニューへの日本酒追加に失敗しました', error);
    }
  }

  /**
   * 保存済みメニューのアイテムを取得してメニュー名リストとして返す
   */
  async getMenuItemNames(menuId: string): Promise<string[]> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      const menuWithSakes = await this.getRestaurantWithSakes(menuId);
      const sakeNames: string[] = [];
      
      for (const item of menuWithSakes) {
        if (item.sake_name) {
          sakeNames.push(item.sake_name);
        } else if (item.sake_id) {
          // sake_nameがない場合はsake_idを使用（フォールバック）
          sakeNames.push(item.sake_id);
        }
      }
      
      // 重複を除去
      return [...new Set(sakeNames)];
    } catch (error) {
      this.handleError('メニューアイテム名の取得に失敗しました', error);
    }
  }

  /**
   * 日本酒IDに基づいてメニューから日本酒を削除
   */
  async removeSakeFromMenuBySakeId(menuId: string, sakeName: string, sakeIds: string[]): Promise<void> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      if (!sakeName || sakeIds.length === 0) {
        throw new RestaurantServiceError('削除する日本酒の情報が不足しています');
      }

      // 複数の日本酒IDがある場合に対応するため、各IDで削除を実行
      const deletePromises = sakeIds.map(sakeId => 
        this.apiClient.delete(`/api/restaurant/${menuId}/menus/${sakeId}`)
      );

      await Promise.allSettled(deletePromises);
    } catch (error) {
      this.handleError('メニューからの日本酒削除に失敗しました', error);
    }
  }

  /**
   * 飲食店の詳細情報（日本酒メニュー含む）を取得（/api/restaurant/menus/list エンドポイントを使用）
   */
  async getRestaurantWithSakes(menuId: string): Promise<RestaurantMenuWithSakes[]> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      console.log('RestaurantService.getRestaurantWithSakes: 詳細取得開始', menuId);
      const response = await this.apiClient.get<{ menuWithSakes: RestaurantMenuWithSakes[] }>(`/api/restaurant/menus/list?restaurant_id=${menuId}`);
      console.log('RestaurantService.getRestaurantWithSakes: 取得結果', response);
      console.log('RestaurantService.getRestaurantWithSakes: response.menuWithSakes:', (response as unknown as { menuWithSakes: RestaurantMenuWithSakes[] }).menuWithSakes);
      
      // APIは直接 { menuWithSakes: [...] } を返すので response.menuWithSakes にアクセス
      const menuWithSakes = (response as unknown as { menuWithSakes: RestaurantMenuWithSakes[] }).menuWithSakes || [];
      console.log('RestaurantService.getRestaurantWithSakes: 最終的なmenuWithSakes:', menuWithSakes);
      return menuWithSakes;
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

      const response = await this.apiClient.post<RestaurantDrinkingRecord>('/api/restaurant/records', {
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
      const queryParams: Record<string, string> = {
        limit: String(options.limit || 50),
        offset: String(options.offset || 0),
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc',
      };
      
      if (options.filters) {
        // filtersオブジェクトを文字列化して渡す
        queryParams.filters = JSON.stringify(options.filters);
      }
      
      const response = await this.apiClient.get<RestaurantRecordSearchResult>('/api/restaurant/records', queryParams);

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
      const response = await this.apiClient.get<RestaurantStatistics>('/api/restaurant/records');
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

      const response = await this.apiClient.post<RecommendationResult[]>('/api/recommendations/restaurant', {
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
      const response = await this.apiClient.get<{ records: RestaurantDrinkingRecordDetail[] }>(`/api/restaurant/records?limit=${limit}`);
      // APIは直接 { records: [...] } を返すので response.records にアクセス
      return (response as unknown as { records: RestaurantDrinkingRecordDetail[] }).records || [];
    } catch (error) {
      this.handleError('最近の飲食店記録取得に失敗しました', error);
    }
  }

  /**
   * 特定飲食店の記録を取得
   */
  async getRecordsByRestaurant(menuId: string): Promise<RestaurantDrinkingRecordDetail[]> {
    try {
      if (!menuId) {
        throw new RestaurantServiceError('メニューIDが指定されていません');
      }

      const result = await this.getRecords({
        filters: { restaurantName: menuId }, // TODO: 実装ではmenu_idでフィルター
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

    if (!input.registration_date || typeof input.registration_date !== 'string' || !this.isValidDate(input.registration_date)) {
      throw new RestaurantServiceError('登録日が必要です（YYYY-MM-DD形式）');
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
  private handleError(message: string, error: unknown): never {
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
        case 409:
          // 409エラーは現在使用されていない（conflictフラグで処理）
          const apiErrorMessage = (error as { response?: { error?: string } }).response?.error || 'リソースが競合しています';
          throw new RestaurantServiceError(apiErrorMessage);
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