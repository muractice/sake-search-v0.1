'use client';

import { useCallback } from 'react';
import { useMenuInput } from './useMenuInput';
import { useMenuManagement } from './useMenuManagement';

/**
 * メニュー登録機能の統合フック
 * useMenuInputとuseMenuManagementを統合し、相互依存を解決
 */
export const useMenuRegistration = () => {
  const menuInput = useMenuInput();
  const menuManagement = useMenuManagement();

  // 統合アクション（hook間でデータの受け渡しが必要な部分）
  const actions = {
    /**
     * 飲食店を追加（menuInputのデータを使用）
     */
    addRestaurant: useCallback(
      async (name: string, location: string): Promise<void> => {
        await menuManagement.handleAddRestaurant(
          name,
          location,
          menuInput.menuSakeData
        );
      },
      [menuManagement, menuInput.menuSakeData]
    ),

    /**
     * 保存済みメニューを読み込み（menuInputのコールバックを使用）
     */
    loadSavedMenu: useCallback(
      async (menuId: string): Promise<void> => {
        await menuManagement.handleLoadSavedMenu(
          menuId,
          menuInput.handleMenuItemsChange
        );
      },
      [menuManagement, menuInput.handleMenuItemsChange]
    ),

    /**
     * 飲食店にメニューを保存（menuInputのデータを使用）
     */
    saveToRestaurant: useCallback(async (): Promise<void> => {
      await menuManagement.handleSaveToRestaurant(
        menuInput.menuSakeData
      );
    }, [menuManagement, menuInput.menuSakeData]),
  };

  // メニュー入力関連の状態とアクション
  const inputState = {
    menuItems: menuInput.menuItems,
    menuSakeData: menuInput.menuSakeData,
    notFoundItems: menuInput.notFoundItems,
    isProcessing: menuInput.isProcessing,
    processingStatus: menuInput.processingStatus,
  };

  const inputActions = {
    handleMenuItemsAdd: menuInput.handleMenuItemsAdd,
    handleMenuItemsChange: menuInput.handleMenuItemsChange,
    handleProcessImage: menuInput.handleProcessImage,
    handleRemoveItem: menuInput.handleRemoveItem,
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
      menuInput,
      menuManagement,
    },
  };
};