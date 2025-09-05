/**
 * Service層を使用した新しいレコメンド機能フック
 * 段階的移行のため、既存のuseRecommendationsと並行して提供
 */

import { useState, useCallback } from 'react';
import { SakeData } from '@/types/sake';
import { useRecommendationService } from '@/providers/ServiceProvider';
import { 
  RecommendationServiceError,
  RecommendationResult,
  RecommendationOptions,
  RestaurantRecommendationOptions,
  TrendingRecommendationOptions,
  RecommendationResponse
} from '@/services/RecommendationService';

interface UseRecommendationsState {
  personalRecommendations: RecommendationResult[];
  trendingRecommendations: RecommendationResult[];
  restaurantRecommendations: RecommendationResult[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  requiresMoreFavorites: boolean;
  favoritesMessage: string;
}

interface UseRecommendationsActions {
  // 個人レコメンド
  loadPersonalRecommendations: (options?: RecommendationOptions) => Promise<boolean>;
  getMoodRecommendations: (mood: RecommendationOptions['mood']) => Promise<RecommendationResult[]>;
  
  // 飲食店レコメンド
  loadRestaurantRecommendations: (options: RestaurantRecommendationOptions) => Promise<RecommendationResponse | null>;
  
  // トレンドレコメンド
  loadTrendingRecommendations: (options?: TrendingRecommendationOptions) => Promise<boolean>;
  
  // 類似性レコメンド
  getSimilarityRecommendations: (sakeIds: string[], count?: number) => Promise<RecommendationResult[]>;
  
  // ペアリングレコメンド
  getPairingRecommendations: (dishType: string, availableSakes: SakeData[], count?: number) => Promise<RecommendationResult[]>;
  
  // ランダム/ガチャ
  getRandomPick: (menuItems?: string[]) => Promise<RecommendationResult | null>;
  
  // キャッシュ管理
  clearRecommendationCache: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  
  // 履歴管理
  getRecommendationHistory: () => Promise<RecommendationResult[]>;
  
