'use client';

import { SakeData } from '@/types/sake';
import { FavoriteButton } from '@/components/buttons/FavoriteButton';
import { RecordButton } from '@/components/buttons/RecordButton';

interface ComparisonPanelProps {
  comparisonList: SakeData[];
  onRemove: (sake: SakeData) => void;
  onClear: () => void;
  onSelectSake: (sake: SakeData) => void;
}

export default function ComparisonPanel({
  comparisonList,
  onRemove,
  onClear,
  onSelectSake
}: ComparisonPanelProps) {

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-slide-down">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          日本酒比較
        </h2>
        <div className="flex gap-3">
          {comparisonList.length > 0 && (
            <button
              onClick={onClear}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      <div>
        <div>
          <p className="text-sm text-gray-600 mb-3">
            最大10つまでの日本酒を選択して比較できます（{comparisonList.length}/10）
          </p>
          
          {comparisonList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonList.map((sake, index) => (
                <div
                  key={sake.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200 animate-fade-in hover:shadow-md transition-all duration-200"
                >
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
                  
                  {/* 特徴 */}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>比較する日本酒を選択してください</p>
              <p className="text-sm mt-2">検索結果から「比較に追加」ボタンをクリック</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}