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
          loadedMenuId: menuRegistration.managementState.loadedMenuId,
          targetMenuId: menuRegistration.managementState.targetMenuId,
          groupedSavedMenus: menuRegistration.managementState.groupedSavedMenusData,
          menuOrMenuItemsLoading: menuRegistration.managementState.menuOrMenuItemsLoading,
          savingToMenu: menuRegistration.managementState.savingToMenu,
          hasChanges: menuRegistration.managementState.hasChanges,
          notification: menuRegistration.managementState.notification,
        }}
        actions={{
          setLoadedMenuId: menuRegistration.managementActions.setLoadedMenuId,
          setTargetMenuId: menuRegistration.managementActions.setTargetMenuId,
          onSaveToRestaurant: menuRegistration.actions.saveToRestaurant,
          onAddRestaurant: menuRegistration.actions.addRestaurant,
          onLoadSavedMenu: menuRegistration.actions.loadSavedMenu,
          onDeleteRestaurant: menuRegistration.managementActions.onDeleteRestaurant,
          onMenuItemsChange: menuRegistration.inputActions.handleMenuItemsChange,
          notify: menuRegistration.managementActions.notify,
          clearNotification: menuRegistration.managementActions.clearNotification,
          onMenuContextReset: () => {
            comparison.onClear();
          },
        }}
      />

      {/* 登録済み日本酒リスト表示 */}
      {(menuRegistration.inputState.menuItems.length > 0) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            メニューの日本酒一覧
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({menuRegistration.inputState.menuItems.length}件)
            </span>
          </h2>
          <MenuSakeListDisplay
            menuData={{
              menuSakeData: menuRegistration.inputState.menuSakeData,
              notFoundItems: menuRegistration.inputState.notFoundItems,
              selectedSavedMenu: menuRegistration.managementState.loadedMenuId,
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
        </div>
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
