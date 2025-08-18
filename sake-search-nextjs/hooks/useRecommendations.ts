'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePreferenceAnalysis } from './usePreferenceAnalysis';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { RecommendationEngine, SakeRecommendation } from '@/services/recommendationEngine';
import { RecommendOptions } from '@/types/preference';
import { SakeData } from '@/types/sake';

export function useRecommendations(options?: RecommendOptions) {
  const { preference } = usePreferenceAnalysis();
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

  useEffect(() => {
    if (preference && user) {
      loadRecommendations();
    }
  }, [preference, user, favorites]);

  const loadRecommendations = async () => {
    if (!preference || !user) return;

    setLoading(true);
    setError(null);

    try {
      // キャッシュチェック
      const cached = await getCachedRecommendations(user.id);
      if (cached && !isExpired(cached)) {
        setRecommendations(cached);
        setLoading(false);
        return;
      }

      // 新規生成
      const allSakes = await fetchAllSakes();
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        allSakes,
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
      const allSakes = await fetchAllSakes();
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        allSakes,
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
      const allSakes = await fetchAllSakes();
      const engine = new RecommendationEngine();
      const recs = await engine.generateRecommendations(
        preference,
        allSakes,
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
    hasRecommendations: recommendations.length > 0,
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
    // TODO: sake_idから実際のSakeDataを取得する必要がある
    return null; // 簡易実装では新規生成する
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

function isExpired(recommendations: any[]): boolean {
  if (recommendations.length === 0) return true;
  
  const firstExpiry = new Date(recommendations[0].expires_at);
  return firstExpiry < new Date();
}

// 全ての日本酒データを取得する関数
// TODO: 実際のAPIまたはデータベースから取得
async function fetchAllSakes(): Promise<SakeData[]> {
  // 今回は簡易実装として、サンプルデータを返す
  // 実際の実装では、さけのわAPIや内部データベースから取得
  return [
    {
      id: 'sample1',
      brandId: 1,
      name: '獺祭 純米大吟醸 50',
      brewery: '旭酒造',
      breweryId: 1,
      sweetness: 1,
      richness: -2,
      description: '洗練された味わいの純米大吟醸',
      flavorChart: {
        brandId: 1,
        f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.7, f5: 0.6, f6: 0.8
      }
    },
    {
      id: 'sample2',
      brandId: 2,
      name: '新政 No.6',
      brewery: '新政酒造',
      breweryId: 2,
      sweetness: 0,
      richness: -1,
      description: '革新的な純米酒',
      flavorChart: {
        brandId: 2,
        f1: 0.9, f2: 0.4, f3: 0.2, f4: 0.5, f5: 0.8, f6: 0.9
      }
    },
    // 他のサンプルデータ...
  ];
}