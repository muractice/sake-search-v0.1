'use client';

// useMenuLoader はメニュー詳細を取得し、保存済みスナップショットを更新する

import { useCallback, useState } from 'react';
import { getMenuSakesAction, getRestaurantWithSakesAction } from '@/app/actions/restaurant';

interface UseMenuLoaderOptions {
  setLastSavedSnapshot: (sakeIds: string[]) => void;
}

interface UseMenuLoaderReturn {
  loadingMenu: boolean;
  loadMenu: (
    menuId: string,
    onMenuDataUpdate: (items: string[]) => Promise<void>
  ) => Promise<void>;
}

export const useMenuLoader = ({ setLastSavedSnapshot }: UseMenuLoaderOptions): UseMenuLoaderReturn => {
  const [loadingMenu, setLoadingMenu] = useState(false);

  // メニュー詳細と日本酒IDを取得し、名前リストを呼び出し元に渡して加工してもらう
  const loadMenu = useCallback(async (menuId: string, onMenuDataUpdate: (items: string[]) => Promise<void>) => {
    if (!menuId) return;

    setLoadingMenu(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuLoader] loadMenu start', { menuId });
      }
      const menuWithSakes = await getRestaurantWithSakesAction(menuId);

      const sakeNames: string[] = [];
      for (const item of menuWithSakes) {
        if (item.sake_name) {
          sakeNames.push(item.sake_name);
        } else if (item.sake_id) {
          sakeNames.push(item.sake_id);
        }
      }

      await onMenuDataUpdate(sakeNames);
      const currentSakeIds = await getMenuSakesAction(menuId);
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuLoader] setLastSavedSnapshot', { menuId, currentSakeIds });
      }
      setLastSavedSnapshot(currentSakeIds ?? []);
    } catch (error) {
      console.error('Error loading saved menu:', error);
      alert('保存済みメニューの読み込みに失敗しました');
    } finally {
      setLoadingMenu(false);
    }
  }, [setLastSavedSnapshot]);

  return {
    loadingMenu,
    loadMenu,
  };
};
