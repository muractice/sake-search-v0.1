/**
 * Service層を使用した新しい飲食店フック
 * 段階的移行のため、既存のコンポーネントと並行して提供
 */

import { useState, useCallback, useEffect } from 'react';
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
import { useRestaurantService } from '@/providers/ServiceProvider';
import { 
  RestaurantServiceError,
  RestaurantFilters,
  RestaurantSearchOptions,
  RestaurantStatistics,
  RecommendationOptions,
  RecommendationResult
} from '@/services/RestaurantService';

interface UseRestaurantsState {
  restaurants: RestaurantMenu[];
  records: RestaurantDrinkingRecordDetail[];
  isLoading: boolean;
  error: string | null;
  statistics: RestaurantStatistics | null;
  hasMore: boolean;
  total: number;
  lastFilters: RestaurantFilters | null;
  selectedRestaurant: RestaurantMenuWithSakes[] | null;
  recommendations: RecommendationResult[];
}

interface UseRestaurantsActions {
  // 飲食店管理
  createRestaurant: (input: RestaurantMenuFormData) => Promise<RestaurantMenu | null>;
  updateRestaurant: (restaurantId: string, input: Partial<RestaurantMenuFormData>) => Promise<RestaurantMenu | null>;
  deleteRestaurant: (restaurantId: string) => Promise<boolean>;
  searchRestaurants: (options: RestaurantSearchOptions) => Promise<void>;
  getRestaurantWithSakes: (restaurantId: string) => Promise<void>;

  // メニュー管理
  addSakeToMenu: (restaurantId: string, input: RestaurantMenuSakeFormData) => Promise<RestaurantMenuSake | null>;
  updateMenuSake: (menuSakeId: string, input: Partial<RestaurantMenuSakeFormData>) => Promise<RestaurantMenuSake | null>;
  removeSakeFromMenu: (menuSakeId: string) => Promise<boolean>;

  // 記録管理
  createRecord: (input: RestaurantDrinkingRecordFormData) => Promise<RestaurantDrinkingRecord | null>;
  updateRecord: (recordId: string, input: Partial<RestaurantDrinkingRecordFormData>) => Promise<RestaurantDrinkingRecord | null>;
  deleteRecord: (recordId: string) => Promise<boolean>;
  searchRecords: (options: RestaurantSearchOptions) => Promise<void>;
  loadMoreRecords: () => Promise<void>;

  // レコメンド
  getRecommendations: (options: RecommendationOptions) => Promise<void>;

  // 統計・便利メソッド
  loadStatistics: () => Promise<void>;
  getRecentRecords: (limit?: number) => Promise<void>;
  getRecordsByRestaurant: (restaurantId: string) => Promise<void>;
  getHighRatedRecords: (minRating?: number, limit?: number) => Promise<void>;

  // UI制御
  refreshData: () => Promise<void>;
  clearError: () => void;
  clearData: () => void;
  clearRecommendations: () => void;
}

export interface UseRestaurantsReturn extends UseRestaurantsState, UseRestaurantsActions {}

/**
 * Service層を使用する新しい飲食店フック
 */
