import { useState, useEffect, useMemo, useCallback } from 'react';
import { SakeData } from '@/types/sake';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/SupabaseUserPreferencesRepository';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<SakeData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // loading for favorites/preferences
  const [showFavorites, setShowFavorites] = useState(true);
  const { user, isLoading: authLoading, signInWithEmail, signUpWithEmail, signOut } = useAuthContext();

  const repos = useMemo(() => ({
    repo: new SupabaseFavoritesRepository(),
    recCacheRepo: new SupabaseRecommendationCacheRepository(),
    prefsRepo: new SupabaseUserPreferencesRepository(),
  }), []);
  // お気に入りを読み込む
  const loadFavorites = useCallback(async (userId: string) => {
    try {
      const items = await repos.repo.list(userId);
      const sakeDataList = items.map(item => item.sakeData as SakeData);
      setFavorites(sakeDataList);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [repos.repo]);

  // ユーザー設定を読み込む
  const loadPreferences = useCallback(async (userId: string) => {
    try {
      const prefs = await repos.prefsRepo.get(userId);
      if (prefs) {
        setShowFavorites(prefs.showFavorites);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [repos.prefsRepo]);

  // AuthContext の user 変化で favorites/preferences を同期
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        if (user?.id) {
          await Promise.all([
            loadFavorites(user.id),
            loadPreferences(user.id),
          ]);
        } else {
          setFavorites([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user?.id, loadFavorites, loadPreferences]);

  // お気に入りに追加
  const addFavorite = async (sake: SakeData) => {
    if (!user) {
      alert('お気に入りに追加するにはログインが必要です');
      return;
    }

    // 既にお気に入りに追加済みかチェック
    if (isFavorite(sake.id)) {
      return;
    }

    // 楽観的更新：先にUIを更新
    setFavorites(prev => [sake, ...prev]);

    try {
      await repos.repo.add(user.id, sake);
      try {
        await repos.recCacheRepo.clearByUser(user.id);
      } catch {
        // ignore cache clear error
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      
      // エラー時はUIを元に戻す
      setFavorites(prev => prev.filter(s => s.id !== sake.id));
      
      const errorCode = (error as { code?: string }).code;
      if (errorCode !== '23505') {
        // 重複エラー以外はアラート表示
        alert('お気に入りの追加に失敗しました');
      }
    }
  };

  // お気に入りから削除
  const removeFavorite = async (sakeId: string) => {
    if (!user) return;

    // 削除対象を保存しておく
    const removedSake = favorites.find(sake => sake.id === sakeId);
    if (!removedSake) return;

    // 楽観的更新：先にUIを更新
    setFavorites(prev => prev.filter(sake => sake.id !== sakeId));

    try {
      await repos.repo.remove(user.id, sakeId);
      try {
        await repos.recCacheRepo.clearByUser(user.id);
      } catch {
        // ignore cache clear error
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      
      // エラー時はUIを元に戻す
      setFavorites(prev => [removedSake, ...prev]);
      alert('お気に入りの削除に失敗しました');
    }
  };

  // お気に入りかどうか確認
  const isFavorite = (sakeId: string): boolean => {
    return favorites.some(sake => sake.id === sakeId);
  };

  // お気に入り表示を切り替え
  const toggleShowFavorites = async () => {
    const newValue = !showFavorites;
    setShowFavorites(newValue);
    if (user) {
      try {
        await repos.prefsRepo.updateShowFavorites(user.id, newValue);
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };

  // 比較モード管理は useComparison フックに移譲

  // signIn/signUp/signOut は AuthContext の API をそのまま返す

  return {
    // データ
    favorites,
    user, // from AuthContext
    isLoading: authLoading || isLoading,
    showFavorites,
    
    // メソッド
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleShowFavorites,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
};
