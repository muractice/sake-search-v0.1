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
  RestaurantDrinkingRecordDetail,
  RestaurantCreationResponse,
  RestaurantCreationSuccessResponse,
  RestaurantCreationConflictResponse,
  isConflictResponse,
  isRestaurantMenu
} from '@/types/restaurant';
import { SakeData } from '@/types/sake';
import { ApiClient, ApiClientError } from './core/ApiClient';
import { IRestaurantRepository } from '@/repositories/restaurants/RestaurantRepository';

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
  private restaurantRepository?: IRestaurantRepository;

  constructor(apiClient: ApiClient, restaurantRepository?: IRestaurantRepository) {
    this.apiClient = apiClient;
    // Repository は必須運用（未設定時は実行時にエラー）
    this.restaurantRepository = restaurantRepository;
  }

  /**
   * 飲食店一覧を取得（既存の /api/restaurant/menus エンドポイントを使用）
   */
  async getRestaurants(): Promise<RestaurantMenu[]> {
    try {
      if (!this.restaurantRepository) {
        throw new RestaurantServiceError('Repositoryが設定されていません');
      }
      return await this.restaurantRepository.listForCurrentUser();
    } catch (error) {
      this.handleError('飲食店の取得に失敗しました', error);
    }
  }

  /**
   * 飲食店メニューを作成
   */
  async createRestaurant(input: RestaurantMenuFormData): Promise<RestaurantCreationResponse> {
    try {
      this.validateRestaurantInput(input);
      return await this.restaurantRepository.createForCurrentUser(input);
    } catch (error) {
      this.handleError('飲食店の作成に失敗しました', error);
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

      await this.restaurantRepository.delete(menuId);
    } catch (error) {
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
      return await this.restaurantRepository.addSakeToMenu(menuId, input);
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
      return await this.restaurantRepository.getMenuSakeIds(menuId);
    } catch (error) {
      // 取得失敗時は空配列を返す
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

      // 差分情報（必要に応じて呼び出し側でログ出力）

      // 差分処理を実行（Repository経由）
      return await this.restaurantRepository.updateMenuSakes(menuId, sakes, { upsert: true, toDelete });
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
      return await this.restaurantRepository.addMultipleSakesToMenu(menuId, sakes);
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
      return await this.restaurantRepository.updateMenuSake(menuSakeId, input);
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
      await this.restaurantRepository.removeSakeFromMenu(menuSakeId);
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
      return await this.restaurantRepository.getRestaurantWithSakes(menuId);
    } catch (error) {
      this.handleError('飲食店詳細の取得に失敗しました', error);
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
      await this.restaurantRepository.deleteRecord(recordId);
    } catch (error) {
      this.handleError('飲食店記録の削除に失敗しました', error);
    }
  }

  

  

  

  /**
   * 最近の飲食店記録を取得（既存の /api/restaurant/records エンドポイントを使用）
   */
  async getRecentRecords(limit: number = 10): Promise<RestaurantDrinkingRecordDetail[]> {
    try {
      return await this.restaurantRepository.getRecentRecords(limit);
    } catch (error) {
      this.handleError('最近の飲食店記録取得に失敗しました', error);
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

    if (input.registration_date !== undefined) {
      if (typeof input.registration_date !== 'string' || !this.isValidDate(input.registration_date)) {
        throw new RestaurantServiceError('登録日が必要です（YYYY-MM-DD形式）');
      }
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
