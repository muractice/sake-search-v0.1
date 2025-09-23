'use client';

// useMenuCatalog は飲食店メニュー一覧を取得し、ドロップダウン表示用の形に整形する

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RestaurantMenu } from '@/types/restaurant';
import { loadRestaurantMenusAction } from '@/app/actions/restaurant';
import type { User } from '@supabase/supabase-js';

interface UseMenuCatalogOptions {
  user: User | null;
  initialMenus?: RestaurantMenu[];
}

interface MenuCatalogState {
  restaurantMenus: RestaurantMenu[];
  menuOptionMap: Record<string, {
    restaurant_menu_id: string;
    restaurant_name: string;
    location?: string;
    registration_date: string;
    restaurant_created_at: string;
    count: number;
  }>;
  isLoading: boolean;
  refresh: () => Promise<RestaurantMenu[]>;
}

// 生データのメニュー配列をセレクト表示に必要な情報へ変換する
const buildMenuOptionMap = (menus: RestaurantMenu[]) =>
  menus.reduce<Record<string, {
    restaurant_menu_id: string;
    restaurant_name: string;
    location?: string;
    registration_date: string;
    restaurant_created_at: string;
    count: number;
  }>>((acc, menu) => {
    acc[menu.id] = {
      restaurant_menu_id: menu.id,
      restaurant_name: menu.restaurant_name,
      location: menu.location,
      registration_date: menu.registration_date,
      restaurant_created_at: menu.created_at,
      count: menu.sake_count ?? 0,
    };
    return acc;
  }, {});

export const useMenuCatalog = ({ user, initialMenus = [] }: UseMenuCatalogOptions): MenuCatalogState => {
  const [restaurantMenus, setRestaurantMenus] = useState<RestaurantMenu[]>(initialMenus);
  const [isLoading, setIsLoading] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  // Server Action から最新のメニュー一覧を取得し、未ログイン時は状態を初期化する
  const refresh = useCallback(async () => {
    if (!user) {
      setRestaurantMenus([]);
      return [];
    }

    if (isDev) {
      console.log('[useMenuCatalog] refresh start', { userId: user.id });
    }
    setIsLoading(true);
    try {
      const data = await loadRestaurantMenusAction();
      const normalized = data ?? [];
      setRestaurantMenus(normalized);
      if (isDev) {
        console.log('[useMenuCatalog] refresh success', { count: normalized.length });
      }
      return normalized;
    } catch (error) {
      setRestaurantMenus([]);
      if (isDev) {
        console.error('[useMenuCatalog] refresh error', error);
      }
      throw error;
    } finally {
      setIsLoading(false);
      if (isDev) {
        console.log('[useMenuCatalog] refresh end');
      }
    }
  }, [isDev, user]);

  // 認証のライフサイクルに合わせて一覧をロード／クリアする
  useEffect(() => {
    if (isDev) {
      console.log('[useMenuCatalog] effect', {
        userId: user?.id,
        initialMenusCount: initialMenus.length,
      });
    }
    if (user) {
      refresh();
    } else {
      setRestaurantMenus([]);
    }
  }, [isDev, refresh, user, initialMenus.length]);

  const menuOptionMap = useMemo(() => buildMenuOptionMap(restaurantMenus), [restaurantMenus]);

  return {
    restaurantMenus,
    menuOptionMap,
    isLoading,
    refresh,
  };
};
