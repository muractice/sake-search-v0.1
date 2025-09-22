'use client';

import { MenuRegistrationSection } from '@/features/restaurant/MenuRegistrationSection';
import { useMenuRegistration } from '@/features/menu/hooks/useMenuRegistration';
import { useComparison } from '@/features/comparison/hooks/useComparison';
import { useSelection } from '@/features/search/hooks/useSelection';
import type { RestaurantMenu } from '@/types/restaurant';

interface RestaurantMenuManagementPanelProps {
  initialRestaurantMenus?: RestaurantMenu[];
}

export const RestaurantMenuManagementPanel = ({
  initialRestaurantMenus,
}: RestaurantMenuManagementPanelProps) => {
  const menuRegistration = useMenuRegistration({ initialRestaurantMenus });

  const {
    comparisonList,
    toggleComparison,
    isInComparison,
    clearComparison,
  } = useComparison();

  const { selectSake, handleChartClick } = useSelection();

  return (
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
  );
};
