import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { SakeData } from '@/types/sake';
import { User } from '@supabase/supabase-js';
import { FavoritesService } from '@/services/favorites/FavoritesService';
import { SupabaseFavoritesRepository } from '@/repositories/favorites/SupabaseFavoritesRepository';
import { SupabaseRecommendationCacheRepository } from '@/repositories/recommendations/SupabaseRecommendationCacheRepository';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<SakeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showFavorites, setShowFavorites] = useState(true);

  const favoritesService = useMemo(() => {
    const repo = new SupabaseFavoritesRepository();
    const recCacheRepo = new SupabaseRecommendationCacheRepository();
    return new FavoritesService(repo, recCacheRepo);
  }, []);


  // ユーザーセッションの監視
  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        // セッションエラーの場合、リフレッシュを試みる
        supabase.auth.refreshSession().then(({ data: { session: refreshedSession } }) => {
          setUser(refreshedSession?.user ?? null);
          if (refreshedSession?.user) {
            loadFavorites(refreshedSession.user.id);
            loadPreferences(refreshedSession.user.id);
          }
        });
      } else {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadFavorites(session.user.id);
          loadPreferences(session.user.id);
        }
      }
      setIsLoading(false);
    });

    // セッション変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFavorites(session.user.id);
        loadPreferences(session.user.id);
      } else {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // お気に入りを読み込む
  const loadFavorites = async (userId: string) => {
    try {
      const items = await favoritesService.list(userId);
      const sakeDataList = items.map(item => item.sakeData as SakeData);
      setFavorites(sakeDataList);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // ユーザー設定を読み込む
  const loadPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      if (data) {
        setShowFavorites(data.show_favorites);
        // comparisonMode は削除済み（常にON）
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

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
      await favoritesService.add(user.id, sake);
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
      await favoritesService.remove(user.id, sakeId);
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
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            show_favorites: newValue,
            updated_at: new Date().toISOString(),
          });
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };

  // 比較モード管理は useComparison フックに移譲

  // メールでログイン
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // メールでサインアップ
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // ログアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setFavorites([]);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('ログアウトに失敗しました');
    }
  };

  return {
    // データ
    favorites,
    user,
    isLoading,
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
