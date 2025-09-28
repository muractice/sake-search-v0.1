'use client';

// useMenuRegistration は MenuContext と管理ロジックを結合し、UI から扱いやすい形に整える

import { useCallback, useEffect, useMemo } from 'react';
import { useMenuContext } from '../contexts/MenuContext';
import { useMenuManagement } from './useMenuManagement';

/**
 * メニュー登録機能の統合フック
 * MenuContextとuseMenuManagementを統合し、相互依存を解決
 */
export const useMenuRegistration = (opts?: { initialRestaurantMenus?: import('@/types/restaurant').RestaurantMenu[] }) => {
  const menuContext = useMenuContext();
  const menuManagement = useMenuManagement({ initialRestaurantMenus: opts?.initialRestaurantMenus });

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

  const deleteRestaurant = useCallback(async (menuId: string): Promise<void> => {
    await menuManagement.handleDeleteRestaurant(menuId);
    menuContext.clearMenuData();
  }, [menuManagement, menuContext]);

  // 統合アクション（hook間でデータの受け渡しが必要な部分）をメモ化
  const actions = useMemo(() => ({
    addRestaurant,
    loadSavedMenu,
    saveToRestaurant,
    deleteRestaurant,
  }), [addRestaurant, loadSavedMenu, saveToRestaurant, deleteRestaurant]);

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

  const managementState = {
    user: menuManagement.user,
    isAuthLoading: menuManagement.isAuthLoading,
    loadedMenuId: menuManagement.loadedMenuId,
    targetMenuId: menuManagement.targetMenuId,
    groupedSavedMenusData: menuManagement.groupedSavedMenusData,
    menuOrMenuItemsLoading: menuManagement.menuOrMenuItemsLoading,
    savingToMenu: menuManagement.savingToMenu,
    hasChanges: hasChangesResult,
    notification: menuManagement.notification,
  };

  const managementActions = {
    setLoadedMenuId: menuManagement.setLoadedMenuId,
    setTargetMenuId: menuManagement.setTargetMenuId,
    onDeleteRestaurant: actions.deleteRestaurant,
    notify: menuManagement.notify,
    clearNotification: menuManagement.clearNotification,
  };

  // リロード時の初期化処理
  // リロード時、カタログの準備が整ったら前回選択したメニューを復元する
  useEffect(() => {
    let isSubscribed = true;
    
    const initializeMenu = async () => {
      // loadedMenuIdが存在し、かつメニューデータが空で、ローディング中でない場合
      if (managementState.loadedMenuId && 
          inputState.menuSakeData.length === 0 && 
          !managementState.menuOrMenuItemsLoading &&
          isSubscribed) {

        // 選択されたメニューの情報を取得
        const selectedMenu = managementState.groupedSavedMenusData[managementState.loadedMenuId];

        // 0件のメニューの場合はロードしない（無限ループ防止）
        if (selectedMenu && selectedMenu.count > 0) {
          console.log('リロード時の自動メニュー復元:', managementState.loadedMenuId);
          console.log('現在のmenuSakeData:', inputState.menuSakeData);
          console.log('menuOrMenuItemsLoading:', managementState.menuOrMenuItemsLoading);
          // 既存のloadSavedMenuアクションを呼び出して完全復元
          await actions.loadSavedMenu(managementState.loadedMenuId);
        }
      }
    };
    
    initializeMenu();
    
    // クリーンアップ関数で重複実行を防ぐ
    return () => {
      isSubscribed = false;
    };
  }, [actions, inputState.menuSakeData, managementState.menuOrMenuItemsLoading, managementState.loadedMenuId, managementState.groupedSavedMenusData]);

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
