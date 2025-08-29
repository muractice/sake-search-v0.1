'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { RestaurantMenu } from '@/types/restaurant';
import { SakeData } from '@/types/sake';

interface MenuManagementSectionProps {
  user: User | null;
  isAuthLoading: boolean;
  menuItems: string[];
  menuSakeData: SakeData[];
  notFoundItems: string[];
  selectedSavedMenu: string;
  setSelectedSavedMenu: (id: string) => void;
  selectedRestaurant: string;
  setSelectedRestaurant: (id: string) => void;
  restaurants: RestaurantMenu[];
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
  notFoundItems,
  selectedSavedMenu,
  setSelectedSavedMenu,
  selectedRestaurant,
  setSelectedRestaurant,
  restaurants,
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
                
                if (newValue) {
                  // 既存メニューを選択した場合
                  onLoadSavedMenu(newValue);
                  setSelectedRestaurant(newValue);
                  setShowAddRestaurantForm(false);
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
                  setShowAddRestaurantForm(false);
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
            <button
              onClick={() => {
                if (!selectedSavedMenu) {
                  if (showAddRestaurantForm && selectedRestaurant && menuSakeData.length > 0) {
                    handleSaveToRestaurant();
                  } else {
                    setShowAddRestaurantForm(true);
                  }
                } else if (menuSakeData.length > 0) {
                  handleSaveToRestaurant();
                }
              }}
              disabled={savingToMenu || (!selectedSavedMenu && !showAddRestaurantForm && menuSakeData.length === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap sm:min-w-[80px]"
            >
              {savingToMenu ? '保存中...' : '保存'}
            </button>
          </div>
          {loadingMenu && (
            <div className="text-blue-600 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              メニューを読み込み中...
            </div>
          )}
        </div>
        
        {showAddRestaurantForm && (
          <div className="space-y-2 mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <input
              type="text"
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              placeholder="飲食店名 *"
              className="w-full px-3 py-2 border rounded-lg text-gray-900"
            />
            <input
              type="text"
              value={newRestaurantLocation}
              onChange={(e) => setNewRestaurantLocation(e.target.value)}
              placeholder="場所・住所（任意）"
              className="w-full px-3 py-2 border rounded-lg text-gray-900"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddRestaurant}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                追加
              </button>
              <button
                onClick={() => {
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