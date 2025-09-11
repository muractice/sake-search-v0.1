'use client';

import { SakeData } from '@/types/sake';
import { PurchaseButton } from '@/components/buttons/PurchaseButton';

interface FavoriteCardProps {
  sake: SakeData;
  index: number;
  onSelectSake: (sake: SakeData) => void;
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onRemove: (sakeId: string) => void;
}

export const FavoriteCard = ({
  sake,
  index,
  onSelectSake,
  onToggleComparison,
  isInComparison,
  onRemove,
}: FavoriteCardProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200 animate-fade-in hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <h3 
              className="font-bold text-base cursor-pointer hover:text-blue-600 transition-colors text-gray-900"
              onClick={() => onSelectSake(sake)}
              title="クリックして詳細を表示"
            >
              {sake.name}
            </h3>
            <p className="text-sm text-gray-800 font-medium">{sake.brewery}</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm(`「${sake.name}」をお気に入りから削除しますか？`)) {
              onRemove(sake.id);
            }
          }}
          className="text-red-500 hover:text-red-700 transition-colors text-xl"
          title="お気に入りから削除"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-3 p-3 bg-white/70 rounded-lg">
        <p className="text-sm text-gray-900 leading-relaxed font-medium">
          {sake.description || '説明がありません'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-800 font-semibold">甘辛:</span>
          <span className="font-bold text-gray-900">
            {sake.sweetness > 0 ? `甘口 +${sake.sweetness.toFixed(1)}` : `辛口 ${sake.sweetness.toFixed(1)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-800 font-semibold">淡濃:</span>
          <span className="font-bold text-gray-900">
            {sake.richness > 0 ? `濃醇 +${sake.richness.toFixed(1)}` : `淡麗 ${sake.richness.toFixed(1)}`}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <PurchaseButton 
          sake={sake}
          className="flex-1 text-sm"
          variant="full"
        />
        <button
          onClick={() => onToggleComparison(sake)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors font-medium
            ${isInComparison(sake.id)
              ? 'bg-gray-300 text-gray-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isInComparison(sake.id) ? '追加済' : '比較'}
        </button>
      </div>
    </div>
  );
};