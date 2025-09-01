'use client';

import { useState } from 'react';
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations';
import { SakeRecommendation } from '@/services/recommendationEngine';
import { RecommendOptions } from '@/types/preference';
import { SakeData } from '@/types/sake';

interface RecommendationDisplayProps {
  onSelectSake?: (sake: SakeData) => void;
  onAddToComparison?: (sake: SakeData) => void;
  isInComparison?: (sakeId: string) => boolean;
  className?: string;
}

const moodOptions = [
  { key: 'usual', label: '🏠 いつものお気に入り', description: '好みに近い安定した選択' },
  { key: 'adventure', label: '🎲 ちょっと冒険', description: '好みの境界を少し広げて' },
  { key: 'discovery', label: '🚀 新しい発見', description: '全く新しい味わいに挑戦' },
  { key: 'special', label: '✨ 特別な日', description: 'プレミアムな一本を' },
] as const;

const typeLabels = {
  similar: '好みに近い',
  explore: '新しい発見',
  trending: '話題の銘柄',
};

const typeColors = {
  similar: 'bg-blue-100 text-blue-800',
  explore: 'bg-green-100 text-green-800',
  trending: 'bg-purple-100 text-purple-800',
};

export const RecommendationDisplay = ({
  onSelectSake,
  onAddToComparison,
  isInComparison,
  className = ''
}: RecommendationDisplayProps) => {
  const { recommendations, loading, error, refresh, getByMood, hasRecommendations } = useRecommendations();
  const [selectedMood, setSelectedMood] = useState<RecommendOptions['mood']>('usual');
  const [isActivated, setIsActivated] = useState(false);

  const handleActivate = () => {
    setIsActivated(true);
    refresh();
  };

  const handleMoodChange = async (mood: RecommendOptions['mood']) => {
    setSelectedMood(mood);
    await getByMood(mood);
  };

  const handleSakeClick = (sake: SakeData) => {
    onSelectSake?.(sake);
    onAddToComparison?.(sake);
  };

  const renderRecommendationCard = (rec: SakeRecommendation) => {
    const isAdded = isInComparison?.(rec.sake.id) || false;
    const similarity = Math.round(rec.similarityScore * 100);
    const predictedRating = rec.predictedRating.toFixed(1);

    return (
      <div
        key={rec.sake.id}
        className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
          isAdded 
            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
        onClick={() => handleSakeClick(rec.sake)}
        title={isAdded ? 'クリックして比較リストから削除' : 'クリックして比較リストに追加'}
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm">{rec.sake.name}</h4>
            <p className="text-xs text-gray-600">{rec.sake.brewery}</p>
          </div>
          <div className="ml-2 text-right">
            {isAdded ? (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>
        </div>

        {/* レコメンド情報 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${typeColors[rec.type]}`}>
              {typeLabels[rec.type]}
            </span>
            <span className="text-xs text-gray-500">
              好み度: {similarity}%
            </span>
          </div>
          
          <p className="text-xs text-gray-600">{rec.reason}</p>
          
          {/* 味覚情報 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>甘辛: {rec.sake.sweetness > 0 ? '甘' : rec.sake.sweetness < 0 ? '辛' : '中'}</span>
            <span>淡濃: {rec.sake.richness > 0 ? '濃' : rec.sake.richness < 0 ? '淡' : '中'}</span>
            <span>予測評価: ★{predictedRating}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">💡 あなたへのおすすめ</h3>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">レコメンド生成中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">💡 あなたへのおすすめ</h3>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // 作成中メッセージを表示（早期リターン）
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-bold mb-4">💡 あなたへのおすすめ</h3>
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
  );
  
  // 以下の元のコードは開発中のため実行されません
  
  // おすすめ機能が未起動の場合
  if (!isActivated) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-bold mb-4">💡 あなたへのおすすめ</h3>
        <div className="text-center">
          {!hasRecommendations ? (
            <>
              <p className="text-gray-600 mb-4">
                レコメンドを生成するには、好み分析が必要です
              </p>
              <p className="text-sm text-gray-500">
                お気に入りに3件以上登録してから再度お試しください
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                好み分析に基づいて、あなたにピッタリの日本酒をおすすめします
              </p>
              <button
                onClick={handleActivate}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                🎯 おすすめを表示
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // カテゴリ別にグループ化
  const groupedRecommendations = recommendations.reduce((groups, rec) => {
    if (!groups[rec.type]) {
      groups[rec.type] = [];
    }
    groups[rec.type].push(rec);
    return groups;
  }, {} as Record<string, SakeRecommendation[]>);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">💡 あなたへのおすすめ</h3>
        <button
          onClick={refresh}
          className="text-sm text-blue-600 hover:text-blue-800"
          title="レコメンドを更新"
        >
          🔄 更新
        </button>
      </div>

      {/* 気分選択 */}
      <div className="mb-6">
        <h4 className="text-sm font-bold mb-2">今日の気分は？</h4>
        <div className="grid grid-cols-2 gap-2">
          {moodOptions.map((mood) => (
            <button
              key={mood.key}
              onClick={() => handleMoodChange(mood.key)}
              className={`p-2 text-xs rounded-md text-left transition-colors ${
                selectedMood === mood.key
                  ? 'bg-blue-100 border border-blue-300 text-blue-800'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{mood.label}</div>
              <div className="text-gray-500">{mood.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* レコメンド結果 */}
      <div className="space-y-6">
        {/* 好みに近い */}
        {groupedRecommendations.similar && groupedRecommendations.similar.length > 0 && (
          <div>
            <h4 className="text-sm font-bold mb-3 text-blue-800">あなたにぴったり</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedRecommendations.similar.slice(0, 4).map(renderRecommendationCard)}
            </div>
          </div>
        )}

        {/* 新しい発見 */}
        {groupedRecommendations.explore && groupedRecommendations.explore.length > 0 && (
          <div>
            <h4 className="text-sm font-bold mb-3 text-green-800">新しい出会い</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedRecommendations.explore.slice(0, 2).map(renderRecommendationCard)}
            </div>
          </div>
        )}

        {/* 話題の銘柄 */}
        {groupedRecommendations.trending && groupedRecommendations.trending.length > 0 && (
          <div>
            <h4 className="text-sm font-bold mb-3 text-purple-800">みんなのお気に入り</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedRecommendations.trending.slice(0, 2).map(renderRecommendationCard)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        {recommendations.length}件のおすすめを表示中
      </div>
    </div>
  );
};