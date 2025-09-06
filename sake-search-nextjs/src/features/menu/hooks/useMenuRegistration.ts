'use client';

import { useCallback } from 'react';
import { useMenuContext } from '../contexts/MenuContext';
import { useMenuManagement } from './useMenuManagement';

/**
 * メニュー登録機能の統合フック
 * MenuContextとuseMenuManagementを統合し、相互依存を解決
 */
export const useMenuRegistration = () => {
  const menuContext = useMenuContext();
  const menuManagement = useMenuManagement();

  // 統合アクション（hook間でデータの受け渡しが必要な部分）
  const actions = {
    /**
     * 飲食店を追加（menuContextのデータを使用）
     */
    addRestaurant: useCallback(
      async (name: string, location: string): Promise<void> => {
        await menuManagement.handleAddRestaurant(
          name,
          location,
          menuContext.menuSakeData
        );
      },
      [menuManagement, menuContext.menuSakeData]
    ),

    /**
     * 保存済みメニューを読み込み（menuContextのコールバックを使用）
     */
    loadSavedMenu: useCallback(
      async (menuId: string): Promise<void> => {
        await menuManagement.handleLoadSavedMenu(
          menuId,
          menuContext.handleMenuItemsChange
        );
      },
      [menuManagement, menuContext.handleMenuItemsChange]
    ),

    /**
     * 飲食店にメニューを保存（menuContextのデータを使用）
     */
    saveToRestaurant: useCallback(async (): Promise<void> => {
      await menuManagement.handleSaveToRestaurant(
        menuContext.menuSakeData
      );
    }, [menuManagement, menuContext.menuSakeData]),
  };

  // メニュー入力関連の状態とアクション（MenuContextから取得）
  const inputState = {
    menuItems: menuContext.menuItems,
    menuSakeData: menuContext.menuSakeData,
    notFoundItems: menuContext.notFoundItems,
    isProcessing: menuContext.isProcessing,
    processingStatus: menuContext.processingStatus,
  };

  const inputActions = {
    handleMenuItemsAdd: menuContext.handleMenuItemsAdd,
    handleMenuItemsChange: menuContext.handleMenuItemsChange,
    handleProcessImage: menuContext.handleProcessImage,
    handleRemoveItem: menuContext.handleRemoveItem,
    removeItemByName: menuContext.removeItemByName,
  };

  // メニュー管理関連の状態とアクション
  const managementState = {
    user: menuManagement.user,
    isAuthLoading: menuManagement.isAuthLoading,
    selectedSavedMenu: menuManagement.selectedSavedMenu,
    selectedRestaurant: menuManagement.selectedRestaurant,
    groupedSavedMenusData: menuManagement.groupedSavedMenusData,
    loadingMenu: menuManagement.loadingMenu,
    savingToMenu: menuManagement.savingToMenu,
  };

  const managementActions = {
    setSelectedSavedMenu: menuManagement.setSelectedSavedMenu,
    setSelectedRestaurant: menuManagement.setSelectedRestaurant,
  };

  return {
    // 状態（分離を維持）
    inputState,
    managementState,
    
    // アクション（分離を維持）
    inputActions,
    managementActions,
    
    // 統合アクション（結合が必要な部分のみ）
    actions,
    
    // 後方互換性のため元のhookも公開（段階的移行用）
    _legacy: {
      menuContext,
      menuManagement,
    },
  };
};
