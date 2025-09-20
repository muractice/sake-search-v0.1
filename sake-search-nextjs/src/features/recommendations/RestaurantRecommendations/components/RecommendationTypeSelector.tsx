'use client';

import { RestaurantRecommendationType } from '../types';

interface RecommendationTypeSelectorProps {
  recommendationType: RestaurantRecommendationType;
  showRecommendations: boolean;
  onTypeSelect: (type: RestaurantRecommendationType) => void;
}

export const RecommendationTypeSelector = ({
  recommendationType,
  showRecommendations,
  onTypeSelect,
}: RecommendationTypeSelectorProps) => {
  return (
    <>
      <button
        onClick={() => onTypeSelect('similarity')}
        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
          recommendationType === 'similarity' && showRecommendations
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        🎯 お気に入りに近い順
      </button>
      <button
        onClick={() => onTypeSelect('pairing')}
        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
          recommendationType === 'pairing' && showRecommendations
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        🍴 料理に合わせる
      </button>
      <button
        onClick={() => onTypeSelect('random')}
        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
          recommendationType === 'random' && showRecommendations
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        🎲 おすすめガチャ
      </button>
    </>
  );
};