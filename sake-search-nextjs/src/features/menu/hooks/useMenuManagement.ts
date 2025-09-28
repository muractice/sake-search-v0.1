'use client';

// useMenuManagement は複数のサブフックを束ね、UI が利用しやすい形でメニュー機能を提供する

import { useCallback, useEffect, useState } from 'react';
import type { RestaurantMenu, RestaurantMenuFormData } from '@/types/restaurant';
import type { SakeData } from '@/types/sake';
import { useMenuAuthState } from './useMenuAuthState';
import { useMenuSelectionState } from './useMenuSelectionState';
import { useMenuCatalog } from './useMenuCatalog';
import { useMenuPersistence, type MenuNotification } from './useMenuPersistence';
import { getMenuSakesAction } from '@/app/actions/restaurant';
import { useMenuItemsLoader } from './useMenuItemsLoader';

interface UseMenuManagementOptions {
  initialRestaurantMenus?: RestaurantMenu[];
}

export const useMenuManagement = (opts?: UseMenuManagementOptions) => {
  const authState = useMenuAuthState();
  const [notification, setNotification] = useState<MenuNotification | null>(null);

  const notify = useCallback((note: MenuNotification) => {
    setNotification(note);
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);
  const {
    targetMenuId,
    loadedMenuId,
    setTargetMenuId,
    setLoadedMenuId,
    clearSelection,
  } = useMenuSelectionState(authState);
  const {
    restaurantMenus,
    menuOptionMap,
    isLoading: menuLoading,
    refresh,
  } = useMenuCatalog({
    user: authState.user,
    initialMenus: opts?.initialRestaurantMenus ?? [],
  });

  const {
    savingToMenu,
    addRestaurant,
    saveMenu,
    deleteMenu,
    setLastSavedSnapshot,
    hasChanges,
    lastSavedSakeIds,
  } = useMenuPersistence({
    refreshMenus: refresh,
    setTargetMenuId,
    setLoadedMenuId,
    clearSelection,
    notify,
  });

  const { loadingMenuItems, loadMenuItems } = useMenuItemsLoader({ setLastSavedSnapshot });

  // 選択中IDがカタログに存在しない場合は選択状態を初期化する
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (authState.isAuthLoading) {
      if (isDev) console.log('[useMenuManagement] reconcile skipped (auth loading)');
      return;
    }

    if (!authState.user) {
      if (isDev) console.log('[useMenuManagement] reconcile skipped (no user)');
      return;
    }

    if (isDev) {
      console.log('[useMenuManagement] reconcile selection', {
        menuLoading,
        restaurantCount: restaurantMenus.length,
        loadedMenuId,
      });
    }
    if (menuLoading) {
      return;
    }

    if (!loadedMenuId) {
      setLastSavedSnapshot([]);
      return;
    }

    if (restaurantMenus.length === 0) {
      if (isDev) console.log('[useMenuManagement] reconcile skipped (catalog empty)');
      return;
    }

    const exists = restaurantMenus.some((menu) => menu.id === loadedMenuId);

    if (!exists) {
      if (isDev) console.warn('[useMenuManagement] loaded menu missing. Clearing selection');
      clearSelection();
      setLastSavedSnapshot([]);
    }
  }, [authState.isAuthLoading, authState.user, menuLoading, restaurantMenus, loadedMenuId, clearSelection, setLastSavedSnapshot]);

  useEffect(() => {
    if (menuLoading || loadingMenuItems) return;
    if (!loadedMenuId) return;
    if (lastSavedSakeIds.length > 0) return;

    let active = true;
    (async () => {
      try {
        const ids = await getMenuSakesAction(loadedMenuId);
        if (!active) return;
        if (ids && ids.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useMenuManagement] fetched snapshot for menu', loadedMenuId, ids);
          }
          setLastSavedSnapshot(ids);
        }
      } catch (error) {
        console.error('[useMenuManagement] failed to hydrate snapshot', error);
      }
    })();

    return () => {
      active = false;
    };
  }, [menuLoading, loadingMenuItems, loadedMenuId, lastSavedSakeIds.length, setLastSavedSnapshot]);

  const fetchMenus = useCallback(async () => {
    return refresh();
  }, [refresh]);

  // UI から渡された入力値・日本酒データを元にメニューを新規作成する
  const handleAddRestaurant = useCallback(
    async (
      newRestaurantName: string,
      newRestaurantLocation: string,
      registrationDate: string,
      menuSakeData: SakeData[]
    ) => {
      clearNotification();
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuManagement] handleAddRestaurant invoked');
      }
      const input: RestaurantMenuFormData = {
        restaurant_name: newRestaurantName.trim(),
        registration_date: registrationDate,
        location: newRestaurantLocation.trim() || undefined,
      };

      await addRestaurant(input, menuSakeData);
    },
    [addRestaurant, clearNotification]
  );

  // 現在選択中のメニューを更新する（未選択の場合は警告済）
  const handleSaveToRestaurant = useCallback(
    async (menuSakeData: SakeData[]) => {
      clearNotification();
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuManagement] handleSaveToRestaurant invoked', { targetMenuId });
      }
      await saveMenu(targetMenuId, menuSakeData);
    },
    [clearNotification, saveMenu, targetMenuId]
  );

  // 保存済みメニューを読み込み、MenuContext を更新して復元させる
  const handleLoadSavedMenu = useCallback(
    async (menuId: string, onMenuDataUpdate: (items: string[]) => Promise<void>) => {
      clearNotification();
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuManagement] handleLoadSavedMenu invoked', { menuId });
      }
      await loadMenuItems(menuId, onMenuDataUpdate);
    },
    [clearNotification, loadMenuItems]
  );

  // 指定メニューを削除し、選択状態やスナップショットをリセットする
  const handleDeleteRestaurant = useCallback(
    async (menuId: string) => {
      clearNotification();
      await deleteMenu(menuId);
    },
    [clearNotification, deleteMenu]
  );

  const hasMenuChanges = useCallback(
    (currentSakes: SakeData[]) => {
      if (menuLoading || loadingMenuItems) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMenuManagement] hasMenuChanges guarded', {
            menuLoading,
            loadingMenuItems,
          });
        }
        return false;
      }
      if (!loadedMenuId) {
        return false;
      }
      const result = hasChanges(loadedMenuId, currentSakes);
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuManagement] hasMenuChanges result', {
          loadedMenuId,
          currentIds: currentSakes.map((sake) => sake.id),
          result,
        });
      }
      return result;
    },
    [menuLoading, loadingMenuItems, hasChanges, loadedMenuId]
  );

  return {
    user: authState.user,
    isAuthLoading: authState.isAuthLoading,
    restaurants: restaurantMenus,
    targetMenuId,
    setTargetMenuId,
    loadedMenuId,
    setLoadedMenuId,
    savingToMenu,
    menuOrMenuItemsLoading: loadingMenuItems || menuLoading,
    groupedSavedMenusData: menuOptionMap,
    notification,
    notify,
    fetchRestaurants: fetchMenus,
    fetchSavedMenus: fetchMenus,
    handleAddRestaurant,
    handleSaveToRestaurant,
    handleLoadSavedMenu,
    handleDeleteRestaurant,
    hasChanges: hasMenuChanges,
    clearNotification,
  };
};
