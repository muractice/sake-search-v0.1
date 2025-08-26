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
  restaurantMenuItems: string[];
  onRestaurantMenuItemsChange: (items: string[]) => void;
  onTabChange?: (tabId: string) => void;
}

type SegmentType = 'menu' | 'recommendations';

export const RestaurantTab = ({
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  onSearch,
  restaurantMenuItems,
  onRestaurantMenuItemsChange,
  onTabChange,
}: RestaurantTabProps) => {
  const [activeSegment, setActiveSegment] = useState<SegmentType>('menu');
  const [restaurantMenuSakeData, setRestaurantMenuSakeData] = useState<SakeData[]>([]);
  const [menuItemsNotFound, setMenuItemsNotFound] = useState<string[]>([]);

  // 飲食店のメニューアイテムが変更されたら日本酒データを取得
  useEffect(() => {
    const fetchRestaurantMenuSakeData = async () => {
      if (restaurantMenuItems.length === 0) {
        setRestaurantMenuSakeData([]);
        setMenuItemsNotFound([]);
        return;
      }
      const sakeDataList: SakeData[] = [];
      const notFoundList: string[] = [];
      
      // 短時間で処理を完了させるため、並列処理に変更
      const promises = restaurantMenuItems.map(async (sakeName) => {
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
      
      setRestaurantMenuSakeData(sakeDataList);
      setMenuItemsNotFound(notFoundList);
    };

    // debounce効果を付与して、連続更新を回避
    const timer = setTimeout(fetchRestaurantMenuSakeData, 300);
    return () => clearTimeout(timer);
  }, [restaurantMenuItems, onSearch]);


  return (
    <div className="space-y-6">
      {/* セグメントコントロール */}
      <div className="bg-white rounded-lg shadow-md p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSegment('menu')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSegment === 'menu'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🍽️</span>
              メニュー
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
      {activeSegment === 'menu' ? (
        <MenuRegistrationSection
          menuItems={restaurantMenuItems}
          onMenuItemsChange={onRestaurantMenuItemsChange}
          menuSakeData={restaurantMenuSakeData}
          notFoundItems={menuItemsNotFound}
          comparisonList={comparisonList}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onClearComparison={onClearComparison}
          onSelectSake={onSelectSake}
          onChartClick={onChartClick}
          onSearch={onSearch}
        />
      ) : (
        <RestaurantRecommendations
          restaurantMenuItems={restaurantMenuItems}
          restaurantMenuSakeData={restaurantMenuSakeData}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};