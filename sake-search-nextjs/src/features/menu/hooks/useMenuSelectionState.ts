'use client';

// useMenuSelectionState はメニュー選択のローカル状態と sessionStorage を同期させる

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import * as menuStorage from '@/features/menu/utils/menuStorage';

interface UseMenuSelectionStateOptions {
  user: User | null;
  isAuthLoading: boolean;
}

interface MenuSelectionState {
  targetMenuId: string;
  loadedMenuId: string;
  hasUserSelected: boolean;
  setTargetMenuId: (id: string) => void;
  setLoadedMenuId: (id: string) => void;
  clearSelection: () => void;
}

export const useMenuSelectionState = (
  { user, isAuthLoading }: UseMenuSelectionStateOptions
): MenuSelectionState => {
  const stored = menuStorage.getSelectionState();
  if (process.env.NODE_ENV === 'development' && (stored.targetMenuId || stored.loadedMenuId || stored.hasUserSelected)) {
    console.log('[useMenuSelectionState] init', stored);
  }

  const [targetMenuId, setTargetMenuIdState] = useState<string>(stored.targetMenuId ?? '');
  const [loadedMenuId, setLoadedMenuIdState] = useState<string>(stored.loadedMenuId ?? '');
  const [hasUserSelected, setHasUserSelected] = useState<boolean>(stored.hasUserSelected);

  // ユーザーがメニュー選択を行ったかを記録し、再利用可否を判断する
  const updateHasUserSelected = useCallback((value: boolean) => {
    setHasUserSelected(value);
    menuStorage.setHasUserSelected(value);
  }, []);

  // 現在選択中の飲食店IDを保存し、ユーザー操作であることを記録する
  const setTargetMenuId = useCallback((id: string) => {
    setTargetMenuIdState((prev) => {
      if (process.env.NODE_ENV === 'development' && prev !== id) {
        console.log('[useMenuSelectionState] setTargetMenuId', { prev, next: id });
      }
      return id;
    });
    if (id) {
      menuStorage.setTargetMenuId(id);
      updateHasUserSelected(true);
    } else {
      menuStorage.clearTargetMenuId();
    }
  }, [updateHasUserSelected]);

  // 保存済みメニューのドロップダウン選択を保持し、再読込時に復元できるようにする
  const setLoadedMenuId = useCallback((id: string) => {
    setLoadedMenuIdState((prev) => {
      if (process.env.NODE_ENV === 'development' && prev !== id) {
        console.log('[useMenuSelectionState] setLoadedMenuId', { prev, next: id });
      }
      return id;
    });
    if (id) {
      menuStorage.setLoadedMenuId(id);
      updateHasUserSelected(true);
    } else {
      menuStorage.clearLoadedMenuId();
    }
  }, [updateHasUserSelected]);

  // ローカルとストレージの選択状態をまとめて初期化する（削除やログアウト後に使用）
  const clearSelection = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useMenuSelectionState] clearSelection');
    }
    setTargetMenuIdState('');
    setLoadedMenuIdState('');
    updateHasUserSelected(false);
    menuStorage.clearSelectionState();
  }, [updateHasUserSelected]);

  // 認証状態が未ログインに変わった際に選択状態をクリアする
  useEffect(() => {
    if (!isAuthLoading && !user) {
      clearSelection();
    }
  }, [clearSelection, isAuthLoading, user]);

  return {
    targetMenuId,
    loadedMenuId,
    hasUserSelected,
    setTargetMenuId,
    setLoadedMenuId,
    clearSelection,
  };
};
