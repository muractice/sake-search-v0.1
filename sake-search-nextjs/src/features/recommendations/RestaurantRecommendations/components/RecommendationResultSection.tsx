'use client';

import { RestaurantRecommendationType } from '../types';
import { RecommendationResult } from '../types';
import { RecommendationList } from './RecommendationList';
import { SakeData } from '@/types/sake';

interface RecommendationResultSectionProps {
  recommendationType: RestaurantRecommendationType;
  isLoadingRecommendations: boolean;
  requiresMoreFavorites: boolean;
  favoritesMessage: string;
  recommendations: RecommendationResult[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onTabChange?: (tab: string) => void;
}

export const RecommendationResultSection = ({
  recommendationType,
  isLoadingRecommendations,
  requiresMoreFavorites,
  favoritesMessage,
  recommendations,
  onToggleComparison,
  isInComparison,
  onTabChange,
}: RecommendationResultSectionProps) => {

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold mb-3">
        {recommendationType === 'similarity' && '🎯 あなたの好みに近い順'}
        {recommendationType === 'pairing' && '🍴 料理とのペアリング'}
      </h3>
      
      {recommendationType === 'pairing' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <span className="text-amber-600 mr-2">🚧</span>
            <p className="text-amber-800 font-semibold">この機能は現在開発中です</p>
          </div>
          <p className="text-sm text-amber-700">
            料理とのペアリング機能は近日公開予定です。もうしばらくお待ちください。
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        {isLoadingRecommendations ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">レコメンドを生成中...</p>
          </div>
        ) : requiresMoreFavorites ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 mb-4">{favoritesMessage}</p>
            {onTabChange && (
              <button
                onClick={() => onTabChange('search')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                「日本酒を調べる」タブで探す →
              </button>
            )}
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
  );
};