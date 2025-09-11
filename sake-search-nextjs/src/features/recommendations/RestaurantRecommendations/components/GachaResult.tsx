'use client';

import { SakeData } from '@/types/sake';
import { RecommendationResult } from '../types';

interface GachaResultProps {
  selectedGachaItem: RecommendationResult;
  isInComparison: (sakeId: string) => boolean;
  onToggleComparison: (sake: SakeData) => void;
  onPlayAgain: () => void;
}

export const GachaResult = ({
  selectedGachaItem,
  isInComparison,
  onToggleComparison,
  onPlayAgain
}: GachaResultProps) => {
  return (
    <div className="mt-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-400">
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{selectedGachaItem.sake.name}</p>
          <p className="text-lg text-gray-800 mt-2">{selectedGachaItem.sake.brewery}</p>
          <p className="text-sm text-gray-700 mt-3">{selectedGachaItem.reason}</p>
          <button
            onClick={() => {
              if (!isInComparison(selectedGachaItem.sake.id)) {
                onToggleComparison(selectedGachaItem.sake);
              }
            }}
            disabled={isInComparison(selectedGachaItem.sake.id)}
            className={`mt-4 px-6 py-2 rounded-lg text-sm font-bold ${
              isInComparison(selectedGachaItem.sake.id)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            {isInComparison(selectedGachaItem.sake.id) ? '追加済み' : '比較に追加'}
          </button>
        </div>
      </div>
      <button
        onClick={onPlayAgain}
        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-bold"
      >
        🎲 もう一回ガチャを回す！
      </button>
    </div>
  );
};