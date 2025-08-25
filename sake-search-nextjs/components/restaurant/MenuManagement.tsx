'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SakeData } from '@/types/sake';
import { 
  RestaurantMenu, 
  RestaurantMenuSake, 
  RestaurantMenuWithSakes,
  RestaurantMenuFormData 
} from '@/types/restaurant';

interface MenuManagementProps {
  restaurantMenuSakeData: SakeData[];
  restaurantName?: string;
  onMenuUpdate?: () => void;
}

export const MenuManagement = ({
  restaurantMenuSakeData,
  restaurantName = '',
  onMenuUpdate
}: MenuManagementProps) => {
  const [restaurants, setRestaurants] = useState<RestaurantMenu[]>([]);
  const [menuWithSakes, setMenuWithSakes] = useState<RestaurantMenuWithSakes[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
  const [currentRestaurantName, setCurrentRestaurantName] = useState(restaurantName);
  
  const supabase = createClientComponentClient();

  // 飲食店一覧を取得
  const fetchRestaurants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('user_id', user.id)
        .order('restaurant_name', { ascending: true });

      if (error) throw error;
      setRestaurants(data || []);
      
      if (data && data.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  // 選択した飲食店のメニューと日本酒情報を取得
  const fetchMenuWithSakes = async (restaurantId: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_menu_with_sakes')
        .select('*')
        .eq('restaurant_menu_id', restaurantId);

      if (error) throw error;
      setMenuWithSakes(data || []);
    } catch (error) {
      console.error('Error fetching menu with sakes:', error);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuWithSakes(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  // 新しい飲食店を追加
  const handleAddRestaurant = async (formData: RestaurantMenuFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurant_menus')
        .insert({
          ...formData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRestaurants();
      setSelectedRestaurant(data.id);
      setShowAddRestaurantForm(false);
      onMenuUpdate?.();
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('飲食店の追加に失敗しました');
    }
  };

  // スキャン結果から一括で日本酒をメニューに追加
  const handleBulkAddSakes = async () => {
    if (!selectedRestaurant || restaurantMenuSakeData.length === 0) {
      alert('飲食店を選択し、追加する日本酒があることを確認してください');
      return;
    }

    setLoading(true);
    try {
      const newSakes = restaurantMenuSakeData.map(sake => ({
        restaurant_menu_id: selectedRestaurant,
        sake_id: sake.id,
        brand_id: sake.brandId || null,
        is_available: true,
        menu_notes: null
      }));

      const { error } = await supabase
        .from('restaurant_menu_sakes')
        .insert(newSakes);

      if (error) throw error;

      alert(`${newSakes.length}件の日本酒をメニューに追加しました`);
      await fetchMenuWithSakes(selectedRestaurant);
      onMenuUpdate?.();
    } catch (error) {
      console.error('Error bulk adding sakes:', error);
      alert('日本酒の一括追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 日本酒の提供状況を更新
  const handleToggleAvailability = async (menuSakeId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurant_menu_sakes')
        .update({ 
          is_available: isAvailable,
          updated_at: new Date().toISOString() 
        })
        .eq('id', menuSakeId);

      if (error) throw error;

      await fetchMenuWithSakes(selectedRestaurant);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('提供状況の更新に失敗しました');
    }
  };

  // メニューから日本酒を削除
  const handleRemoveSake = async (menuSakeId: string, sakeName: string) => {
    if (!confirm(`「${sakeName}」をメニューから削除しますか？`)) return;

    try {
      const { error } = await supabase
        .from('restaurant_menu_sakes')
        .delete()
        .eq('id', menuSakeId);

      if (error) throw error;

      await fetchMenuWithSakes(selectedRestaurant);
      onMenuUpdate?.();
    } catch (error) {
      console.error('Error removing sake:', error);
      alert('日本酒の削除に失敗しました');
    }
  };

  // 現在選択されている飲食店の情報
  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);
  
  // sake_idでグループ化してメニュー項目を整理
  const groupedMenuItems = menuWithSakes.filter(item => item.sake_id).reduce((acc, item) => {
    if (!acc[item.sake_id!]) {
      acc[item.sake_id!] = item;
    }
    return acc;
  }, {} as { [key: string]: RestaurantMenuWithSakes });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* メニュー管理メインセクション */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🍽️ メニュー管理</h2>
          <button
            onClick={() => setShowAddRestaurantForm(!showAddRestaurantForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ➕ 飲食店を追加
          </button>
        </div>

        {/* 飲食店追加フォーム */}
        {showAddRestaurantForm && (
          <RestaurantForm
            onSubmit={handleAddRestaurant}
            onCancel={() => setShowAddRestaurantForm(false)}
            initialName={currentRestaurantName}
          />
        )}

        {/* 飲食店選択 */}
        {restaurants.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              飲食店を選択:
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.restaurant_name}
                  {restaurant.location && ` - ${restaurant.location}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* スキャン結果からの一括追加 */}
        {restaurantMenuSakeData.length > 0 && selectedRestaurant && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-3">📝 スキャン結果からメニューに追加</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {restaurantMenuSakeData.length}件の日本酒を「{currentRestaurant?.restaurant_name}」のメニューに追加できます
              </div>
              <button
                onClick={handleBulkAddSakes}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                メニューに一括追加
              </button>
            </div>
          </div>
        )}

        {/* メニュー一覧 */}
        {selectedRestaurant ? (
          <div>
            <h3 className="font-bold text-lg mb-4">
              📍 {currentRestaurant?.restaurant_name} のメニュー
            </h3>
            
            {Object.keys(groupedMenuItems).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                メニューに日本酒が登録されていません
              </p>
            ) : (
              <div className="space-y-3">
                {Object.values(groupedMenuItems).map((item) => (
                  <MenuSakeCard
                    key={item.menu_sake_id}
                    item={item}
                    onToggleAvailability={handleToggleAvailability}
                    onRemove={handleRemoveSake}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            飲食店を選択または追加してください
          </p>
        )}
      </div>
    </div>
  );
};

// 飲食店追加フォーム
const RestaurantForm = ({
  onSubmit,
  onCancel,
  initialName = ''
}: {
  onSubmit: (data: RestaurantMenuFormData) => void;
  onCancel: () => void;
  initialName?: string;
}) => {
  const [formData, setFormData] = useState<RestaurantMenuFormData>({
    restaurant_name: initialName,
    location: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurant_name.trim()) {
      alert('飲食店名は必須です');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg mb-4">
      <div className="grid grid-cols-1 gap-3 mb-3">
        <input
          type="text"
          value={formData.restaurant_name}
          onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
          placeholder="飲食店名 *"
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="場所・住所"
          className="px-3 py-2 border rounded-lg"
        />
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="備考"
          className="px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
};

// メニューの日本酒カード
const MenuSakeCard = ({
  item,
  onToggleAvailability,
  onRemove
}: {
  item: RestaurantMenuWithSakes;
  onToggleAvailability: (menuSakeId: string, isAvailable: boolean) => void;
  onRemove: (menuSakeId: string, sakeName: string) => void;
}) => {
  const displayName = item.sake_name || item.sake_id || '名称不明';
  const displayBrewery = item.sake_brewery || '蔵元不明';

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      item.is_available ? 'bg-white' : 'bg-gray-100'
    } border`}>
      <div className="flex-1">
        <div className="font-medium">{displayName}</div>
        <div className="text-sm text-gray-600">{displayBrewery}</div>
        {(item.sweetness !== undefined || item.richness !== undefined) && (
          <div className="flex gap-2 mt-1 text-xs text-gray-500">
            {item.sweetness !== undefined && <span>甘辛: {item.sweetness.toFixed(1)}</span>}
            {item.richness !== undefined && <span>濃淡: {item.richness.toFixed(1)}</span>}
          </div>
        )}
        {item.menu_notes && (
          <div className="text-sm text-gray-500 mt-1">💭 {item.menu_notes}</div>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={item.is_available || false}
            onChange={(e) => onToggleAvailability(item.menu_sake_id!, e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">提供中</span>
        </label>
        <button
          onClick={() => onRemove(item.menu_sake_id!, displayName)}
          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
        >
          削除
        </button>
      </div>
    </div>
  );
};