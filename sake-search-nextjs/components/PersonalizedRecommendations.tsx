'use client';

import { useState, useEffect } from 'react';
import { usePreferenceAnalysis } from '@/hooks/usePreferenceAnalysis';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
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
  const [selectedMood, setSelectedMood] = useState<string>('usual');

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

  const refreshRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // キャッシュをクリア
      await fetch('/api/recommendations', { method: 'DELETE' });
      
      // 新規取得（キャッシュをスキップ）
      await loadRecommendations(true);
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('レコメンドの更新に失敗しました');
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

  const moodOptions = [
    { key: 'usual', label: 'いつもの', icon: '🏠' },
    { key: 'adventure', label: '冒険したい', icon: '🎲' },
    { key: 'special', label: '特別な日', icon: '✨' },
    { key: 'relax', label: 'リラックス', icon: '😌' },
  ];

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

  return (
    <div className="space-y-6">
      {/* 気分選択 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold">今日の気分は？</h4>
          <button
            onClick={refreshRecommendations}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            🔄 更新
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {moodOptions.map(mood => (
            <button
              key={mood.key}
              onClick={() => setSelectedMood(mood.key)}
              className={`p-2 rounded-md text-xs text-center transition-colors ${
                selectedMood === mood.key
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="text-lg mb-1">{mood.icon}</div>
              <div>{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* レコメンド結果 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🎯 あなたへのおすすめ</h3>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            レコメンドがありません
          </div>
        ) : (
          <div className="space-y-6">
            {/* 好みに近い */}
            {groupedRecommendations.similar && (
              <RecommendationGroup
                title={`ぴったりの味わい (${groupedRecommendations.similar.length}件)`}
                recommendations={groupedRecommendations.similar}
                onSelectSake={onSelectSake}
                onAddToComparison={onAddToComparison}
                isInComparison={isInComparison}
                color="blue"
              />
            )}

            {/* 探索的 */}
            {groupedRecommendations.explore && (
              <RecommendationGroup
                title="新しい出会い"
                recommendations={groupedRecommendations.explore}
                onSelectSake={onSelectSake}
                onAddToComparison={onAddToComparison}
                isInComparison={isInComparison}
                color="green"
              />
            )}

            {/* トレンド */}
            {groupedRecommendations.trending && (
              <RecommendationGroup
                title="みんなのお気に入り"
                recommendations={groupedRecommendations.trending}
                onSelectSake={onSelectSake}
                onAddToComparison={onAddToComparison}
                isInComparison={isInComparison}
                color="purple"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface RecommendationGroupProps {
  title: string;
  recommendations: SakeRecommendation[];
  onSelectSake?: (sake: SakeData) => void;
  onAddToComparison?: (sake: SakeData) => void;
  isInComparison?: (sakeId: string) => boolean;
  color: 'blue' | 'green' | 'purple';
}

const RecommendationGroup = ({
  title,
  recommendations,
  onSelectSake,
  onAddToComparison,
  isInComparison,
  color
}: RecommendationGroupProps) => {
  const colorClasses = {
    blue: 'text-blue-800',
    green: 'text-green-800',
    purple: 'text-purple-800'
  };

  const handleClick = (sake: SakeData) => {
    if (isInComparison?.(sake.id)) {
      onSelectSake?.(sake);
    } else {
      onAddToComparison?.(sake);
    }
  };

  return (
    <div>
      <h4 className={`text-sm font-bold mb-3 ${colorClasses[color]}`}>{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.slice(0, 10).map(rec => (
          <div
            key={rec.sake.id}
            onClick={() => handleClick(rec.sake)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              isInComparison?.(rec.sake.id)
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h5 className="font-medium text-sm">{rec.sake.name}</h5>
                <p className="text-xs text-gray-600">{rec.sake.brewery}</p>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(rec.similarityScore * 100)}%
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>予測評価: ★{rec.predictedRating.toFixed(1)}</span>
              {isInComparison?.(rec.sake.id) && (
                <span className="text-blue-600">✓ 比較中</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};