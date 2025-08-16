'use client';

import { SakeData } from '@/types/sake';

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {comparisonList.map((sake, index) => (
                <div
                  key={sake.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 border border-purple-200 animate-fade-in cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
                  onClick={() => onSelectSake(sake)}
                  title="クリックして詳細を表示"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(sake);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{sake.name}</h3>
                  <p className="text-xs text-gray-600">{sake.brewery}</p>
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