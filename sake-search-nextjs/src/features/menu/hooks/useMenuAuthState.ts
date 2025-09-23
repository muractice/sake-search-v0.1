'use client';

// useMenuAuthState は Supabase 認証情報を公開し、サインアウト時にメニュー選択を初期化する

import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useSupabaseUser } from '@/features/auth/hooks/useSupabaseUser';
import * as menuStorage from '@/features/menu/utils/menuStorage';

interface MenuAuthState {
  user: User | null;
  isAuthLoading: boolean;
}

export const useMenuAuthState = (): MenuAuthState => {
  const { user, isLoading } = useSupabaseUser();

  // 未ログインになったタイミングでメニュー選択情報を破棄する
  useEffect(() => {
    if (!isLoading && !user) {
      menuStorage.clearSelectionState();
    }
  }, [isLoading, user]);

  return {
    user,
    isAuthLoading: isLoading,
  };
};
