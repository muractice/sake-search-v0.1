'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SakeData } from '@/types/sake';

interface MenuManagementSectionProps {
  user: User | null;
  isAuthLoading: boolean;
  menuItems: string[];
  menuSakeData: SakeData[];
  selectedSavedMenu: string;
  setSelectedSavedMenu: (id: string) => void;
  selectedRestaurant: string;
  setSelectedRestaurant: (id: string) => void;
  onSaveToRestaurant: () => Promise<void>;
  onAddRestaurant: (name: string, location: string) => Promise<void>;
  onLoadSavedMenu: (menuId: string) => Promise<void>;
  onMenuItemsChange: (items: string[]) => void;
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

export const MenuManagementSection = ({
  user,
  isAuthLoading,
  menuItems,
  menuSakeData,
  selectedSavedMenu,
  setSelectedSavedMenu,
  selectedRestaurant,
  setSelectedRestaurant,
  onSaveToRestaurant,
  onAddRestaurant,
  onLoadSavedMenu,
  onMenuItemsChange,
  groupedSavedMenus,
  loadingMenu,
  savingToMenu
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
      await onAddRestaurant(newRestaurantName.trim(), newRestaurantLocation.trim());
      setShowAddRestaurantForm(false);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  const handleSaveToRestaurant = async () => {
    if (!selectedSavedMenu && !selectedRestaurant) {
      alert('メニューを選択してください');
      return;
    }

    if (menuSakeData.length === 0) {
      alert('保存する日本酒データがありません');
      return;
    }

    try {
      await onSaveToRestaurant();
    } catch (error) {
      console.error('Error saving to restaurant:', error);
    }
  };

  // 認証チェック
  if (isAuthLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
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
              value={selectedSavedMenu}
              onChange={(e) => {
                const newValue = e.target.value;
                
                // 新しいメニューから切り替える場合の確認
                if (!selectedSavedMenu && menuItems.length > 0 && newValue) {
                  const shouldProceed = confirm(
                    '現在の新しいメニューは保存されていません。\n' +
                    '切り替えると入力した内容が失われます。\n\n' +
                    '続行しますか？'
                  );
                  
                  if (!shouldProceed) {
                    // キャンセルされた場合は元に戻す
                    e.target.value = selectedSavedMenu;
                    return;
                  }
                }
                
                if (newValue) {
                  // 既存メニューを選択した場合
                  onLoadSavedMenu(newValue);
                  setSelectedRestaurant(newValue);
                  setShowAddRestaurantForm(false);
                  // フォームをクリア
                  setNewRestaurantName('');
                  setNewRestaurantLocation('');
                } else {
                  // 「新しいメニュー」を選択した場合
                  if (selectedSavedMenu && menuItems.length > 0) {
                    const shouldClear = confirm(
                      '現在のメニューをどうしますか？\n\n' +
                      '「OK」: クリア\n' +
                      '「キャンセル」: そのまま'
                    );
                    
                    if (shouldClear) {
                      onMenuItemsChange([]);
                    }
                  }
                  
                  setSelectedSavedMenu('');
                  setSelectedRestaurant('');
                  // 新しいメニュー選択時は自動でフォームを表示
                  setShowAddRestaurantForm(true);
                  // フォームをクリア
                  setNewRestaurantName('');
                  setNewRestaurantLocation('');
                }
              }}
              disabled={loadingMenu}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900"
            >
              <option value="">新しいメニュー</option>
              {Object.values(groupedSavedMenus).map((menu) => (
                <option key={menu.restaurant_menu_id} value={menu.restaurant_menu_id}>
                  {menu.restaurant_name}
                  {menu.location && ` (${menu.location})`}
                  {` - ${menu.count}件 - ${new Date(menu.restaurant_created_at).toLocaleDateString()}`}
                </option>
              ))}
            </select>
          </div>
          {loadingMenu && (
            <div className="text-blue-600 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              メニューを読み込み中...
            </div>
          )}
        </div>
        
        {/* 新しいメニューが選択されている時にフォームを表示 */}
        {selectedSavedMenu === '' && showAddRestaurantForm && (
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
                disabled={!newRestaurantName.trim() || menuSakeData.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加して保存
              </button>
              <button
                onClick={() => {
                  // キャンセル時は既存メニューの最初のものを選択
                  if (groupedSavedMenus && groupedSavedMenus.length > 0) {
                    const firstMenu = groupedSavedMenus[0];
                    setSelectedSavedMenu(firstMenu.id);
                    setSelectedRestaurant(firstMenu.id);
                    onLoadSavedMenu(firstMenu.id);
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