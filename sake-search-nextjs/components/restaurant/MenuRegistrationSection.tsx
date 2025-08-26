'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SakeData } from '@/types/sake';
import { RestaurantMenu } from '@/types/restaurant';
import ComparisonPanel from '@/components/ComparisonPanel';
import TasteChart from '@/components/TasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
import { useScanOCR } from '@/hooks/scan/useScanOCR';
import { optimizeImageForScan } from '@/lib/scanImageOptimizer';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MenuRegistrationSectionProps {
  menuItems: string[];
  onMenuItemsChange: (items: string[]) => void;
  menuSakeData: SakeData[];
  notFoundItems: string[];
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  onSearch: (query: string) => Promise<SakeData | null>;
}

export const MenuRegistrationSection = ({
  menuItems,
  onMenuItemsChange,
  menuSakeData,
  notFoundItems,
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  onSearch,
}: MenuRegistrationSectionProps) => {
  const [textInput, setTextInput] = useState('');
  const [photoResults, setPhotoResults] = useState<string[]>([]);
  const [noSakeDetected, setNoSakeDetected] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantMenu[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantLocation, setNewRestaurantLocation] = useState('');
  const [savingToMenu, setSavingToMenu] = useState(false);
  const [selectedSavedMenu, setSelectedSavedMenu] = useState<string>('');
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [groupedSavedMenusData, setGroupedSavedMenusData] = useState<Record<string, {
    restaurant_menu_id: string;
    restaurant_name: string;
    location?: string;
    restaurant_created_at: string;
    count: number;
  }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  // OCR処理用のフック
  const { processImage, isProcessing: isOCRProcessing, processingStatus: ocrProcessingStatus } = useScanOCR();

  // 画像処理を行う共通関数
  const handleImageProcessing = useCallback(async (file: File) => {
    if (!file) return;
    
    // 既に処理中の場合は何もしない
    if (isOCRProcessing) {
      console.log('既に画像処理中です');
      return;
    }
    
    // 即座にUIを閉じて、処理中状態に依存しない
    setNoSakeDetected(false);
    setPhotoResults([]);
    
    try {
      // FileをBase64データURLに変換
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
      
      // 画像を最適化
      const optimizedDataUrl = await optimizeImageForScan(base64Image);
      const result = await processImage(optimizedDataUrl);
      
      if (result && result.foundSakeNames && result.foundSakeNames.length > 0) {
        // 新しい日本酒名を既存のメニューアイテムに追加
        const newItems = [...new Set([...menuItems, ...result.foundSakeNames])];
        onMenuItemsChange(newItems);
        setPhotoResults(result.foundSakeNames);
        
        // 新しいアイテムを保存済みメニューに追加
        if (selectedSavedMenu) {
          for (const sakeName of result.foundSakeNames) {
            if (!menuItems.includes(sakeName)) {
              try {
                const sakeData = await onSearch(sakeName);
                if (sakeData) {
                  await handleAddItemToSavedMenu(sakeName, sakeData);
                }
              } catch (error) {
                console.error('Error adding item to saved menu:', error);
              }
            }
          }
        }
      } else {
        setNoSakeDetected(true);
        setPhotoResults([]);
      }
    } catch (error) {
      console.error('画像処理エラー:', error);
      setNoSakeDetected(true);
    }
  }, [isOCRProcessing, processImage, menuItems, onMenuItemsChange]);

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageProcessing(file);
    }
  };

  const handleTextSubmit = async () => {
    if (textInput.trim()) {
      const lines = textInput.split('\n').filter(line => line.trim());
      const newItems = [...new Set([...menuItems, ...lines])];
      onMenuItemsChange(newItems);
      setTextInput('');
      
      // 新しいアイテムを保存済みメニューに追加（データが取得できた場合のみ）
      if (selectedSavedMenu) {
        for (const line of lines) {
          if (!menuItems.includes(line)) {
            // 新規追加アイテムの場合、データを検索して保存
            try {
              const sakeData = await onSearch(line);
              if (sakeData) {
                await handleAddItemToSavedMenu(line, sakeData);
              }
            } catch (error) {
              console.error('Error searching sake data:', error);
            }
          }
        }
      }
    }
  };

  const handleIndividualRemove = async (item: string) => {
    // 保存済みメニューが選択されている場合、DBからも削除
    if (selectedSavedMenu) {
      await handleRemoveItemFromSavedMenu(item);
    }
    onMenuItemsChange(menuItems.filter(menuItem => menuItem !== item));
  };

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

  useEffect(() => {
    fetchRestaurants();
    fetchSavedMenus();
  }, []);

  // 保存済みメニュー一覧を取得
  const fetchSavedMenus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 全ての飲食店を取得し、それぞれの日本酒件数も取得
      const { data: restaurantsData, error } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 各飲食店の日本酒件数を取得
      const restaurantsWithCount = await Promise.all(
        (restaurantsData || []).map(async (restaurant) => {
          const { count } = await supabase
            .from('restaurant_menu_sakes')
            .select('*', { count: 'exact' })
            .eq('restaurant_menu_id', restaurant.id);

          return {
            restaurant_menu_id: restaurant.id,
            restaurant_name: restaurant.restaurant_name,
            location: restaurant.location,
            restaurant_created_at: restaurant.created_at,
            count: count || 0
          };
        })
      );

      // groupedSavedMenus形式に合わせたデータを作成
      const groupedData = restaurantsWithCount.reduce((acc, restaurant) => {
        acc[restaurant.restaurant_menu_id] = restaurant;
        return acc;
      }, {} as Record<string, {
        restaurant_menu_id: string;
        restaurant_name: string;
        location?: string;
        restaurant_created_at: string;
        count: number;
      }>);

      // groupedSavedMenusを直接更新するために、一時的にstateとして管理
      setGroupedSavedMenusData(groupedData);

    } catch (error) {
      console.error('Error fetching saved menus:', error);
    }
  };

  // 新しい飲食店を追加
  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim()) {
      alert('飲食店名を入力してください');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurant_menus')
        .insert({
          user_id: user.id,
          restaurant_name: newRestaurantName.trim(),
          location: newRestaurantLocation.trim() || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding restaurant:', error);
        
        // エラーメッセージをユーザーフレンドリーに変換
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          // 既存の飲食店を探して自動選択
          const existingRestaurant = restaurants.find(r => 
            r.restaurant_name.toLowerCase() === newRestaurantName.trim().toLowerCase()
          );
          
          if (existingRestaurant) {
            setSelectedRestaurant(existingRestaurant.id);
            setSelectedSavedMenu(existingRestaurant.id);
            setShowAddRestaurantForm(false);
            setNewRestaurantName('');
            setNewRestaurantLocation('');
            
            // メニューデータがある場合は自動で保存
            if (menuSakeData.length > 0) {
              try {
                const newSakes = menuSakeData.map(sake => ({
                  restaurant_menu_id: existingRestaurant.id,
                  sake_id: sake.id,
                  brand_id: sake.brandId || null,
                  is_available: true,
                  menu_notes: null
                }));

                const { error: saveError } = await supabase
                  .from('restaurant_menu_sakes')
                  .insert(newSakes);

                if (saveError) throw saveError;

                await fetchSavedMenus();
                alert(`「${newRestaurantName}」は既に登録されています。\nこの飲食店にメニューを保存しました。`);
              } catch (saveError) {
                console.error('Error saving to existing restaurant:', saveError);
                alert(`「${newRestaurantName}」は既に登録されています。\nこの飲食店を選択しましたが、メニューの保存に失敗しました。`);
              }
            } else {
              alert(`「${newRestaurantName}」は既に登録されています。\nこの飲食店を選択しました。`);
            }
          } else {
            // 念のため再読み込み
            await fetchRestaurants();
            await fetchSavedMenus();
            alert(`「${newRestaurantName}」という名前の飲食店は既に登録されています。\n別の名前を入力するか、既存のメニューを選択してください。`);
          }
        } else if (error.code === '23503') {
          alert('認証エラーが発生しました。ページを再読み込みしてください。');
        } else {
          alert('飲食店の追加に失敗しました。しばらく経ってから再度お試しください。');
        }
        return;
      }

      await fetchRestaurants();
      await fetchSavedMenus(); // 保存済みメニューを更新
      setSelectedRestaurant(data.id);
      setSelectedSavedMenu(data.id); // セレクトボックスも新規作成した飲食店を選択
      setShowAddRestaurantForm(false);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
      
      // メニューデータがある場合は自動で保存
      if (menuSakeData.length > 0) {
        try {
          const newSakes = menuSakeData.map(sake => ({
            restaurant_menu_id: data.id,
            sake_id: sake.id,
            brand_id: sake.brandId || null,
            is_available: true,
            menu_notes: null
          }));

          const { error: saveError } = await supabase
            .from('restaurant_menu_sakes')
            .insert(newSakes);

          if (saveError) throw saveError;

          await fetchSavedMenus(); // 保存後にメニューを再読み込み
          alert(`飲食店「${newRestaurantName}」を作成し、${menuSakeData.length}件の日本酒をメニューに保存しました。`);
        } catch (saveError) {
          console.error('Error saving menu to new restaurant:', saveError);
          alert(`飲食店「${newRestaurantName}」は作成されましたが、メニューの保存に失敗しました。\n再度保存ボタンをクリックしてください。`);
        }
      } else {
        // メニューデータがない場合
        alert(`飲食店「${newRestaurantName}」を作成しました。\n日本酒を追加してから保存ボタンをクリックしてください。`);
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('予期しないエラーが発生しました。しばらく経ってから再度お試しください。');
    }
  };

  // メニューを飲食店に保存
  const handleSaveToRestaurant = async () => {
    if (!selectedRestaurant) {
      alert('飲食店を選択してください');
      return;
    }

    if (menuSakeData.length === 0) {
      alert('保存する日本酒データがありません');
      return;
    }

    setSavingToMenu(true);
    try {
      const newSakes = menuSakeData.map(sake => ({
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

      alert(`${newSakes.length}件の日本酒を飲食店メニューに保存しました`);
      await fetchSavedMenus(); // 保存済みメニューを更新
    } catch (error) {
      console.error('Error saving to restaurant menu:', error);
      alert('メニューへの保存に失敗しました');
    } finally {
      setSavingToMenu(false);
    }
  };

  // 保存済みメニューをロード
  const handleLoadSavedMenu = async (restaurantMenuId: string) => {
    if (!restaurantMenuId) return;

    const hasExistingItems = menuItems.length > 0;
    if (hasExistingItems) {
      const confirmed = confirm('現在のメニューをクリアして、保存済みメニューを読み込みますか？');
      if (!confirmed) return;
    }

    setLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_menu_with_sakes')
        .select('*')
        .eq('restaurant_menu_id', restaurantMenuId)
        .not('sake_id', 'is', null);

      if (error) throw error;

      // 日本酒名を取得してメニューアイテムとして設定
      // sake_nameがない場合はsake_masterから取得を試みる
      const sakeNames: string[] = [];
      
      for (const item of data) {
        if (item.sake_name) {
          // sake_nameがある場合はそれを使用
          sakeNames.push(item.sake_name);
        } else if (item.sake_id) {
          // sake_nameがない場合、sake_masterから取得
          const { data: sakeData } = await supabase
            .from('sake_master')
            .select('brand_name')
            .eq('id', item.sake_id)
            .single();
          
          if (sakeData?.brand_name) {
            sakeNames.push(sakeData.brand_name);
          } else {
            // brand_nameも取得できない場合はIDを使用（最後の手段）
            sakeNames.push(item.sake_id);
          }
        }
      }
      
      // 重複を除去してメニューアイテムとして設定
      const uniqueSakeNames = [...new Set(sakeNames)];
      onMenuItemsChange(uniqueSakeNames);
      
      setSelectedSavedMenu(restaurantMenuId);
    } catch (error) {
      console.error('Error loading saved menu:', error);
      alert('保存済みメニューの読み込みに失敗しました');
    } finally {
      setLoadingMenu(false);
    }
  };

  // メニューアイテムを保存済みメニューに追加
  const handleAddItemToSavedMenu = async (sakeName: string, sakeData: SakeData) => {
    if (!selectedSavedMenu) return;

    try {
      const { error } = await supabase
        .from('restaurant_menu_sakes')
        .insert({
          restaurant_menu_id: selectedSavedMenu,
          sake_id: sakeData.id,
          brand_id: sakeData.brandId || null,
          is_available: true,
          menu_notes: null
        });

      if (error) throw error;
      await fetchSavedMenus();
    } catch (error) {
      console.error('Error adding item to saved menu:', error);
    }
  };

  // メニューアイテムを保存済みメニューから削除
  const handleRemoveItemFromSavedMenu = async (sakeName: string) => {
    if (!selectedSavedMenu) return;

    try {
      // sake_nameまたはsake_idから一致するアイテムを削除
      const { error } = await supabase
        .from('restaurant_menu_sakes')
        .delete()
        .eq('restaurant_menu_id', selectedSavedMenu)
        .in('sake_id', [
          ...menuSakeData.filter(sake => sake.name === sakeName).map(sake => sake.id)
        ]);

      if (error) throw error;
      await fetchSavedMenus();
    } catch (error) {
      console.error('Error removing item from saved menu:', error);
    }
  };

  // 保存済みメニューのグループ化データ（stateから取得）
  const groupedSavedMenus = groupedSavedMenusData;

  return (
    <div className="space-y-6">
      {/* メニュー登録エリア */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">📝</span>
          メニュー登録
        </h2>
        
        <div className="space-y-4">
          {/* 登録方法の選択 */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCameraCapture}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                title="カメラで撮影"
              >
                <span className="text-2xl">📷</span>
              </button>
              <button
                onClick={handleGallerySelect}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                title="ギャラリーから選択"
              >
                <span className="text-2xl">🖼️</span>
              </button>
            </div>
            <div className="flex gap-3">
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="日本酒名を入力"
                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleTextSubmit}
                className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <span className="text-xl">🔍</span>
                検索
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* OCR処理状態の表示 */}
          {isOCRProcessing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <span className="text-yellow-700">{ocrProcessingStatus || '画像を処理中...'}</span>
              </div>
            </div>
          )}

          {/* 結果表示 */}
          {photoResults.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold">
                {photoResults.length}件の日本酒を検出しました！
              </p>
            </div>
          )}

          {noSakeDetected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                日本酒が検出されませんでした。もう一度お試しください。
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 飲食店のメニュー */}
      <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🍽️</span>
            飲食店のメニュー
          </h2>

          {/* 飲食店選択セクション */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                メニューを保存する飲食店:
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
                      handleLoadSavedMenu(newValue);
                      setSelectedRestaurant(newValue);
                      setShowAddRestaurantForm(false);
                    } else {
                      // 「新しいメニュー」を選択した場合
                      if (selectedSavedMenu && menuItems.length > 0) {
                        // 他のメニューから「新しいメニュー」に変更する場合、確認ダイアログ表示
                        const shouldClear = confirm(
                          '現在のメニューをどうしますか？\n\n' +
                          '「OK」: クリア\n' +
                          '「キャンセル」: そのまま'
                        );
                        
                        if (shouldClear) {
                          onMenuItemsChange([]); // メニューをクリア
                        }
                        // どちらの場合も「新しいメニュー」状態にする
                      }
                      
                      setSelectedSavedMenu('');
                      setSelectedRestaurant('');
                      setShowAddRestaurantForm(false);
                    }
                  }}
                  disabled={loadingMenu}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                        // 新規作成フォーム表示中で飲食店が作成済みの場合、保存を実行
                        handleSaveToRestaurant();
                      } else {
                        // 「新しいメニュー」選択中の場合、新規登録フォームを表示
                        setShowAddRestaurantForm(true);
                      }
                    } else if (menuSakeData.length > 0) {
                      // 既存メニュー選択中の場合、保存を実行
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
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={newRestaurantLocation}
                  onChange={(e) => setNewRestaurantLocation(e.target.value)}
                  placeholder="場所・住所（任意）"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRestaurant}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    作成
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

          {/* メニュー内容は日本酒が登録されている場合のみ表示 */}
          {(menuItems.length > 0) && (
            <>
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700 block mb-3">
                  {menuSakeData.length + notFoundItems.length}件の日本酒が登録されています
                  {menuSakeData.length > 0 && ` (データあり: ${menuSakeData.length}件)`}
                  {notFoundItems.length > 0 && ` (データなし: ${notFoundItems.length}件)`}
                  {selectedSavedMenu && <span className="text-blue-600"> (保存済みメニュー選択中)</span>}
                </span>
            
            {/* スマホ対応: ボタンを下に配置・横並び */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // データありの日本酒のみを一括で比較リストに追加
                  const sakesToAdd = menuSakeData.filter(sake => !isInComparison(sake.id));
                  if (sakesToAdd.length === 0) {
                    alert('すべての日本酒が既に比較リストに追加されています');
                    return;
                  }
                  
                  // 比較リストの空き枠数を計算
                  const availableSlots = 10 - comparisonList.length;
                  if (availableSlots === 0) {
                    alert('比較リストは既に上限の10件に達しています');
                    return;
                  }
                  
                  // 追加可能な数まで追加
                  const itemsToAdd = sakesToAdd.slice(0, availableSlots);
                  itemsToAdd.forEach(sake => onToggleComparison(sake));
                  
                  if (sakesToAdd.length > availableSlots) {
                    alert(`比較リストの上限により、${sakesToAdd.length}件中${itemsToAdd.length}件を追加しました（残り${sakesToAdd.length - itemsToAdd.length}件は追加されませんでした）`);
                  } else {
                    alert(`${itemsToAdd.length}件の日本酒を比較リストに追加しました`);
                  }
                }}
                disabled={menuSakeData.length === 0}
                className="flex-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
              >
                一括比較
              </button>
              <button
                onClick={() => {
                  onMenuItemsChange([]);
                }}
                className="flex-1 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg min-h-[44px] flex items-center justify-center"
              >
                すべて削除
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* APIで見つかった日本酒 */}
            {menuSakeData.map((sake) => (
              <div
                key={sake.id}
                className="p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{sake.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{sake.brewery}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onToggleComparison(sake)}
                      className={`px-2 py-1 rounded text-xs ${
                        isInComparison(sake.id)
                          ? 'bg-gray-300 text-gray-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isInComparison(sake.id) ? '追加済' : '比較'}
                    </button>
                    <button
                      onClick={() => handleIndividualRemove(sake.name)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* データが見つからなかった日本酒 */}
            {notFoundItems.map((item, index) => (
              <div
                key={`not-found-${index}`}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-600">{item}</p>
                    <p className="text-xs text-red-500 mt-1">データなし</p>
                  </div>
                  <button
                    onClick={() => handleIndividualRemove(item)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>

      {/* 比較パネル */}
      {comparisonList.length > 0 && (
        <ComparisonPanel
          comparisonList={comparisonList}
          onRemove={onToggleComparison}
          onClear={onClearComparison}
          onSelectSake={onSelectSake}
        />
      )}

      {/* 比較リストのチャート表示エリア */}
      {comparisonList.length > 0 && (
        <>
          {/* 4象限チャート */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3 text-2xl">📊</span>
              比較リストの味わいマップ
            </h2>
            <div className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
              <TasteChart 
                sakeData={comparisonList}
                onSakeClick={onChartClick}
              />
            </div>
          </div>

          {/* レーダーチャート */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3 text-2xl">🎯</span>
              比較リストの味覚特性
            </h2>
            <div className="min-h-[400px] md:min-h-[500px]">
              <SakeRadarChartSection sakeData={comparisonList} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};