'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SakeData } from '@/types/sake';

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
    restaurant_created_at: string;
    count: number;
  }>;
  loadingMenu: boolean;
  savingToMenu: boolean;
}

interface MenuManagementActions {
  setSelectedSavedMenu: (id: string) => void;
  setSelectedRestaurant: (id: string) => void;
  onSaveToRestaurant: () => Promise<void>;
  onAddRestaurant: (name: string, location: string) => Promise<void>;
  onLoadSavedMenu: (menuId: string) => Promise<void>;
  onMenuItemsChange: (items: string[]) => void;
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
  const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantLocation, setNewRestaurantLocation] = useState('');

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim()) {
      alert('飲食店名を入力してください');
      return;
    }

    try {
      await actions.onAddRestaurant(newRestaurantName.trim(), newRestaurantLocation.trim());
      setShowAddRestaurantForm(false);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  const handleSaveToRestaurant = async () => {
    if (!state.selectedSavedMenu && !state.selectedRestaurant) {
      alert('メニューを選択してください');
      return;
    }

    if (menuData.sakeData.length === 0) {
      alert('保存する日本酒データがありません');
      return;
    }

    try {
      await actions.onSaveToRestaurant();
    } catch (error) {
      console.error('Error saving to restaurant:', error);
    }
  };

  const handleMenuSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    
    // 新しいメニューから切り替える場合の確認
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
    }
    
    if (newValue) {
      // 既存メニューを選択した場合
      actions.onLoadSavedMenu(newValue);
      actions.setSelectedRestaurant(newValue);
      setShowAddRestaurantForm(false);
      // フォームをクリア
      setNewRestaurantName('');
      setNewRestaurantLocation('');
    } else {
      // 「新しいメニュー」を選択した場合
      if (state.selectedSavedMenu && menuData.items.length > 0) {
        const shouldClear = confirm(
          '現在のメニューをどうしますか？\n\n' +
          '「OK」: クリア\n' +
          '「キャンセル」: そのまま'
        );
        
        if (shouldClear) {
          actions.onMenuItemsChange([]);
        }
      }
      
      actions.setSelectedSavedMenu('');
      actions.setSelectedRestaurant('');
      // 新しいメニュー選択時は自動でフォームを表示
      setShowAddRestaurantForm(true);
      // フォームをクリア
      setNewRestaurantName('');
      setNewRestaurantLocation('');
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
            保存するメニュー:
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
              {Object.values(state.groupedSavedMenus).map((menu) => (
                <option key={menu.restaurant_menu_id} value={menu.restaurant_menu_id}>
                  {menu.restaurant_name}
                  {menu.location && ` (${menu.location})`}
                  {` - ${menu.count}件 - ${new Date(menu.restaurant_created_at).toLocaleDateString()}`}
                </option>
              ))}
            </select>
          </div>
          {state.loadingMenu && (
            <div className="text-blue-600 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              メニューを読み込み中...
            </div>
          )}
        </div>
        
        {/* 新しいメニューが選択されている時にフォームを表示 */}
        {state.selectedSavedMenu === '' && showAddRestaurantForm && (
          <div className="space-y-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-700 mb-2">
              新しいメニューを保存するには、飲食店情報を入力してください
            </div>
            <input
              type="text"
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              placeholder="飲食店名 *"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
            />
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
                追加して保存
              </button>
              <button
                onClick={() => {
                  // キャンセル時は既存メニューの最初のものを選択
                  const menuValues = Object.values(state.groupedSavedMenus);
                  if (menuValues && menuValues.length > 0) {
                    const firstMenu = menuValues[0];
                    actions.setSelectedSavedMenu(firstMenu.restaurant_menu_id);
                    actions.setSelectedRestaurant(firstMenu.restaurant_menu_id);
                    actions.onLoadSavedMenu(firstMenu.restaurant_menu_id);
                  }
                  setShowAddRestaurantForm(false);
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
    </div>
  );
};