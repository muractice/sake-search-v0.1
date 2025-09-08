'use client';

import { SakeData } from '@/types/sake';
import { FavoriteButton } from '@/components/buttons/FavoriteButton';
import { RecordButton } from '@/components/buttons/RecordButton';

interface ComparisonCardProps {
  sake: SakeData;
  index: number;
  onRemove: (sake: SakeData) => void;
  onSelect: (sake: SakeData) => void;
}

/**
 * 比較パネル内の個別の日本酒カード
 */
export const ComparisonCard = ({
  sake,
  index,
  onRemove,
  onSelect
}: ComparisonCardProps) => {
  
  /**
   * 味覚指標をフォーマット
   */
  const formatTasteValue = (value: number, type: 'sweetness' | 'richness') => {
    if (type === 'sweetness') {
      return value > 0 
        ? `甘口 +${value.toFixed(1)}` 
        : `辛口 ${value.toFixed(1)}`;
    }
    return value > 0 
      ? `濃醇 +${value.toFixed(1)}` 
      : `淡麗 ${value.toFixed(1)}`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200 animate-fade-in hover:shadow-md transition-all duration-200">
      {/* ヘッダー部分 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 番号バッジ */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <h3 
              className="font-bold text-base cursor-pointer hover:text-blue-600 transition-colors text-gray-900"
              onClick={() => onSelect(sake)}
              title="クリックして詳細を表示"
            >
              {sake.name}
            </h3>
            <p className="text-sm text-gray-800 font-medium">{sake.brewery}</p>
          </div>
        </div>
        {/* 削除ボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(sake);
          }}
          className="text-red-500 hover:text-red-700 transition-colors text-xl"
          title="比較リストから削除"
        >
          ✕
        </button>
      </div>
      
      {/* 説明文 */}
      <div className="mb-3 p-3 bg-white/70 rounded-lg">
        <p className="text-sm text-gray-900 leading-relaxed font-medium">
          {sake.description || '説明がありません'}
        </p>
      </div>
      
      {/* 味覚指標 */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-800 font-semibold">甘辛:</span>
          <span className="font-bold text-gray-900">
            {formatTasteValue(sake.sweetness, 'sweetness')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-800 font-semibold">淡濃:</span>
          <span className="font-bold text-gray-900">
            {formatTasteValue(sake.richness, 'richness')}
          </span>
        </div>
      </div>
      
      {/* アクションボタン */}
      <div className="flex flex-col gap-2">
        <FavoriteButton 
          sake={sake}
          size="md"
          showLabel={true}
        />
        <RecordButton 
          sake={sake}
          className="w-full"
        />
      </div>
    </div>
  );
};