'use client';

import { SakeData } from '@/types/sake';
import { FavoriteButton } from '@/components/buttons/FavoriteButton';
import { RecordButton } from '@/components/buttons/RecordButton';
import { CHART_COLORS } from '@/components/charts/taste-chart/constants/chartColors';

interface SakeDetailCardProps {
  sake: SakeData;
  index: number;
  variant?: 'comparison' | 'chart-list';
  backgroundColor?: string;
  onSelect?: (sake: SakeData) => void;
  onRemove?: (sake: SakeData) => void;
  showRemoveButton?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  recordButtonLabel?: string;
}

/**
 * 汎用的な日本酒詳細カードコンポーネント
 * 比較パネルと味わいマップの日本酒一覧で共通利用
 */
export const SakeDetailCard = ({
  sake,
  index,
  variant = 'comparison',
  backgroundColor,
  onSelect,
  onRemove,
  showRemoveButton = true,
  showDescription = true,
  showActions = true,
  recordButtonLabel = '飲んだ'
}: SakeDetailCardProps) => {
  
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

  // バリアントに応じた背景色を決定
  const bgClass = variant === 'chart-list' 
    ? 'bg-white/60 backdrop-blur-sm'
    : 'bg-gradient-to-br from-blue-50 to-purple-50';

  // 番号バッジのスタイルを決定
  const getBadgeStyle = () => {
    if (variant === 'chart-list') {
      // chart-listの場合は必ずCHART_COLORSから色を取得
      const color = backgroundColor || CHART_COLORS.solidColors[index % CHART_COLORS.solidColors.length];
      return { backgroundColor: color };
    }
    // comparisonの場合はグラデーション
    return {
      background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(147, 51, 234))'
    };
  };

  return (
    <div className={`${bgClass} rounded-lg p-4 border border-purple-200 animate-fade-in hover:shadow-md transition-all duration-200 relative`}>
      {/* 削除ボタン（右上に配置） */}
      {showRemoveButton && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(sake);
          }}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-600 transition-colors text-2xl font-bold z-10"
          title="リストから削除"
        >
          ×
        </button>
      )}
      
      {/* ヘッダー部分 */}
      <div className="flex items-center gap-3 mb-3">
        {/* 番号バッジ（改善版） */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl border-2 border-white flex-shrink-0"
          style={{
            ...getBadgeStyle(),
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          }}
        >
          {index + 1}
        </div>
        <div className="flex-1 pr-6">
          <h3 
            className="font-bold text-base cursor-pointer hover:text-blue-600 transition-colors text-gray-900"
            onClick={() => onSelect?.(sake)}
            title="クリックして詳細を表示"
          >
            {sake.name}
          </h3>
          <p className="text-sm text-gray-800 font-medium">{sake.brewery}</p>
        </div>
      </div>
      
      {/* 説明文 */}
      {showDescription && sake.description && (
        <div className="mb-3 p-3 bg-white/70 rounded-lg">
          <p className="text-sm text-gray-900 leading-relaxed font-medium">
            {sake.description}
          </p>
        </div>
      )}
      
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
      {showActions && (
        <div className="flex flex-col gap-2">
          <FavoriteButton 
            sake={sake}
            size="md"
            showLabel={true}
          />
          <RecordButton 
            sake={sake}
            className="w-full"
            label={recordButtonLabel}
          />
        </div>
      )}
    </div>
  );
};