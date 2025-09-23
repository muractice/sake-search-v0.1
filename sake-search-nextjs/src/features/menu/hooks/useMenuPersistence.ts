'use client';

// useMenuPersistence はメニューの CRUD と保存済み状態の追跡を一手に担う

import { useCallback, useState } from 'react';
import {
  addMultipleSakesToMenuAction,
  createRestaurantAction,
  deleteRestaurantAction,
  updateMenuSakesAction,
} from '@/app/actions/restaurant';
import type { RestaurantMenu, RestaurantMenuFormData } from '@/types/restaurant';
import { isConflictResponse, isRestaurantMenu } from '@/types/restaurant';
import type { SakeData } from '@/types/sake';

export type MenuNotification = {
  type: 'success' | 'error' | 'info';
  message: string;
};

interface UseMenuPersistenceOptions {
  refreshMenus: () => Promise<RestaurantMenu[]>;
  setTargetMenuId: (id: string) => void;
  setLoadedMenuId: (id: string) => void;
  clearSelection: () => void;
  notify: (notification: MenuNotification) => void;
}

interface UseMenuPersistenceReturn {
  savingToMenu: boolean;
  lastSavedSakeIds: string[];
  addRestaurant: (
    input: RestaurantMenuFormData,
    menuSakeData: SakeData[]
  ) => Promise<void>;
  saveMenu: (menuId: string, menuSakeData: SakeData[]) => Promise<void>;
  deleteMenu: (menuId: string) => Promise<void>;
  setLastSavedSnapshot: (sakeIds: string[]) => void;
  hasChanges: (menuId: string, currentSakes: SakeData[]) => boolean;
}

export const useMenuPersistence = ({
  refreshMenus,
  setTargetMenuId,
  setLoadedMenuId,
  clearSelection,
  notify,
}: UseMenuPersistenceOptions): UseMenuPersistenceReturn => {
  const [savingToMenu, setSavingToMenu] = useState(false);
  const [lastSavedSakeIds, setLastSavedSakeIds] = useState<string[]>([]);

  // UI が変更有無を判断できるよう、保存済みの状態を記録する
  const setLastSavedSnapshot = useCallback((sakeIds: string[]) => {
    setLastSavedSakeIds(sakeIds);
  }, []);

  // 新しい飲食店メニューを作成し、必要であれば現在の日本酒リストを登録する
  const addRestaurant = useCallback(
    async (input: RestaurantMenuFormData, menuSakeData: SakeData[]) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMenuPersistence] addRestaurant start', {
            input,
            menuSakeCount: menuSakeData.length,
          });
        }
        const result = await createRestaurantAction(input);

        if (isConflictResponse(result)) {
          const refreshedMenus = await refreshMenus();
          const existing = refreshedMenus.find((menu) =>
            menu.restaurant_name.toLowerCase() === input.restaurant_name.toLowerCase() &&
            menu.registration_date === input.registration_date
          );
          if (existing) {
            setTargetMenuId(existing.id);
            setLoadedMenuId(existing.id);
          }
          notify({ type: 'error', message: result.message });
          return;
        }

        if (isRestaurantMenu(result)) {
          await refreshMenus();
          setTargetMenuId(result.id);
          setLoadedMenuId(result.id);

          if (menuSakeData.length > 0) {
            try {
              const payload = menuSakeData.map((sake) => ({
                sake_id: sake.id,
                brand_id: sake.brandId ?? null,
                is_available: true,
                menu_notes: null,
              }));
              await addMultipleSakesToMenuAction(result.id, payload);
              await refreshMenus();
              setLastSavedSnapshot(menuSakeData.map((sake) => sake.id));
              notify({
                type: 'success',
                message: `メニュー「${input.restaurant_name}」を作成し、${menuSakeData.length}件の日本酒を保存しました。`,
              });
            } catch (error) {
              console.error('Error saving menu to new restaurant:', error);
              notify({
                type: 'error',
                message: `メニュー「${input.restaurant_name}」は作成されましたが、日本酒の保存に失敗しました。再度保存ボタンをクリックしてください。`,
              });
            }
          } else {
            notify({
              type: 'info',
              message: `メニュー「${input.restaurant_name}」を作成しました。日本酒を追加してから保存ボタンをクリックしてください。`,
            });
            setLastSavedSnapshot([]);
          }
        }
      } catch (error) {
        console.error('[useMenuPersistence] addRestaurant error:', error);
        notify({
          type: 'error',
          message: 'メニューの追加に失敗しました。しばらく経ってから再度お試しください。',
        });
      }
    },
    [refreshMenus, setTargetMenuId, setLoadedMenuId, setLastSavedSnapshot, notify]
  );

  // 選択中メニューの日本酒リストをアップサートし、完了後に一覧を更新する
  const saveMenu = useCallback(
    async (menuId: string, menuSakeData: SakeData[]) => {
      if (!menuId) {
        notify({ type: 'error', message: 'メニューを選択してください' });
        return;
      }

      setSavingToMenu(true);
      try {
        const payload = menuSakeData.map((sake) => ({
          sake_id: sake.id,
          brand_id: sake.brandId ?? null,
          is_available: true,
          menu_notes: null,
        }));

        await updateMenuSakesAction(menuId, payload);
        setLastSavedSnapshot(menuSakeData.map((sake) => sake.id));
        notify({
          type: 'success',
          message: `メニューを更新しました（${payload.length}件の日本酒）`,
        });
        await refreshMenus();
      } catch (error) {
        console.error('Error updating restaurant menu:', error);
        notify({
          type: 'error',
          message: error instanceof Error ? error.message : 'メニューの更新に失敗しました',
        });
      } finally {
        setSavingToMenu(false);
      }
    },
    [refreshMenus, setLastSavedSnapshot, notify]
  );

  // メニューを完全に削除し、選択状態もクリアして UI をリセットする
  const deleteMenu = useCallback(
    async (menuId: string) => {
      if (!menuId) return;
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMenuPersistence] deleteRestaurant start', { menuId });
        }
        await deleteRestaurantAction(menuId);
        clearSelection();
        setLastSavedSnapshot([]);
        await refreshMenus();
        notify({ type: 'success', message: 'メニューを削除しました' });
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        notify({ type: 'error', message: 'メニューの削除に失敗しました' });
      }
    },
    [clearSelection, refreshMenus, setLastSavedSnapshot, notify]
  );

  // 作業中の日本酒リストが最後に保存したものと違うかを判定する
  const hasChanges = useCallback(
    (menuId: string, currentSakes: SakeData[]) => {
      if (!menuId) return false;
      if (process.env.NODE_ENV === 'development') {
        console.log('[useMenuPersistence] hasChanges check', {
          menuId,
          currentIds: currentSakes.map((sake) => sake.id),
          lastSaved: lastSavedSakeIds,
        });
      }
      const currentIds = currentSakes.map((sake) => sake.id).sort();
      const savedIds = [...lastSavedSakeIds].sort();

      if (currentIds.length !== savedIds.length) {
        return true;
      }

      return !currentIds.every((id, index) => id === savedIds[index]);
    },
    [lastSavedSakeIds]
  );

  return {
    savingToMenu,
    lastSavedSakeIds,
    addRestaurant,
    saveMenu,
    deleteMenu,
    setLastSavedSnapshot,
    hasChanges,
  };
};