export const useRestaurantsV2 = (): UseRestaurantsReturn => {
  const restaurantService = useRestaurantService();
  
  const [state, setState] = useState<UseRestaurantsState>({
    restaurants: [],
    records: [],
    isLoading: false,
    error: null,
    statistics: null,
    hasMore: false,
    total: 0,
    lastFilters: null,
    selectedRestaurant: null,
    recommendations: [],
  });

  // 状態更新のヘルパー
  const updateState = useCallback((updates: Partial<UseRestaurantsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 飲食店を作成
   */
  const createRestaurant = useCallback(async (input: RestaurantMenuFormData): Promise<RestaurantMenu | null> => {
    updateState({ error: null });

    try {
      const newRestaurant = await restaurantService.createRestaurant(input);
      
      // 既存のリストに新しい飲食店を追加
      updateState({
        restaurants: [newRestaurant, ...state.restaurants],
        total: state.total + 1,
      });

      return newRestaurant;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店の作成に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [restaurantService, updateState, state.restaurants, state.total]);

  /**
   * 飲食店を更新
   */
  const updateRestaurant = useCallback(async (
    restaurantId: string, 
    input: Partial<RestaurantMenuFormData>
  ): Promise<RestaurantMenu | null> => {
    updateState({ error: null });

    try {
      const updatedRestaurant = await restaurantService.updateRestaurant(restaurantId, input);
      
      // リスト内の該当飲食店を更新
      updateState({
        restaurants: state.restaurants.map(restaurant => 
          restaurant.id === restaurantId ? updatedRestaurant : restaurant
        ),
      });

      return updatedRestaurant;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店の更新に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [restaurantService, updateState, state.restaurants]);

  /**
   * 飲食店を削除
   */
  const deleteRestaurant = useCallback(async (restaurantId: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      await restaurantService.deleteRestaurant(restaurantId);
      
      // リストから削除
      updateState({
        restaurants: state.restaurants.filter(restaurant => restaurant.id !== restaurantId),
        total: Math.max(0, state.total - 1),
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店の削除に失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [restaurantService, updateState, state.restaurants, state.total]);

  /**
   * 飲食店を検索
   */
  const searchRestaurants = useCallback(async (options: RestaurantSearchOptions = {}): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const result = await restaurantService.getRestaurants(options);
      
      updateState({
        restaurants: result.restaurants,
        hasMore: result.hasMore,
        total: result.total,
        lastFilters: options.filters || null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店の取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        restaurants: [],
        hasMore: false,
        total: 0,
      });
    }
  }, [restaurantService, updateState]);

  /**
   * 飲食店詳細（日本酒メニュー含む）を取得
   */
  const getRestaurantWithSakes = useCallback(async (restaurantId: string): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const restaurantDetail = await restaurantService.getRestaurantWithSakes(restaurantId);
      
      updateState({
        selectedRestaurant: restaurantDetail,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店詳細の取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        selectedRestaurant: null,
      });
    }
  }, [restaurantService, updateState]);

  /**
   * メニューに日本酒を追加
   */
  const addSakeToMenu = useCallback(async (
    restaurantId: string, 
    input: RestaurantMenuSakeFormData
  ): Promise<RestaurantMenuSake | null> => {
    updateState({ error: null });

    try {
      const menuSake = await restaurantService.addSakeToMenu(restaurantId, input);

      // 選択中の飲食店詳細を更新
      if (state.selectedRestaurant && state.selectedRestaurant[0]?.restaurant_menu_id === restaurantId) {
        await getRestaurantWithSakes(restaurantId);
      }

      return menuSake;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : 'メニューへの日本酒追加に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [restaurantService, updateState, state.selectedRestaurant, getRestaurantWithSakes]);

  /**
   * メニュー日本酒を更新
   */
  const updateMenuSake = useCallback(async (
    menuSakeId: string, 
    input: Partial<RestaurantMenuSakeFormData>
  ): Promise<RestaurantMenuSake | null> => {
    updateState({ error: null });

    try {
      const updatedMenuSake = await restaurantService.updateMenuSake(menuSakeId, input);
      
      // 詳細表示中の場合は再読み込み
      if (state.selectedRestaurant) {
        const restaurantId = state.selectedRestaurant[0]?.restaurant_menu_id;
        if (restaurantId) {
          await getRestaurantWithSakes(restaurantId);
        }
      }

      return updatedMenuSake;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : 'メニュー日本酒の更新に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [restaurantService, updateState, state.selectedRestaurant, getRestaurantWithSakes]);

  /**
   * メニューから日本酒を削除
   */
  const removeSakeFromMenu = useCallback(async (menuSakeId: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      await restaurantService.removeSakeFromMenu(menuSakeId);

      // 詳細表示中の場合は再読み込み
      if (state.selectedRestaurant) {
        const restaurantId = state.selectedRestaurant[0]?.restaurant_menu_id;
        if (restaurantId) {
          await getRestaurantWithSakes(restaurantId);
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : 'メニューからの日本酒削除に失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [restaurantService, updateState, state.selectedRestaurant, getRestaurantWithSakes]);

  /**
   * 飲食店記録を作成
   */
  const createRecord = useCallback(async (input: RestaurantDrinkingRecordFormData): Promise<RestaurantDrinkingRecord | null> => {
    updateState({ error: null });

    try {
      const newRecord = await restaurantService.createRecord(input);
      
      // 記録リストがロードされている場合は追加（詳細情報は再検索で取得）
      if (state.records.length > 0) {
        await searchRecords({ limit: Math.max(50, state.records.length) });
      }

      return newRecord;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店記録の作成に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [restaurantService, updateState, state.records]);

  /**
   * 飲食店記録を更新
   */
  const updateRecord = useCallback(async (
    recordId: string, 
    input: Partial<RestaurantDrinkingRecordFormData>
  ): Promise<RestaurantDrinkingRecord | null> => {
    updateState({ error: null });

    try {
      const updatedRecord = await restaurantService.updateRecord(recordId, input);
      
      // 記録リストがロードされている場合は再検索
      if (state.records.length > 0) {
        await searchRecords({ limit: Math.max(50, state.records.length) });
      }

      return updatedRecord;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店記録の更新に失敗しました';
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [restaurantService, updateState, state.records]);

  /**
   * 飲食店記録を削除
   */
  const deleteRecord = useCallback(async (recordId: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      await restaurantService.deleteRecord(recordId);
      
      // リストから削除
      updateState({
        records: state.records.filter(record => record.record_id !== recordId),
        total: Math.max(0, state.total - 1),
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店記録の削除に失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [restaurantService, updateState, state.records, state.total]);

  /**
   * 飲食店記録を検索
   */
  const searchRecords = useCallback(async (options: RestaurantSearchOptions = {}): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const result = await restaurantService.getRecords(options);
      
      updateState({
        records: result.records,
        hasMore: result.hasMore,
        total: result.total,
        lastFilters: options.filters || null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店記録の取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        records: [],
        hasMore: false,
        total: 0,
      });
    }
  }, [restaurantService, updateState]);

  /**
   * 追加記録を読み込み（ページネーション）
   */
  const loadMoreRecords = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.isLoading) {
      return;
    }

    updateState({ isLoading: true });

    try {
      const result = await restaurantService.getRecords({
        filters: state.lastFilters || undefined,
        offset: state.records.length,
        limit: 50,
      });

      updateState({
        records: [...state.records, ...result.records],
        hasMore: result.hasMore,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '追加記録の読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [restaurantService, updateState, state.hasMore, state.isLoading, state.lastFilters, state.records]);

  /**
   * レコメンドを取得
   */
  const getRecommendations = useCallback(async (options: RecommendationOptions): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const recommendations = await restaurantService.getRecommendations(options);
      
      updateState({
        recommendations,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : 'レコメンドの取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        recommendations: [],
      });
    }
  }, [restaurantService, updateState]);

  /**
   * 統計情報を読み込み
   */
  const loadStatistics = useCallback(async (): Promise<void> => {
    try {
      const statistics = await restaurantService.getStatistics();
      updateState({ statistics });
    } catch (error) {
      console.warn('飲食店統計情報の取得に失敗:', error);
    }
  }, [restaurantService, updateState]);

  /**
   * 最近の記録を取得
   */
  const getRecentRecords = useCallback(async (limit: number = 10): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const records = await restaurantService.getRecentRecords(limit);
      
      updateState({
        records,
        hasMore: false,
        total: records.length,
        lastFilters: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '最近の記録取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [restaurantService, updateState]);

  /**
   * 特定飲食店の記録を取得
   */
  const getRecordsByRestaurant = useCallback(async (restaurantId: string): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const records = await restaurantService.getRecordsByRestaurant(restaurantId);
      
      updateState({
        records,
        hasMore: false,
        total: records.length,
        lastFilters: { restaurantName: restaurantId },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '飲食店記録の取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [restaurantService, updateState]);

  /**
   * 高評価記録を取得
   */
  const getHighRatedRecords = useCallback(async (
    minRating: number = 4, 
    limit: number = 20
  ): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const records = await restaurantService.getHighRatedRecords(minRating, limit);
      
      updateState({
        records,
        hasMore: false,
        total: records.length,
        lastFilters: { ratingMin: minRating },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof RestaurantServiceError 
        ? error.message 
        : '高評価記録取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
    }
  }, [restaurantService, updateState]);

  /**
   * データを再読み込み
   */
  const refreshData = useCallback(async (): Promise<void> => {
    await searchRestaurants({
      filters: state.lastFilters || undefined,
      limit: Math.max(50, state.restaurants.length),
    });
    
    if (state.records.length > 0) {
      await searchRecords({
        filters: state.lastFilters || undefined,
        limit: Math.max(50, state.records.length),
      });
    }
  }, [searchRestaurants, searchRecords, state.lastFilters, state.restaurants.length, state.records.length]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * データをクリア
   */
  const clearData = useCallback(() => {
    setState({
      restaurants: [],
      records: [],
      isLoading: false,
      error: null,
      statistics: null,
      hasMore: false,
      total: 0,
      lastFilters: null,
      selectedRestaurant: null,
      recommendations: [],
    });
  }, []);

  /**
   * レコメンドをクリア
   */
  const clearRecommendations = useCallback(() => {
    updateState({ recommendations: [] });
  }, [updateState]);

  // 初回データ読み込み
  useEffect(() => {
    searchRestaurants(); // デフォルトの条件で飲食店を読み込み
    loadStatistics(); // 統計も読み込み
  }, []);

  return {
    // State
    restaurants: state.restaurants,
    records: state.records,
    isLoading: state.isLoading,
    error: state.error,
    statistics: state.statistics,
    hasMore: state.hasMore,
    total: state.total,
    lastFilters: state.lastFilters,
    selectedRestaurant: state.selectedRestaurant,
    recommendations: state.recommendations,
    
    // Restaurant Actions
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    searchRestaurants,
    getRestaurantWithSakes,

    // Menu Actions
    addSakeToMenu,
    updateMenuSake,
    removeSakeFromMenu,

    // Record Actions
    createRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    loadMoreRecords,

    // Recommendation Actions
    getRecommendations,

    // Utility Actions
    loadStatistics,
    getRecentRecords,
    getRecordsByRestaurant,
    getHighRatedRecords,

    // UI Actions
    refreshData,
    clearError,
    clearData,
    clearRecommendations,
  };
};