'use client';

import { SakeData } from '@/types/sake';
import { RecommendationResult } from '../types';

interface RecommendationListProps {
  recommendations: RecommendationResult[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
}

export const RecommendationList = ({
  recommendations,
  onToggleComparison,
  isInComparison,
}: RecommendationListProps) => {
  return (
    <>
      {recommendations.map((rec, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
            <div>
              <p className="font-semibold text-gray-900">{rec.sake.name}</p>
              <p className="text-xs text-gray-700">{rec.sake.brewery}</p>
              <p className="text-sm text-gray-800 mt-1">
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