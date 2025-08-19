'use client';

import { useState, useEffect } from 'react';
import { SakeData } from '@/types/sake';

interface TrendingRecommendationsProps {
  onSelectSake?: (sake: SakeData) => void;
  onAddToComparison?: (sake: SakeData) => void;
  isInComparison?: (sakeId: string) => boolean;
}

export const TrendingRecommendations = ({
  onSelectSake,
  onAddToComparison,
  isInComparison
}: TrendingRecommendationsProps) => {
  const [trendingSakes, setTrendingSakes] = useState<SakeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadTrendingSakes();
  }, [selectedPeriod]);

  const loadTrendingSakes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recommendations/trending?limit=12`);
      if (!response.ok) throw new Error('Failed to load trending sakes');
      
      const data = await response.json();
      setTrendingSakes(data.trending || []);
    } catch (err) {
      console.error('Error loading trending sakes:', err);
      setError('トレンドデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSakeClick = (sake: SakeData) => {
    if (isInComparison?.(sake.id)) {
      onSelectSake?.(sake);
    } else {
      onAddToComparison?.(sake);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🔥 トレンド</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">トレンドを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🔥 トレンド</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTrendingSakes}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  const periodOptions = [
    { key: 'daily', label: '今日', icon: '☀️' },
    { key: 'weekly', label: '今週', icon: '📅' },
    { key: 'monthly', label: '今月', icon: '📆' },
  ];

  return (
    <div className="space-y-6">
      {/* 期間選択 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold">トレンド期間</h4>
          <button
            onClick={loadTrendingSakes}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            🔄 更新
          </button>
        </div>
        <div className="flex space-x-2">
          {periodOptions.map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as 'daily' | 'weekly' | 'monthly')}
              className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{period.icon}</span>
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* トレンドランキング */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">🔥 人気急上昇の日本酒</h3>
        
        {trendingSakes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            トレンドデータがありません
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {trendingSakes.slice(0, 3).map((sake, index) => (
                <div
                  key={sake.id}
                  onClick={() => handleSakeClick(sake)}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all ${
                    isInComparison?.(sake.id)
                      ? 'bg-purple-50 border-2 border-purple-300'
                      : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-lg'
                  }`}
                >
                  <div className="absolute top-2 right-2">
                    <span className={`text-2xl ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mb-1 pr-8">{sake.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{sake.brewery}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-600">#{index + 1} トレンド</span>
                    {isInComparison?.(sake.id) && (
                      <span className="text-purple-600">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 4位以降 */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-700">その他の注目銘柄</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {trendingSakes.slice(3, 11).map((sake, index) => (
                  <div
                    key={sake.id}
                    onClick={() => handleSakeClick(sake)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                      isInComparison?.(sake.id)
                        ? 'bg-purple-50 border border-purple-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-400 mr-3">
                      #{index + 4}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{sake.name}</h5>
                      <p className="text-xs text-gray-600">{sake.brewery}</p>
                    </div>
                    {isInComparison?.(sake.id) && (
                      <span className="text-purple-600 text-sm">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* カテゴリ別トレンド */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-bold mb-3">カテゴリ別人気</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: '甘口', emoji: '🍯', color: 'pink' },
              { label: '辛口', emoji: '🌶️', color: 'blue' },
              { label: '濃醇', emoji: '🥃', color: 'amber' },
              { label: '淡麗', emoji: '💧', color: 'cyan' },
            ].map(category => (
              <button
                key={category.label}
                className={`p-2 rounded-md text-xs text-center bg-${category.color}-50 hover:bg-${category.color}-100 transition-colors`}
              >
                <div className="text-lg mb-1">{category.emoji}</div>
                <div>{category.label}人気</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};