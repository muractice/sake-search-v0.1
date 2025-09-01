'use client';

import { SakeData } from '@/types/sake';
import { useMenuInput } from '@/features/menu/hooks/useMenuInput';
import { useMenuManagement } from '@/features/menu/hooks/useMenuManagement';
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
}

export const MenuRegistrationSection = ({
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
}: MenuRegistrationSectionProps) => {
  // カスタムフックを使用してロジックを分離
  const menuInput = useMenuInput();
  const menuManagement = useMenuManagement();
  
  console.log('MenuRegistrationSection: handleProcessImage関数の型:', typeof menuInput.handleProcessImage);

  const handleAddRestaurant = async (name: string, location: string) => {
    await menuManagement.handleAddRestaurant(name, location, menuInput.menuSakeData);
  };

  const handleLoadSavedMenu = async (menuId: string) => {
    await menuManagement.handleLoadSavedMenu(menuId, menuInput.handleMenuItemsChange);
  };

  const handleSaveToRestaurant = async () => {
    await menuManagement.handleSaveToRestaurant(menuInput.menuSakeData);
  };

  return (
    <div className="space-y-6">
      {/* メニュー登録セクション */}
      <MenuInputSection 
        onMenuItemsAdd={menuInput.handleMenuItemsAdd}
        onProcessImage={menuInput.handleProcessImage}
        isProcessing={menuInput.isProcessing}
        processingStatus={menuInput.processingStatus}
      />

      {/* メニュー管理セクション */}
      <MenuManagementSection
        user={menuManagement.user}
        isAuthLoading={menuManagement.isAuthLoading}
        menuItems={menuInput.menuItems}
        menuSakeData={menuInput.menuSakeData}
        selectedSavedMenu={menuManagement.selectedSavedMenu}
        setSelectedSavedMenu={menuManagement.setSelectedSavedMenu}
        selectedRestaurant={menuManagement.selectedRestaurant}
        setSelectedRestaurant={menuManagement.setSelectedRestaurant}
        onSaveToRestaurant={handleSaveToRestaurant}
        onAddRestaurant={handleAddRestaurant}
        onLoadSavedMenu={handleLoadSavedMenu}
        onMenuItemsChange={menuInput.handleMenuItemsChange}
        groupedSavedMenus={menuManagement.groupedSavedMenusData}
        loadingMenu={menuManagement.loadingMenu}
        savingToMenu={menuManagement.savingToMenu}
      />

      {/* 登録済み日本酒リスト表示 */}
      {(menuInput.menuItems.length > 0) && (
        <MenuSakeListDisplay
          menuSakeData={menuInput.menuSakeData}
          notFoundItems={menuInput.notFoundItems}
          selectedSavedMenu={menuManagement.selectedSavedMenu}
          isInComparison={isInComparison}
          onToggleComparison={onToggleComparison}
          onRemoveItem={menuInput.handleRemoveItem}
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