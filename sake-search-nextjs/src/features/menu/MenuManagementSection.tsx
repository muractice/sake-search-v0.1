'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SakeData } from '@/types/sake';
import { formatMenuOptionLabel, MenuDisplayInfo } from './utils';

interface AuthState {
  user: User | null;
  isAuthLoading: boolean;
}

interface MenuData {
  items: string[];
  sakeData: SakeData[];
}

interface MenuManagementState {
  selectedSavedMenu: string;
  selectedRestaurant: string;
  groupedSavedMenus: Record<string, {
    restaurant_menu_id: string;
    restaurant_name: string;
    location?: string;
    registration_date: string;
    restaurant_created_at: string;
    count: number;
  }>;
  loadingMenu: boolean;
  savingToMenu: boolean;
  hasChanges?: boolean;
}

interface MenuManagementActions {
  setSelectedSavedMenu: (id: string) => void;
  setSelectedRestaurant: (id: string) => void;
  onSaveToRestaurant: () => Promise<void>;
  onAddRestaurant: (name: string, location: string, registrationDate: string) => Promise<void>;
  onLoadSavedMenu: (menuId: string) => Promise<void>;
  onMenuItemsChange: (items: string[]) => void;
  onDeleteRestaurant?: (menuId: string) => Promise<void>;
}

interface MenuManagementSectionProps {
  auth: AuthState;
  menuData: MenuData;
  state: MenuManagementState;
  actions: MenuManagementActions;
}

