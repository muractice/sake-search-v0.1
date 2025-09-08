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
  return (
    <div className="space-y-6">
      {/* メニュー登録セクション */}
      <MenuInputSection 
        onMenuItemsAdd={menuRegistration.inputActions.handleMenuItemsAdd}
        onProcessImage={menuRegistration.inputActions.handleProcessImage}
        isProcessing={menuRegistration.inputState.isProcessing}
        processingStatus={menuRegistration.inputState.processingStatus}
      />

      {/* メニュー管理セクション */}
      <MenuManagementSection
        auth={{
          user: menuRegistration.managementState.user,
          isAuthLoading: menuRegistration.managementState.isAuthLoading,
        }}
        menuData={{
          items: menuRegistration.inputState.menuItems,
          sakeData: menuRegistration.inputState.menuSakeData,
        }}
        state={{
          selectedSavedMenu: menuRegistration.managementState.selectedSavedMenu,
          selectedRestaurant: menuRegistration.managementState.selectedRestaurant,
          groupedSavedMenus: menuRegistration.managementState.groupedSavedMenusData,
          loadingMenu: menuRegistration.managementState.loadingMenu,
          savingToMenu: menuRegistration.managementState.savingToMenu,
          hasChanges: menuRegistration.managementState.hasChanges,
        }}
        actions={{
          setSelectedSavedMenu: menuRegistration.managementActions.setSelectedSavedMenu,
          setSelectedRestaurant: menuRegistration.managementActions.setSelectedRestaurant,
          onSaveToRestaurant: menuRegistration.actions.saveToRestaurant,
          onAddRestaurant: menuRegistration.actions.addRestaurant,
          onLoadSavedMenu: menuRegistration.actions.loadSavedMenu,
          onMenuItemsChange: menuRegistration.inputActions.handleMenuItemsChange,
        }}
      />

      {/* 登録済み日本酒リスト表示 */}
      {(menuRegistration.inputState.menuItems.length > 0) && (
        <MenuSakeListDisplay
          menuData={{
            menuSakeData: menuRegistration.inputState.menuSakeData,
            notFoundItems: menuRegistration.inputState.notFoundItems,
            selectedSavedMenu: menuRegistration.managementState.selectedSavedMenu,
            onRemoveItem: (item: string) => {
              menuRegistration.inputActions.removeItemByName(item);
            },
          }}
          comparison={{
            list: comparison.list,
            isInList: comparison.isInList,
            onToggle: comparison.onToggle,
          }}
        />
      )}

      {/* 比較チャートセクション */}
      <ComparisonChartSection
        comparison={{
          list: comparison.list,
          onToggle: comparison.onToggle,
          onClear: comparison.onClear,
        }}
        selection={{
          onSelectSake: selection.onSelectSake,
          onChartClick: selection.onChartClick,
        }}
      />
    </div>
  );
};
