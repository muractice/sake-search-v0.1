// menuStorage はメニュー選択状態の sessionStorage への読み書きを一本化する
const STORAGE_KEYS = {
  targetMenuId: 'menu:targetMenuId',
  loadedMenuId: 'menu:loadedMenuId',
  hasUserSelected: 'menu:hasUserSelected',
} as const;

type SelectionState = {
  targetMenuId: string | null;
  loadedMenuId: string | null;
  hasUserSelected: boolean;
};

const isBrowser = () => typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

// SSR 実行時でも安全にメニュー選択状態を復元する
export function getSelectionState(): SelectionState {
  if (!isBrowser()) {
    return {
      targetMenuId: null,
      loadedMenuId: null,
      hasUserSelected: false,
    };
  }

  const targetMenuId = sessionStorage.getItem(STORAGE_KEYS.targetMenuId);
  const loadedMenuId = sessionStorage.getItem(STORAGE_KEYS.loadedMenuId);
  const hasUserSelected = sessionStorage.getItem(STORAGE_KEYS.hasUserSelected) === 'true';

  return {
    targetMenuId,
    loadedMenuId,
    hasUserSelected,
  };
}

// ユーザーが最後に操作した飲食店メニューIDを永続化する
export function setTargetMenuId(value: string) {
  if (!isBrowser()) return;
  sessionStorage.setItem(STORAGE_KEYS.targetMenuId, value);
}

export function clearTargetMenuId() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(STORAGE_KEYS.targetMenuId);
}

// UI のドロップダウンで選択した保存済みメニューIDを保持する
export function setLoadedMenuId(value: string) {
  if (!isBrowser()) return;
  sessionStorage.setItem(STORAGE_KEYS.loadedMenuId, value);
}

export function clearLoadedMenuId() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(STORAGE_KEYS.loadedMenuId);
}

// ユーザーが明示的にメニュー選択を行ったかどうかを記録する
export function setHasUserSelected(value: boolean) {
  if (!isBrowser()) return;
  if (value) {
    sessionStorage.setItem(STORAGE_KEYS.hasUserSelected, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.hasUserSelected);
  }
}

export function clearSelectionState() {
  if (!isBrowser()) return;
  clearTargetMenuId();
  clearLoadedMenuId();
  sessionStorage.removeItem(STORAGE_KEYS.hasUserSelected);
}