export const MenuManagementSection = ({
  auth,
  menuData,
  state,
  actions
}: MenuManagementSectionProps) => {
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantLocation, setNewRestaurantLocation] = useState('');
  const [newRestaurantRegistrationDate, setNewRestaurantRegistrationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim()) {
      alert('飲食店名を入力してください');
      return;
    }

    try {
      await actions.onAddRestaurant(newRestaurantName.trim(), newRestaurantLocation.trim(), newRestaurantRegistrationDate);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
      const today = new Date();
      setNewRestaurantRegistrationDate(today.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  const handleDeleteSelectedMenu = async () => {
    if (!state.selectedSavedMenu || !actions.onDeleteRestaurant) return;

    const selectedMenu = state.groupedSavedMenus[state.selectedSavedMenu];
    const label = selectedMenu?.restaurant_name ?? '選択中のメニュー';

    const confirmed = confirm(`「${label}」のメニューを削除しますか？\n\nこの操作は取り消せません。`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await actions.onDeleteRestaurant(state.selectedSavedMenu);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
      const today = new Date();
      setNewRestaurantRegistrationDate(today.toISOString().split('T')[0]);
      alert('メニューを削除しました');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('メニューの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleMenuSelectionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    
    // 既存メニューから別のメニューへの切り替え
    if (newValue && state.selectedSavedMenu && newValue !== state.selectedSavedMenu) {
      const shouldProceed = confirm(
        '現在表示中のメニューをクリアして、選択したメニューを読み込みます。\n\n' +
        '続行しますか？'
      );
      
      if (!shouldProceed) {
        // キャンセルされた場合は元に戻す
        e.target.value = state.selectedSavedMenu;
        return;
      }
      
      // 現在のメニューをクリア
      actions.onMenuItemsChange([]);
    }
    
    // 新しいメニューから既存メニューへの切り替え
    if (!state.selectedSavedMenu && menuData.items.length > 0 && newValue) {
      const shouldProceed = confirm(
        '現在の新しいメニューは保存されていません。\n' +
        '切り替えると入力した内容が失われます。\n\n' +
        '続行しますか？'
      );
      
      if (!shouldProceed) {
        // キャンセルされた場合は元に戻す
        e.target.value = state.selectedSavedMenu;
        return;
      }
      
      // 現在のメニューをクリア
      actions.onMenuItemsChange([]);
    }
    
    if (newValue) {
      // 既存メニューを選択した場合
      actions.setSelectedSavedMenu(newValue);
      actions.setSelectedRestaurant(newValue);
      
      // 選択したメニューの情報を取得
      const selectedMenu = state.groupedSavedMenus[newValue];
      // 0件のメニューの場合はロードしない（無限ループ防止）
      if (selectedMenu && selectedMenu.count > 0) {
        await actions.onLoadSavedMenu(newValue);
      }
      
      // フォームをクリア
      setNewRestaurantName('');
      setNewRestaurantLocation('');
      const today = new Date();
      setNewRestaurantRegistrationDate(today.toISOString().split('T')[0]);
    } else {
      // 「新しいメニュー」を選択した場合
      if (state.selectedSavedMenu && menuData.items.length > 0) {
        const shouldClear = confirm(
          '現在のメニューをクリアしますか？\n\n' +
          '「OK」: クリアする\n' +
          '「キャンセル」: そのまま残す'
        );
        
        if (shouldClear) {
          actions.onMenuItemsChange([]);
        }
      }
      
      actions.setSelectedSavedMenu('');
      actions.setSelectedRestaurant('');
      // フォームをクリア
      setNewRestaurantName('');
      setNewRestaurantLocation('');
      const today = new Date();
      setNewRestaurantRegistrationDate(today.toISOString().split('T')[0]);
    }
  };

  // 認証チェック
  if (auth.isAuthLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
          <span className="mr-2">🍽️</span>
          メニュー管理
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">ログインするとメニューの保存機能を利用できます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
        <span className="mr-2">🍽️</span>
        メニュー管理
      </h2>

      {/* メニュー選択セクション */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            メニュー一覧:
          </label>
        </div>
        
        {/* 保存済みメニュー選択 */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={state.selectedSavedMenu}
              onChange={handleMenuSelectionChange}
              disabled={state.loadingMenu}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900"
            >
              <option value="">新しいメニュー</option>
              {Object.values(state.groupedSavedMenus).map((menu) => {
                const displayInfo: MenuDisplayInfo = {
                  name: menu.restaurant_name,
                  location: menu.location,
                  sakeCount: menu.count,
                  registrationDate: menu.registration_date,
                  createdAt: menu.restaurant_created_at
                };
                return (
                  <option key={menu.restaurant_menu_id} value={menu.restaurant_menu_id}>
                    {formatMenuOptionLabel(displayInfo)}
                  </option>
                );
              })}
            </select>
          </div>
          {state.loadingMenu && (
            <div className="text-blue-600 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              メニューを読み込み中...
            </div>
          )}
          {state.selectedSavedMenu && actions.onDeleteRestaurant && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDeleteSelectedMenu}
                disabled={isDeleting || state.loadingMenu || state.savingToMenu}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '削除中...' : '🗑 メニューを削除'}
              </button>
            </div>
          )}
        </div>

        {/* 新しいメニューが選択されている時にフォームを表示 */}
        {!state.selectedSavedMenu && (
          <div className="space-y-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="text"
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              placeholder="飲食店名 *"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                登録日 *
              </label>
              <input
                type="date"
                value={newRestaurantRegistrationDate}
                onChange={(e) => setNewRestaurantRegistrationDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            <input
              type="text"
              value={newRestaurantLocation}
              onChange={(e) => setNewRestaurantLocation(e.target.value)}
              placeholder="場所・住所（任意）"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddRestaurant}
                disabled={!newRestaurantName.trim() || menuData.sakeData.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                onClick={() => {
                  // キャンセル時は既存メニューの最初のものを選択
                  const menuValues = Object.values(state.groupedSavedMenus);
                  if (menuValues && menuValues.length > 0) {
                    const firstMenu = menuValues[0];
                    actions.setSelectedSavedMenu(firstMenu.restaurant_menu_id);
                    actions.setSelectedRestaurant(firstMenu.restaurant_menu_id);
                    // 0件のメニューの場合はロードしない
                    if (firstMenu.count > 0) {
                      actions.onLoadSavedMenu(firstMenu.restaurant_menu_id);
                    }
                  }
                  setNewRestaurantName('');
                  setNewRestaurantLocation('');
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      {state.selectedSavedMenu && menuData.sakeData.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          {(() => {
            console.log('=== MenuManagementSection デバッグ ===');
            console.log('state.hasChanges:', state.hasChanges);
            console.log('state.savingToMenu:', state.savingToMenu);
            console.log('ボタン disabled:', state.savingToMenu || !state.hasChanges);
            console.log('menuData.sakeData.length:', menuData.sakeData.length);
            console.log('=== MenuManagementSection デバッグ終了 ===');
            return null;
          })()}
          {state.hasChanges && (
            <div className="text-sm text-orange-600 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>未保存の変更があります</span>
            </div>
          )}
          <button
            onClick={actions.onSaveToRestaurant}
            disabled={state.savingToMenu || !state.hasChanges}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            {state.savingToMenu ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                メニューを更新中...
              </>
            ) : (
              <>
                🔄 メニューを更新
              </>
            )}
          </button>
          <div className="text-sm text-green-700 mt-2 text-center">
            {menuData.sakeData.length}件の日本酒をメニューに更新します
          </div>
        </div>
      )}
    </div>
  );
};
