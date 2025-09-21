'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePreferenceAnalysis } from '@/features/favorites/hooks/usePreferenceAnalysis';
import { useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { RecommendationEngine, SakeRecommendation } from '@/services/recommendationEngine';
import { RecommendOptions } from '@/types/preference';
import type { SakeData } from '@/types/sake';

type Params = {
  userId?: string;
  favorites?: SakeData[];
  options?: RecommendOptions;
};

export function useRecommendationsFromFavorite(params?: Params) {
  const ctx = useFavoritesContext();
  const userId = params?.userId ?? ctx.user?.id;
  const { preference, hasEnoughData } = usePreferenceAnalysis({ userId, favorites: params?.favorites });
  
  const [recommendations, setRecommendations] = useState<SakeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultOptions: RecommendOptions = {
    count: 20,
    mood: 'usual',
    includeSimilar: true,
    includeExplore: true,
    includeTrending: true,
    ...(params?.options || {})
  };

  // 自動読み込みを無効化（手動起動のみ）
  // useEffect(() => {
  //   if (preference && user) {
  //     loadRecommendations();
  //   }
  // }, [preference, user]);


  const refreshRecommendations = async () => {
    if (!preference || !userId) return;

    setLoading(true);
    try {
      // キャッシュをクリア
      await clearCachedRecommendations(userId);
      
      // 新規生成
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        defaultOptions
      );
      
      await cacheRecommendations(userId, recs);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('レコメンドの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationsByMood = async (mood: RecommendOptions['mood']) => {
    if (!preference || !userId) return;

    setLoading(true);
    try {
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        { ...defaultOptions, mood }
      );
      
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading mood recommendations:', err);
      setError('気分別レコメンドの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    error,
    refresh: refreshRecommendations,
    getByMood: getRecommendationsByMood,
    hasRecommendations: !!preference && !!userId && hasEnoughData,
  };
}

// キャッシュ関連のヘルパー関数

async function cacheRecommendations(userId: string, recommendations: SakeRecommendation[]): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12); // 12時間後に期限切れ

    const cacheData = recommendations.map(rec => ({
      user_id: userId,
      sake_id: rec.sake.id,
      similarity_score: rec.similarityScore,
      predicted_rating: rec.predictedRating,
      recommendation_type: rec.type,
      recommendation_reason: rec.reason,
      expires_at: expiresAt.toISOString(),
    }));

    const { error } = await supabase
      .from('recommendation_cache')
      .upsert(cacheData);

    if (error) throw error;
  } catch (err) {
    console.error('Error caching recommendations:', err);
    // キャッシュ失敗してもエラーは出さない
  }
}

async function clearCachedRecommendations(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('recommendation_cache')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (err) {
    console.error('Error clearing cached recommendations:', err);
  }
}
