'use client';

import { useState } from 'react';
import { MenuRegistrationSection } from '@/features/restaurant/MenuRegistrationSection';
import { RestaurantRecommendations } from '@/features/recommendations/RestaurantRecommendations';
import { useMenuRegistration } from '@/features/menu/hooks/useMenuRegistration';
import { useComparison } from '@/features/comparison/hooks/useComparison';
import { useSelection } from '@/features/search/hooks/useSelection';

interface RestaurantTabProps {
  onTabChange?: (tabId: string) => void;
}

type SegmentType = 'menu' | 'recommendations';

export const RestaurantTab = ({
  onTabChange,
}: RestaurantTabProps) => {
  const [activeSegment, setActiveSegment] = useState<SegmentType>('menu');
  
  // RestaurantTab内で全て管理
  const {
    comparisonList,
    toggleComparison,
    isInComparison,
    clearComparison,
  } = useComparison();
  
  const {
    selectSake,
    handleChartClick,
  } = useSelection();
  
  const menuRegistration = useMenuRegistration();
  const { inputState } = menuRegistration;

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
          comparison={{
            list: comparisonList,
            onToggle: toggleComparison,
            isInList: isInComparison,
            onClear: clearComparison,
          }}
          selection={{
            onSelectSake: selectSake,
            onChartClick: handleChartClick,
          }}
          menuRegistration={menuRegistration}
        />
      ) : (
        <RestaurantRecommendations
          restaurantMenuItems={inputState.menuItems}
          restaurantMenuSakeData={inputState.menuSakeData}
          onToggleComparison={toggleComparison}
          isInComparison={isInComparison}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};