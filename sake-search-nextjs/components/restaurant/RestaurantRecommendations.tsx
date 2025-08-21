'use client';

import { useState } from 'react';
import { SakeData } from '@/types/sake';

export type RestaurantRecommendationType = 'similarity' | 'pairing' | 'random';

interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

interface RestaurantRecommendationsProps {
  menuItems: string[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

export const RestaurantRecommendations = ({
  menuItems,
  onToggleComparison,
  isInComparison,
}: RestaurantRecommendationsProps) => {
  const [recommendationType, setRecommendationType] = useState<RestaurantRecommendationType>('similarity');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [pairingDishType, setPairingDishType] = useState('');

  // レコメンドを取得する関数
  const fetchRecommendations = async (type: RestaurantRecommendationType) => {
    if (menuItems.length === 0) {
      alert('メニューアイテムを登録してください');
      return;
    }

    setIsLoadingRecommendations(true);
    setShowRecommendations(true);

    try {
      const response = await fetch('/api/recommendations/restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          menuItems,
          dishType: type === 'pairing' ? pairingDishType : undefined,
          count: 10
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  if (menuItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">💡</span>
          飲食店向けレコメンド
        </h2>
        <p className="text-gray-500 text-center py-8">
          メニューを登録すると、レコメンド機能が利用できます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">💡</span>
        飲食店向けレコメンド
      </h2>
      
      <div className="space-y-4">
        {/* レコメンドタイプ選択 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setRecommendationType('similarity');
              fetchRecommendations('similarity');
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              recommendationType === 'similarity' && showRecommendations
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 お気に入りに近い順
          </button>
          <button
            onClick={() => {
              setRecommendationType('pairing');
              fetchRecommendations('pairing');
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              recommendationType === 'pairing' && showRecommendations
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍴 料理に合わせる
          </button>
          <button
            onClick={() => {
              setRecommendationType('random');
              fetchRecommendations('random');
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              recommendationType === 'random' && showRecommendations
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎲 おすすめガチャ
          </button>
        </div>
        
        {/* レコメンド結果表示 */}
        {showRecommendations && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3">
              {recommendationType === 'similarity' && '🎯 あなたの好みに近い順'}
              {recommendationType === 'pairing' && '🍴 料理とのペアリング'}
              {recommendationType === 'random' && '🎲 今日のおすすめ'}
            </h3>
            
            {recommendationType === 'pairing' && (
              <div className="mb-3">
                <select
                  value={pairingDishType}
                  onChange={(e) => {
                    setPairingDishType(e.target.value);
                    if (e.target.value) {
                      fetchRecommendations('pairing');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">料理を選択してください</option>
                  <option value="sashimi">刺身・お造り</option>
                  <option value="grilled">焼き物・炙り</option>
                  <option value="fried">揚げ物・天ぷら</option>
                  <option value="soup">汁物・鍋物</option>
                  <option value="dessert">デザート・甘味</option>
                  <option value="general">その他・おまかせ</option>
                </select>
              </div>
            )}
            
            <div className="space-y-2">
              {isLoadingRecommendations ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">レコメンドを生成中...</p>
                </div>
              ) : recommendations.length > 0 ? (
                <RecommendationList
                  recommendations={recommendations}
                  onToggleComparison={onToggleComparison}
                  isInComparison={isInComparison}
                />
              ) : (
                <p className="text-center text-gray-500 py-4">
                  レコメンドを表示するには、上のボタンから選択してください
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// レコメンドリストコンポーネント
interface RecommendationListProps {
  recommendations: RecommendationResult[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

const RecommendationList = ({
  recommendations,
  onToggleComparison,
  isInComparison,
}: RecommendationListProps) => {
  return (
    <>
      {recommendations.map((rec, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
            <div>
              <p className="font-semibold">{rec.sake.name}</p>
              <p className="text-xs text-gray-500">{rec.sake.brewery}</p>
              <p className="text-sm text-gray-600 mt-1">
                {rec.reason}
                {rec.similarityScore && ` (マッチ度: ${Math.round(rec.similarityScore * 100)}%)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isInComparison(rec.sake.id)) {
                onToggleComparison(rec.sake);
              }
            }}
            disabled={isInComparison(rec.sake.id)}
            className={`px-3 py-1 rounded-lg text-sm ${
              isInComparison(rec.sake.id)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isInComparison(rec.sake.id) ? '追加済み' : '比較に追加'}
          </button>
        </div>
      ))}
    </>
  );
};