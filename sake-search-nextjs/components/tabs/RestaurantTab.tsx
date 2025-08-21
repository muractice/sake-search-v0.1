'use client';

import { useState, useEffect } from 'react';
import { MenuRegistrationSection } from '@/components/restaurant/MenuRegistrationSection';
import { RestaurantRecommendations } from '@/components/restaurant/RestaurantRecommendations';
import { SakeData } from '@/types/sake';

interface RestaurantTabProps {
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  onSearch: (query: string) => Promise<SakeData | null>;
  menuItems: string[];
  onMenuItemsChange: (items: string[]) => void;
  onTabChange?: (tabId: string) => void;
}

type SegmentType = 'registration' | 'recommendations';

export const RestaurantTab = ({
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  onSearch,
  menuItems,
  onMenuItemsChange,
  onTabChange,
}: RestaurantTabProps) => {
  const [activeSegment, setActiveSegment] = useState<SegmentType>('registration');
  const [menuSakeData, setMenuSakeData] = useState<SakeData[]>([]);
  const [notFoundItems, setNotFoundItems] = useState<string[]>([]);
  const [isLoadingMenuData, setIsLoadingMenuData] = useState(false);

  // メニューアイテムが変更されたら日本酒データを取得
  useEffect(() => {
    const fetchMenuSakeData = async () => {
      if (menuItems.length === 0) {
        setMenuSakeData([]);
        setNotFoundItems([]);
        setIsLoadingMenuData(false);
        return;
      }
      
      setIsLoadingMenuData(true);
      const sakeDataList: SakeData[] = [];
      const notFoundList: string[] = [];
      
      // 短時間で処理を完了させるため、並列処理に変更
      const promises = menuItems.map(async (sakeName) => {
        try {
          const sakeData = await onSearch(sakeName);
          return { sakeName, sakeData };
        } catch (error) {
          console.log(`日本酒「${sakeName}」のデータ取得に失敗:`, error);
          return { sakeName, sakeData: null };
        }
      });
      
      const results = await Promise.all(promises);
      
      for (const { sakeName, sakeData } of results) {
        if (sakeData) {
          sakeDataList.push(sakeData);
        } else {
          notFoundList.push(sakeName);
        }
      }
      
      setMenuSakeData(sakeDataList);
      setNotFoundItems(notFoundList);
      setIsLoadingMenuData(false);
    };

    // debounce効果を付与して、連続更新を回避
    const timer = setTimeout(fetchMenuSakeData, 300);
    return () => clearTimeout(timer);
  }, [menuItems, onSearch]);


  return (
    <div className="space-y-6">
      {/* セグメントコントロール */}
      <div className="bg-white rounded-lg shadow-md p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSegment('registration')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSegment === 'registration'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>📝</span>
              メニュー登録・比較
            </span>
          </button>
          <button
            onClick={() => setActiveSegment('recommendations')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSegment === 'recommendations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>💡</span>
              おすすめ
            </span>
          </button>
        </div>
      </div>

      {/* コンテンツ表示 */}
      {activeSegment === 'registration' ? (
        <MenuRegistrationSection
          menuItems={menuItems}
          onMenuItemsChange={onMenuItemsChange}
          menuSakeData={menuSakeData}
          notFoundItems={notFoundItems}
          comparisonList={comparisonList}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onClearComparison={onClearComparison}
          onSelectSake={onSelectSake}
          onChartClick={onChartClick}
        />
      ) : (
        <RestaurantRecommendations
          menuItems={menuItems}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};