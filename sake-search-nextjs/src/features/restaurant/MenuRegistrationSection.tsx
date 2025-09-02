'use client';

import { SakeData } from '@/types/sake';
import { useMenuRegistration } from '@/features/menu/hooks/useMenuRegistration';
import { MenuInputSection } from '@/features/menu/MenuInputSection';
import { MenuManagementSection } from '@/features/menu/MenuManagementSection';
import { MenuSakeListDisplay } from '@/features/menu/MenuSakeListDisplay';
import { ComparisonChartSection } from '@/features/comparison/ComparisonChartSection';

interface MenuRegistrationSectionProps {
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  // メニュー管理用のprops
  inputState: ReturnType<typeof useMenuRegistration>['inputState'];
  inputActions: ReturnType<typeof useMenuRegistration>['inputActions'];
  managementState: ReturnType<typeof useMenuRegistration>['managementState'];
  managementActions: ReturnType<typeof useMenuRegistration>['managementActions'];
  actions: ReturnType<typeof useMenuRegistration>['actions'];
}

export const MenuRegistrationSection = ({
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  inputState,
  inputActions,
  managementState,
  managementActions,
  actions,
}: MenuRegistrationSectionProps) => {
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
          isInComparison={isInComparison}
          onToggleComparison={onToggleComparison}
          onRemoveItem={inputActions.handleRemoveItem}
          comparisonList={comparisonList}
        />
      )}

      {/* 比較チャートセクション */}
      <ComparisonChartSection
        comparisonList={comparisonList}
        onToggleComparison={onToggleComparison}
        onClearComparison={onClearComparison}
        onSelectSake={onSelectSake}
        onChartClick={onChartClick}
      />
    </div>
  );
};