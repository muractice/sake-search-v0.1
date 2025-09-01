'use client';

import { useState, useEffect } from 'react';
import { usePreferenceAnalysis } from '@/features/favorites/hooks/usePreferenceAnalysis';
import { useFavoritesContext } from '@/features/favorites/contexts/FavoritesContext';
import { SakeData } from '@/types/sake';
import { SakeRecommendation } from '@/services/recommendationEngine';

interface PersonalizedRecommendationsProps {
  onSelectSake?: (sake: SakeData) => void;
  onAddToComparison?: (sake: SakeData) => void;
  isInComparison?: (sakeId: string) => boolean;
}

export const PersonalizedRecommendations = ({
  onSelectSake,
  onAddToComparison,
  isInComparison
}: PersonalizedRecommendationsProps) => {
  const { hasEnoughData } = usePreferenceAnalysis();
  const { user, favorites } = useFavoritesContext();
  const [recommendations, setRecommendations] = useState<SakeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMood] = useState<string>('usual');

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (hasEnoughData && user) {
        await loadRecommendations(true); // お気に入りが変わったらキャッシュをスキップ
      }
    };
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEnoughData, user, selectedMood, favorites.length]); // favorites.lengthを依存配列に追加

  const loadRecommendations = async (skipCache = false) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const cacheParam = skipCache ? '&cache=false' : '';
      const response = await fetch(`/api/recommendations?mood=${selectedMood}&count=20${cacheParam}`);
      if (!response.ok) throw new Error('Failed to load recommendations');
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('レコメンドの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };


  if (!hasEnoughData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🎯 あなたへのおすすめ</h3>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">
            パーソナライズされたレコメンドを表示するには
          </p>
          <p className="text-sm text-gray-500">
            お気に入りに3件以上の日本酒を登録してください
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🎯 あなたへのおすすめ</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">レコメンドを生成中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🎯 あなたへのおすすめ</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadRecommendations()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }


  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    if (!acc[rec.type]) acc[rec.type] = [];
    acc[rec.type].push(rec);
    return acc;
  }, {} as Record<string, SakeRecommendation[]>);

  // デバッグログ
  console.log('📊 Recommendations debug:', {
    total: recommendations.length,
    types: Object.keys(groupedRecommendations),
    similar: groupedRecommendations.similar?.length || 0,
    explore: groupedRecommendations.explore?.length || 0,
    trending: groupedRecommendations.trending?.length || 0,
    raw: recommendations.slice(0, 3).map(r => ({
      name: r.sake.name,
      type: r.type,
      score: r.similarityScore
    }))
  });

  // 開発中メッセージを表示（早期リターン）
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🎯 あなたへのおすすめ</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <span className="text-amber-600 mr-2">🚧</span>
            <p className="text-amber-800 font-semibold">この機能は現在開発中です</p>
          </div>
          <p className="text-amber-700">
            あなたの好みを学習し、パーソナライズされたおすすめを提供する機能は近日公開予定です。
          </p>
          <p className="text-sm text-amber-600 mt-2">
            お気に入りに追加した日本酒の情報を基に、AIがあなた好みの日本酒をご提案します。
          </p>
        </div>
      </div>
    </div>
  );
};
