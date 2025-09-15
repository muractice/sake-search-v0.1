'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useMenuContext } from '../contexts/MenuContext';
import { useMenuManagement } from './useMenuManagement';

/**
 * メニュー登録機能の統合フック
 * MenuContextとuseMenuManagementを統合し、相互依存を解決
 */
export const useMenuRegistration = () => {
  const menuContext = useMenuContext();
  const menuManagement = useMenuManagement();

  // 各アクションを安定化
  const addRestaurant = useCallback(
    async (name: string, location: string, registrationDate: string): Promise<void> => {
      await menuManagement.handleAddRestaurant(
        name,
        location,
        registrationDate,
        menuContext.menuSakeData
      );
    },
    [menuManagement, menuContext]
  );

  const loadSavedMenu = useCallback(
    async (menuId: string): Promise<void> => {
      console.log('[loadSavedMenu] 開始:', menuId);
      // メニューをクリアしてから新しいメニューを読み込む
      menuContext.clearMenuData();
      
      await menuManagement.handleLoadSavedMenu(
        menuId,
        async (items: string[]) => {
          console.log('[loadSavedMenu] handleMenuItemsAdd呼び出し - items:', items);
          // fromImageProcessing=falseで呼び出して新しいメニューを追加
          // handleMenuItemsAdd内部で冪等性が保証されているため、そのまま呼び出し
          await menuContext.handleMenuItemsAdd(items, false);
        }
      );
      console.log('[loadSavedMenu] 完了');
    },
    [menuManagement, menuContext]
  );

  const saveToRestaurant = useCallback(async (): Promise<void> => {
    await menuManagement.handleSaveToRestaurant(
      menuContext.menuSakeData
    );
  }, [menuManagement, menuContext.menuSakeData]);

  // 統合アクション（hook間でデータの受け渡しが必要な部分）をメモ化
  const actions = useMemo(() => ({
    addRestaurant,
    loadSavedMenu,
    saveToRestaurant,
  }), [addRestaurant, loadSavedMenu, saveToRestaurant]);

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
    clearMenuData: menuContext.clearMenuData,
  };

  // メニュー管理関連の状態とアクション
  const hasChangesResult = menuManagement.hasChanges(menuContext.menuSakeData);
  console.log('=== useMenuRegistration デバッグ ===');
  console.log('menuManagement.hasChanges:', menuManagement.hasChanges);
  console.log('menuContext.menuSakeData:', menuContext.menuSakeData?.map(s => s.id));
  console.log('hasChangesResult:', hasChangesResult);
  console.log('=== useMenuRegistration デバッグ終了 ===');
  
  const managementState = {
    user: menuManagement.user,
    isAuthLoading: menuManagement.isAuthLoading,
    selectedSavedMenu: menuManagement.selectedSavedMenu,
    selectedRestaurant: menuManagement.selectedRestaurant,
    groupedSavedMenusData: menuManagement.groupedSavedMenusData,
    loadingMenu: menuManagement.loadingMenu,
    savingToMenu: menuManagement.savingToMenu,
    hasChanges: hasChangesResult,
  };

  const managementActions = {
    setSelectedSavedMenu: menuManagement.setSelectedSavedMenu,
    setSelectedRestaurant: menuManagement.setSelectedRestaurant,
  };

  // リロード時の初期化処理
  useEffect(() => {
    let isSubscribed = true;
    
    const initializeMenu = async () => {
      // selectedSavedMenuが存在し、かつメニューデータが空で、ローディング中でない場合
      if (managementState.selectedSavedMenu && 
          inputState.menuSakeData.length === 0 && 
          !managementState.loadingMenu &&
          isSubscribed) {
        
        console.log('リロード時の自動メニュー復元:', managementState.selectedSavedMenu);
        console.log('現在のmenuSakeData:', inputState.menuSakeData);
        console.log('loadingMenu:', managementState.loadingMenu);
        // 既存のloadSavedMenuアクションを呼び出して完全復元
        await actions.loadSavedMenu(managementState.selectedSavedMenu);
      }
    };
    
    initializeMenu();
    
    // クリーンアップ関数で重複実行を防ぐ
    return () => {
      isSubscribed = false;
    };
  }, [actions, inputState.menuSakeData, managementState.loadingMenu, managementState.selectedSavedMenu]);

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
