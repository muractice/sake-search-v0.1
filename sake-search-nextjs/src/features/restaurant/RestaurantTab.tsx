'use client';

import { useState } from 'react';
import { MenuRegistrationSection } from '@/features/restaurant/MenuRegistrationSection';
import { RestaurantRecommendations } from '@/features/recommendations/RestaurantRecommendations';
import { useMenuRegistration } from '@/features/menu/hooks/useMenuRegistration';
import { SakeData } from '@/types/sake';

interface RestaurantTabProps {
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  onSearch: (query: string) => Promise<SakeData | null>;
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
  onTabChange,
}: RestaurantTabProps) => {
  const [activeSegment, setActiveSegment] = useState<SegmentType>('menu');
  
  // RestaurantTab内でメニューデータを管理
  const menuRegistration = useMenuRegistration();
  const { inputState, inputActions, managementState, managementActions, actions } = menuRegistration;

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
          comparisonList={comparisonList}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onClearComparison={onClearComparison}
          onSelectSake={onSelectSake}
          onChartClick={onChartClick}
          inputState={inputState}
          inputActions={inputActions}
          managementState={managementState}
          managementActions={managementActions}
          actions={actions}
        />
      ) : (
        <RestaurantRecommendations
          restaurantMenuItems={inputState.menuItems}
          restaurantMenuSakeData={inputState.menuSakeData}
          onToggleComparison={onToggleComparison}
          isInComparison={isInComparison}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};