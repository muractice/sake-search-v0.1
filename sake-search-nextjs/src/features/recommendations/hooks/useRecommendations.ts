'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePreferenceAnalysis } from '@/features/favorites/hooks/usePreferenceAnalysis';
import { useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { RecommendationEngine, SakeRecommendation } from '@/services/recommendationEngine';
import { RecommendOptions } from '@/types/preference';
import { SakeData } from '@/types/sake';
import { SakeDataService } from '@/services/sakeDataService';

export function useRecommendations(options?: RecommendOptions) {
  const { preference, hasEnoughData } = usePreferenceAnalysis();
  const { user, favorites } = useFavoritesContext();
  
  const [recommendations, setRecommendations] = useState<SakeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultOptions: RecommendOptions = {
    count: 20,
    mood: 'usual',
    includeSimilar: true,
    includeExplore: true,
    includeTrending: true,
    ...options
  };

  // 自動読み込みを無効化（手動起動のみ）
  // useEffect(() => {
  //   if (preference && user) {
  //     loadRecommendations();
  //   }
  // }, [preference, user, favorites]);

  const loadRecommendations = async () => {
    if (!preference || !user) return;

    setLoading(true);
    setError(null);

    try {
      // キャッシュチェック
      const cached = await getCachedRecommendations(user.id);
      if (cached && cached.length > 0) {
        setRecommendations(cached);
        setLoading(false);
        return;
      }

      // 新規生成
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        defaultOptions
      );
      
      // キャッシュ保存
      await cacheRecommendations(user.id, recs);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('レコメンドの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    if (!preference || !user) return;

    setLoading(true);
    try {
      // キャッシュをクリア
      await clearCachedRecommendations(user.id);
      
      // 新規生成
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        defaultOptions
      );
      
      await cacheRecommendations(user.id, recs);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('レコメンドの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationsByMood = async (mood: RecommendOptions['mood']) => {
    if (!preference || !user) return;

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
    hasRecommendations: !!preference && !!user && hasEnoughData,
  };
}

// キャッシュ関連のヘルパー関数
async function getCachedRecommendations(userId: string): Promise<SakeRecommendation[] | null> {
  try {
    const { data, error } = await supabase
      .from('recommendation_cache')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('similarity_score', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // キャッシュデータをSakeRecommendation形式に変換
    const sakeDataService = SakeDataService.getInstance();
    const allSakes = await sakeDataService.getAllSakes();
    const sakeMap = new Map(allSakes.map(s => [s.id, s]));
    
    const recommendations: SakeRecommendation[] = [];
    for (const cache of data) {
      const sake = sakeMap.get(cache.sake_id);
      if (sake) {
        recommendations.push({
          sake,
          score: cache.similarity_score,
          type: cache.recommendation_type as 'similar' | 'explore' | 'trending',
          reason: cache.recommendation_reason,
          similarityScore: cache.similarity_score,
          predictedRating: cache.predicted_rating
        });
      }
    }
    
    return recommendations.length > 0 ? recommendations : null;
  } catch (err) {
    console.error('Error getting cached recommendations:', err);
    return null;
  }
}

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

