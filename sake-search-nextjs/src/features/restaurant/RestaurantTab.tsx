'use client';

import { useState } from 'react';
import { MenuRegistrationSection } from '@/features/restaurant/MenuRegistrationSection';
import { RestaurantRecommendations } from '@/features/recommendations/RestaurantRecommendations';
import { useMenuRegistration } from '@/features/menu/hooks/useMenuRegistration';
import type { RestaurantMenu } from '@/types/restaurant';
import { useSelection } from '@/features/search/hooks/useSelection';
import { SakeData } from '@/types/sake';

interface RestaurantTabProps {
  initialRestaurantMenus?: RestaurantMenu[];
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onTabChange?: (tabId: string) => void;
}

type SegmentType = 'menu' | 'recommendations';

export const RestaurantTab = ({
  initialRestaurantMenus,
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onTabChange,
}: RestaurantTabProps) => {
  const [activeSegment, setActiveSegment] = useState<SegmentType>('menu');
  
  const {
    selectSake,
    handleChartClick,
  } = useSelection();
  
  const menuRegistration = useMenuRegistration({ initialRestaurantMenus });

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
            onToggle: onToggleComparison,
            isInList: isInComparison,
            onClear: onClearComparison,
          }}
          selection={{
            onSelectSake: selectSake,
            onChartClick: handleChartClick,
          }}
          menuRegistration={menuRegistration}
        />
      ) : (
        <RestaurantRecommendations
          restaurantMenuItems={menuRegistration.inputState.menuItems}
          restaurantMenuSakeData={menuRegistration.inputState.menuSakeData}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};
