'use client';

import { SakeData } from '@/types/sake';

interface MenuSakeListDisplayProps {
  menuSakeData: SakeData[];
  notFoundItems: string[];
  selectedSavedMenu?: string;
  isInComparison: (sakeId: string) => boolean;
  onToggleComparison: (sake: SakeData) => void;
  onRemoveItem: (item: string) => void;
  comparisonList: SakeData[];
}

export const MenuSakeListDisplay = ({
  menuSakeData,
  notFoundItems,
  selectedSavedMenu,
  isInComparison,
  onToggleComparison,
  onRemoveItem,
  comparisonList
}: MenuSakeListDisplayProps) => {
  
  const handleBulkComparison = () => {
    // データありの日本酒のみを一括で比較リストに追加
    const sakesToAdd = menuSakeData.filter(sake => !isInComparison(sake.id));
    if (sakesToAdd.length === 0) {
      alert('すべての日本酒が既に比較リストに追加されています');
      return;
    }
    
    // 比較リストの空き枠数を計算
    const availableSlots = 10 - comparisonList.length;
    if (availableSlots === 0) {
      alert('比較リストは既に上限の10件に達しています');
      return;
    }
    
    // 追加可能な数まで追加
    const itemsToAdd = sakesToAdd.slice(0, availableSlots);
    itemsToAdd.forEach(sake => onToggleComparison(sake));
    
    if (sakesToAdd.length > availableSlots) {
      alert(`比較リストの上限により、${sakesToAdd.length}件中${itemsToAdd.length}件を追加しました（残り${sakesToAdd.length - itemsToAdd.length}件は追加されませんでした）`);
    } else {
      alert(`${itemsToAdd.length}件の日本酒を比較リストに追加しました`);
    }
  };

  const totalItems = menuSakeData.length + notFoundItems.length;

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-900 block mb-3">
          {totalItems}件の日本酒が登録されています
          {menuSakeData.length > 0 && ` (データあり: ${menuSakeData.length}件)`}
          {notFoundItems.length > 0 && ` (データなし: ${notFoundItems.length}件)`}
          {selectedSavedMenu && <span className="text-blue-600"> (保存済みメニュー選択中)</span>}
        </span>
        
        {/* スマホ対応: ボタンを下に配置 */}
        <div className="flex gap-2">
          <button
            onClick={handleBulkComparison}
            disabled={menuSakeData.length === 0}
            className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
          >
            一括比較
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* APIで見つかった日本酒 */}
        {menuSakeData.map((sake) => (
          <div
            key={sake.id}
            className="p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{sake.name}</p>
                <p className="text-xs text-gray-800 mt-1">{sake.brewery}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onToggleComparison(sake)}
                  className={`px-2 py-1 rounded text-xs ${
                    isInComparison(sake.id)
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isInComparison(sake.id) ? '追加済' : '比較'}
                </button>
                <button
                  onClick={() => onRemoveItem(sake.name)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* データが見つからなかった日本酒 */}
        {notFoundItems.map((item, index) => (
          <div
            key={`not-found-${index}`}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item}</p>
                <p className="text-xs text-red-700 mt-1">データなし</p>
              </div>
              <button
                onClick={() => onRemoveItem(item)}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};