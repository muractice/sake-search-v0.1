'use client';

import { SakeData } from '@/types/sake';
import { useMenuRegistration } from '@/features/menu/hooks/useMenuRegistration';
import { MenuInputSection } from '@/features/menu/MenuInputSection';
import { MenuManagementSection } from '@/features/menu/MenuManagementSection';
import { MenuSakeListDisplay } from '@/features/menu/MenuSakeListDisplay';
import { ComparisonChartSection } from '@/features/comparison/ComparisonChartSection';

interface ComparisonProps {
  list: SakeData[];
  onToggle: (sake: SakeData) => void;
  isInList: (sakeId: string) => boolean;
  onClear: () => void;
}

interface SelectionProps {
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
}

interface MenuRegistrationSectionProps {
  comparison: ComparisonProps;
  selection: SelectionProps;
  menuRegistration: ReturnType<typeof useMenuRegistration>;
}

export const MenuRegistrationSection = ({
  comparison,
  selection,
  menuRegistration,
}: MenuRegistrationSectionProps) => {
  const { inputState, inputActions, managementState, managementActions, actions } = menuRegistration;
  return (
    <div className="space-y-6">
      {/* メニュー登録セクション */}
      <MenuInputSection 
        onMenuItemsAdd={inputActions.handleMenuItemsAdd}
        onProcessImage={inputActions.handleProcessImage}
        isProcessing={inputState.isProcessing}
        processingStatus={inputState.processingStatus}
      />

      {/* メニュー管理セクション */}
      <MenuManagementSection
        user={managementState.user}
        isAuthLoading={managementState.isAuthLoading}
        menuItems={inputState.menuItems}
        menuSakeData={inputState.menuSakeData}
        selectedSavedMenu={managementState.selectedSavedMenu}
        setSelectedSavedMenu={managementActions.setSelectedSavedMenu}
        selectedRestaurant={managementState.selectedRestaurant}
        setSelectedRestaurant={managementActions.setSelectedRestaurant}
        onSaveToRestaurant={actions.saveToRestaurant}
        onAddRestaurant={actions.addRestaurant}
        onLoadSavedMenu={actions.loadSavedMenu}
        onMenuItemsChange={inputActions.handleMenuItemsChange}
        groupedSavedMenus={managementState.groupedSavedMenusData}
        loadingMenu={managementState.loadingMenu}
        savingToMenu={managementState.savingToMenu}
      />

      {/* 登録済み日本酒リスト表示 */}
      {(inputState.menuItems.length > 0) && (
        <MenuSakeListDisplay
          menuSakeData={inputState.menuSakeData}
          notFoundItems={inputState.notFoundItems}
          selectedSavedMenu={managementState.selectedSavedMenu}
          isInComparison={comparison.isInList}
          onToggleComparison={comparison.onToggle}
          onRemoveItem={inputActions.handleRemoveItem}
          comparisonList={comparison.list}
        />
      )}

      {/* 比較チャートセクション */}
      <ComparisonChartSection
        comparisonList={comparison.list}
        onToggleComparison={comparison.onToggle}
        onClearComparison={comparison.onClear}
        onSelectSake={selection.onSelectSake}
        onChartClick={selection.onChartClick}
      />
    </div>
  );
};