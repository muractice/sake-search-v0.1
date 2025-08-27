/**
 * Service層を使用した新しいお気に入りフック
 * 段階的移行のため、既存のuseFavoritesと並行して提供
 */

import { useState, useCallback, useEffect } from 'react';
import { SakeData } from '@/types/sake';
import { useFavoriteService } from '@/providers/ServiceProvider';
import { 
  FavoriteServiceError,
  Favorite,
  UserPreferences,
  AuthUser,
  AuthCredentials
} from '@/services/FavoriteService';

interface UseFavoritesState {
  favorites: SakeData[];
  isLoading: boolean;
  error: string | null;
  user: AuthUser | null;
  showFavorites: boolean;
  statistics: {
    totalFavorites: number;
    mostFavoritedBrewery?: string;
    mostFavoritedPrefecture?: string;
    averageSweetness?: number;
    averageRichness?: number;
  } | null;
}

interface UseFavoritesActions {
  // お気に入り管理
  addFavorite: (sake: SakeData) => Promise<boolean>;
  removeFavorite: (sakeId: string) => Promise<boolean>;
  isFavorite: (sakeId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  syncFavorites: () => Promise<void>;

  // ユーザー設定
  toggleShowFavorites: () => Promise<void>;
  loadUserPreferences: () => Promise<void>;

  // 認証
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // 統計・レコメンド
  loadStatistics: () => Promise<void>;
  getFavoriteRecommendations: (limit?: number) => Promise<SakeData[]>;

  // UI制御
  clearError: () => void;
}

export interface UseFavoritesReturn extends UseFavoritesState, UseFavoritesActions {}

/**
 * Service層を使用する新しいお気に入りフック
 */
export const useFavoritesV2 = (): UseFavoritesReturn => {
  const favoriteService = useFavoriteService();
  
  const [state, setState] = useState<UseFavoritesState>({
    favorites: [],
    isLoading: true,
    error: null,
    user: null,
    showFavorites: true,
    statistics: null,
  });

  // 状態更新のヘルパー
  const updateState = useCallback((updates: Partial<UseFavoritesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * お気に入りを追加
   */
  const addFavorite = useCallback(async (sake: SakeData): Promise<boolean> => {
    if (!state.user) {
      updateState({ error: 'お気に入りに追加するにはログインが必要です' });
      return false;
    }

    // 既にお気に入りに追加済みかチェック
    if (state.favorites.some(fav => fav.id === sake.id)) {
      return true;
    }

    // 楽観的更新：先にUIを更新
    updateState({
      favorites: [sake, ...state.favorites],
      error: null,
    });

    try {
      await favoriteService.addFavorite(sake);
      return true;
    } catch (error) {
      // エラー時はUIを元に戻す
      updateState({
        favorites: state.favorites.filter(s => s.id !== sake.id),
        error: error instanceof FavoriteServiceError 
          ? error.message 
          : 'お気に入りの追加に失敗しました',
      });
      return false;
    }
  }, [favoriteService, updateState, state.user, state.favorites]);

  /**
   * お気に入りから削除
   */
  const removeFavorite = useCallback(async (sakeId: string): Promise<boolean> => {
    if (!state.user) {
      return false;
    }

    // 削除対象を保存しておく
    const removedSake = state.favorites.find(sake => sake.id === sakeId);
    if (!removedSake) {
      return false;
    }

    // 楽観的更新：先にUIを更新
    updateState({
      favorites: state.favorites.filter(sake => sake.id !== sakeId),
      error: null,
    });

    try {
      await favoriteService.removeFavorite(sakeId);
      return true;
    } catch (error) {
      // エラー時はUIを元に戻す
      updateState({
        favorites: [removedSake, ...state.favorites],
        error: error instanceof FavoriteServiceError 
          ? error.message 
          : 'お気に入りの削除に失敗しました',
      });
      return false;
    }
  }, [favoriteService, updateState, state.user, state.favorites]);

  /**
   * お気に入りかどうか確認
   */
  const isFavorite = useCallback((sakeId: string): boolean => {
    return state.favorites.some(sake => sake.id === sakeId);
  }, [state.favorites]);

  /**
   * お気に入りを再読み込み
   */
  const refreshFavorites = useCallback(async (): Promise<void> => {
    if (!state.user) {
      updateState({ favorites: [], isLoading: false });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const favorites = await favoriteService.getFavorites();
      const sakeDataList = favorites.map(fav => fav.sakeData);
      
      updateState({
        favorites: sakeDataList,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof FavoriteServiceError 
        ? error.message 
        : 'お気に入りの取得に失敗しました';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        favorites: [],
      });
    }
  }, [favoriteService, updateState, state.user]);

  /**
   * お気に入りを同期
   */
  const syncFavorites = useCallback(async (): Promise<void> => {
    if (!state.user) {
      return;
    }

    try {
      const localSakeIds = state.favorites.map(sake => sake.id);
      const syncedFavorites = await favoriteService.syncFavorites(localSakeIds);
      const sakeDataList = syncedFavorites.map(fav => fav.sakeData);
      
      updateState({ favorites: sakeDataList });
    } catch (error) {
      console.warn('お気に入りの同期に失敗:', error);
      // 同期失敗は致命的エラーではないのでエラー表示しない
    }
  }, [favoriteService, updateState, state.user, state.favorites]);

  /**
   * お気に入り表示を切り替え
   */
  const toggleShowFavorites = useCallback(async (): Promise<void> => {
    const newValue = !state.showFavorites;
    updateState({ showFavorites: newValue });

    if (state.user) {
      try {
        await favoriteService.toggleShowFavorites(state.showFavorites);
      } catch (error) {
        // エラー時は元に戻す
        updateState({ showFavorites: state.showFavorites });
        console.error('お気に入り表示設定の更新に失敗:', error);
      }
    }
  }, [favoriteService, updateState, state.user, state.showFavorites]);

  /**
   * ユーザー設定を読み込み
   */
  const loadUserPreferences = useCallback(async (): Promise<void> => {
    if (!state.user) {
      return;
    }

    try {
      const preferences = await favoriteService.getUserPreferences();
      if (preferences) {
        updateState({ showFavorites: preferences.showFavorites });
      }
    } catch (error) {
      console.warn('ユーザー設定の読み込みに失敗:', error);
      // 設定読み込み失敗は致命的エラーではない
    }
  }, [favoriteService, updateState, state.user]);

  /**
   * メールでログイン
   */
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      const session = await favoriteService.signInWithEmail({ email, password });
      
      if (session.user) {
        updateState({ user: session.user });
        await refreshFavorites();
        await loadUserPreferences();
        return true;
      }
      
      updateState({ error: 'ログインに失敗しました' });
      return false;
    } catch (error) {
      const errorMessage = error instanceof FavoriteServiceError 
        ? error.message 
        : 'ログインに失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [favoriteService, updateState, refreshFavorites, loadUserPreferences]);

  /**
   * メールでサインアップ
   */
  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    updateState({ error: null });

    try {
      const session = await favoriteService.signUpWithEmail({ email, password });
      
      if (session.user) {
        updateState({ user: session.user });
        return true;
      }
      
      updateState({ error: 'アカウント作成に失敗しました' });
      return false;
    } catch (error) {
      const errorMessage = error instanceof FavoriteServiceError 
        ? error.message 
        : 'アカウント作成に失敗しました';
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [favoriteService, updateState]);

  /**
   * ログアウト
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await favoriteService.signOut();
      updateState({
        user: null,
        favorites: [],
        showFavorites: true,
        statistics: null,
      });
    } catch (error) {
      const errorMessage = error instanceof FavoriteServiceError 
        ? error.message 
        : 'ログアウトに失敗しました';
      
      updateState({ error: errorMessage });
    }
  }, [favoriteService, updateState]);

  /**
   * セッションをリフレッシュ
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const session = await favoriteService.refreshSession();
      
      if (session.user) {
        updateState({ user: session.user });
        await refreshFavorites();
        await loadUserPreferences();
      } else {
        updateState({ user: null, favorites: [] });
      }
    } catch (error) {
      console.warn('セッションのリフレッシュに失敗:', error);
      updateState({ user: null, favorites: [] });
    }
  }, [favoriteService, updateState, refreshFavorites, loadUserPreferences]);

  /**
   * 統計情報を読み込み
   */
  const loadStatistics = useCallback(async (): Promise<void> => {
    if (!state.user || state.favorites.length === 0) {
      return;
    }

    try {
      const statistics = await favoriteService.getFavoriteStatistics();
      updateState({
        statistics: {
          totalFavorites: statistics.totalFavorites,
          mostFavoritedBrewery: statistics.mostFavoritedBrewery,
          mostFavoritedPrefecture: statistics.mostFavoritedPrefecture,
          averageSweetness: statistics.averageSweetness,
          averageRichness: statistics.averageRichness,
        },
      });
    } catch (error) {
      console.warn('統計情報の取得に失敗:', error);
      // 統計は補助情報なのでエラーにしない
    }
  }, [favoriteService, updateState, state.user, state.favorites]);

  /**
   * おすすめのお気に入り候補を取得
   */
  const getFavoriteRecommendations = useCallback(async (limit: number = 10): Promise<SakeData[]> => {
    if (!state.user || state.favorites.length === 0) {
      return [];
    }

    try {
      return await favoriteService.getFavoriteRecommendations(limit);
    } catch (error) {
      console.warn('レコメンドの取得に失敗:', error);
      return [];
    }
  }, [favoriteService, state.user, state.favorites]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // 初回セッション確認とデータ読み込み
  useEffect(() => {
    const initializeSession = async () => {
      updateState({ isLoading: true });

      try {
        // 現在のセッションを取得
        const session = await favoriteService.getSession();
        
        if (session.user) {
          updateState({ user: session.user });
          
          // お気に入りと設定を読み込み
          const [favoritesResult, preferencesResult] = await Promise.allSettled([
            favoriteService.getFavorites(),
            favoriteService.getUserPreferences(),
          ]);

          if (favoritesResult.status === 'fulfilled') {
            const sakeDataList = favoritesResult.value.map(fav => fav.sakeData);
            updateState({ favorites: sakeDataList });
          }

          if (preferencesResult.status === 'fulfilled' && preferencesResult.value) {
            updateState({ showFavorites: preferencesResult.value.showFavorites });
          }
        }
      } catch (error) {
        console.error('セッション初期化エラー:', error);
        // セッションエラーの場合、リフレッシュを試みる
        await refreshSession();
      } finally {
        updateState({ isLoading: false });
      }
    };

    initializeSession();
  }, [favoriteService, updateState, refreshSession]);

  // お気に入りが変更されたら統計を更新
  useEffect(() => {
    if (state.user && state.favorites.length > 0) {
      loadStatistics();
    }
  }, [state.user, state.favorites.length, loadStatistics]);

  return {
    // State
    favorites: state.favorites,
    isLoading: state.isLoading,
    error: state.error,
    user: state.user,
    showFavorites: state.showFavorites,
    statistics: state.statistics,
    
    // Favorites Actions
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites,
    syncFavorites,
    
    // Preferences Actions
    toggleShowFavorites,
    loadUserPreferences,
    
    // Auth Actions
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession,
    
    // Statistics & Recommendations
    loadStatistics,
    getFavoriteRecommendations,
    
    // UI Actions
    clearError,
  };
};