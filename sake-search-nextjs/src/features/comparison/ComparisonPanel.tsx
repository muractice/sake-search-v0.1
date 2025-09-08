'use client';

import { SakeData } from '@/types/sake';
import { ComparisonCard } from './components/ComparisonCard';
import { getComparisonProgressText } from './utils/comparisonHelpers';

interface ComparisonPanelProps {
  comparisonList: SakeData[];
  onRemove: (sake: SakeData) => void;
  onClear: () => void;
  onSelectSake: (sake: SakeData) => void;
}

/**
 * 比較パネルのヘッダーコンポーネント（内部コンポーネント）
 */
const ComparisonHeader = ({ 
  count, 
  onClear 
}: { 
  count: number; 
  onClear: () => void;
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        日本酒比較
      </h2>
      <div className="flex gap-3">
        {count > 0 && (
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            クリア
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 比較リストが空の時の表示（内部コンポーネント）
 */
const ComparisonEmptyState = () => {
  return (
    <div className="text-center py-8 text-gray-400">
      <p>比較する日本酒を選択してください</p>
      <p className="text-sm mt-2">検索結果から「比較に追加」ボタンをクリック</p>
    </div>
  );
};

/**
 * 比較パネルのメインコンポーネント
 */
export default function ComparisonPanel({
  comparisonList,
  onRemove,
  onClear,
  onSelectSake
}: ComparisonPanelProps) {

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-slide-down">
      <ComparisonHeader 
        count={comparisonList.length} 
        onClear={onClear} 
      />

      <div>
        <div>
          {/* 進捗表示 */}
          <p className="text-sm text-gray-600 mb-3">
            {getComparisonProgressText(comparisonList.length)}
          </p>
          
          {/* 比較リストまたは空状態 */}
          {comparisonList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonList.map((sake, index) => (
                <ComparisonCard
                  key={sake.id}
                  sake={sake}
                  index={index}
                  onRemove={onRemove}
                  onSelect={onSelectSake}
                />
              ))}
            </div>
          ) : (
            <ComparisonEmptyState />
          )}
        </div>
      </div>
    </div>
  );
}