  // UI制御
  clearError: () => void;
}

export interface UseRecommendationsReturn extends UseRecommendationsState, UseRecommendationsActions {}

/**
 * Service層を使用する新しいレコメンド機能フック
 */
export const useRecommendationsV2 = (): UseRecommendationsReturn => {
  const recommendationService = useRecommendationService();
  
  const [state, setState] = useState<UseRecommendationsState>({
    personalRecommendations: [],
    trendingRecommendations: [],
    restaurantRecommendations: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    requiresMoreFavorites: false,
    favoritesMessage: '',
  });

  // 状態更新のヘルパー
  const updateState = useCallback((updates: Partial<UseRecommendationsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 個人レコメンドを読み込み
   */
  const loadPersonalRecommendations = useCallback(async (options: RecommendationOptions = {}): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const recommendations = await recommendationService.getPersonalRecommendations(options);
      updateState({
        personalRecommendations: recommendations,
        lastUpdated: new Date(),
        isLoading: false,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof RecommendationServiceError 
        ? error.message 
        : '個人レコメンドの読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return false;
    }
  }, [recommendationService, updateState]);

  /**
   * 気分別レコメンドを取得
   */
  const getMoodRecommendations = useCallback(async (mood: RecommendationOptions['mood']): Promise<RecommendationResult[]> => {
    try {
      return await recommendationService.getMoodRecommendations(mood);
    } catch (error) {
      console.warn('気分別レコメンド取得エラー:', error);
      return [];
    }
  }, [recommendationService]);

  /**
   * 飲食店レコメンドを読み込み
   */
  const loadRestaurantRecommendations = useCallback(async (
    options: RestaurantRecommendationOptions
  ): Promise<RecommendationResponse | null> => {
    updateState({ isLoading: true, error: null });

    try {
      const response = await recommendationService.getRestaurantRecommendations(options);
      
      updateState({
        restaurantRecommendations: response.recommendations || [],
        requiresMoreFavorites: response.requiresMoreFavorites || false,
        favoritesMessage: response.message || '',
        lastUpdated: new Date(),
        isLoading: false,
      });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof RecommendationServiceError 
        ? error.message 
        : '飲食店レコメンドの読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  }, [recommendationService, updateState]);

  /**
   * トレンドレコメンドを読み込み
   */
  const loadTrendingRecommendations = useCallback(async (
    options: TrendingRecommendationOptions = {}
  ): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const recommendations = await recommendationService.getTrendingRecommendations(options);
      updateState({
        trendingRecommendations: recommendations,
        lastUpdated: new Date(),
        isLoading: false,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof RecommendationServiceError 
        ? error.message 
        : 'トレンドレコメンドの読み込みに失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      return false;
    }
  }, [recommendationService, updateState]);

  /**
   * 類似性レコメンドを取得
   */
  const getSimilarityRecommendations = useCallback(async (
    sakeIds: string[], 
    count: number = 10
  ): Promise<RecommendationResult[]> => {
    try {
      return await recommendationService.getSimilarityRecommendations(sakeIds, count);
    } catch (error) {
      console.warn('類似性レコメンド取得エラー:', error);
      return [];
    }
  }, [recommendationService]);

  /**
   * ペアリングレコメンドを取得
   */
  const getPairingRecommendations = useCallback(async (
    dishType: string, 
    availableSakes: SakeData[], 
    count: number = 5
  ): Promise<RecommendationResult[]> => {
    try {
      return await recommendationService.getPairingRecommendations(dishType, availableSakes, count);
    } catch (error) {
      console.warn('ペアリングレコメンド取得エラー:', error);
      return [];
    }
  }, [recommendationService]);

  /**
   * ランダムピック（おすすめガチャ）を取得
   */
  const getRandomPick = useCallback(async (menuItems?: string[]): Promise<RecommendationResult | null> => {
    try {
      return await recommendationService.getRandomPick(menuItems);
    } catch (error) {
      console.warn('ランダムピック取得エラー:', error);
      return null;
    }
  }, [recommendationService]);

  /**
   * レコメンドキャッシュをクリア
   */
  const clearRecommendationCache = useCallback(async (): Promise<void> => {
    try {
      await recommendationService.clearRecommendationCache();
    } catch (error) {
      console.warn('キャッシュクリアエラー:', error);
    }
  }, [recommendationService]);

  /**
   * 全てのレコメンドを再読み込み
   */
  const refreshRecommendations = useCallback(async (): Promise<void> => {
    await clearRecommendationCache();
    await loadPersonalRecommendations();
    await loadTrendingRecommendations();
  }, [clearRecommendationCache, loadPersonalRecommendations, loadTrendingRecommendations]);

  /**
   * レコメンド履歴を取得
   */
  const getRecommendationHistory = useCallback(async (): Promise<RecommendationResult[]> => {
    try {
      return await recommendationService.getRecommendationHistory();
    } catch (error) {
      console.warn('レコメンド履歴取得エラー:', error);
      return [];
    }
  }, [recommendationService]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback((): void => {
    updateState({ error: null });
  }, [updateState]);

  // 初回読み込み（自動実行は無効化、手動での実行を推奨）
  // useEffect(() => {
  //   loadTrendingRecommendations();
  // }, []);

  return {
    // State
    personalRecommendations: state.personalRecommendations,
    trendingRecommendations: state.trendingRecommendations,
    restaurantRecommendations: state.restaurantRecommendations,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    requiresMoreFavorites: state.requiresMoreFavorites,
    favoritesMessage: state.favoritesMessage,
    
    // Personal Recommendations Actions
    loadPersonalRecommendations,
    getMoodRecommendations,
    
    // Restaurant Recommendations Actions
    loadRestaurantRecommendations,
    
    // Trending Recommendations Actions
    loadTrendingRecommendations,
    
    // Similarity Recommendations Actions
    getSimilarityRecommendations,
    
    // Pairing Recommendations Actions
    getPairingRecommendations,
    
    // Random Pick Actions
    getRandomPick,
    
    // Cache Management Actions
    clearRecommendationCache,
    refreshRecommendations,
    
    // History Actions
    getRecommendationHistory,
    
    // UI Actions
    clearError,
  };
};