'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SakeData } from '@/types/sake';
import { RestaurantMenu, RestaurantMenuFormData } from '@/types/restaurant';
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
}: MenuRegistrationSectionProps) => {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [photoResults, setPhotoResults] = useState<string[]>([]);
  const [noSakeDetected, setNoSakeDetected] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantMenu[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantLocation, setNewRestaurantLocation] = useState('');
  const [savingToMenu, setSavingToMenu] = useState(false);
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
    setShowPhotoUpload(false);
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

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const lines = textInput.split('\n').filter(line => line.trim());
      const newItems = [...new Set([...menuItems, ...lines])];
      onMenuItemsChange(newItems);
      setTextInput('');
    }
  };

  const handleIndividualRemove = (item: string) => {
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
  }, []);

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
          restaurant_name: newRestaurantName,
          location: newRestaurantLocation || null
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRestaurants();
      setSelectedRestaurant(data.id);
      setShowAddRestaurantForm(false);
      setNewRestaurantName('');
      setNewRestaurantLocation('');
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('飲食店の追加に失敗しました');
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
    } catch (error) {
      console.error('Error saving to restaurant menu:', error);
      alert('メニューへの保存に失敗しました');
    } finally {
      setSavingToMenu(false);
    }
  };

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
              <p className="text-green-700 font-semibold mb-2">
                {photoResults.length}件の日本酒を検出しました！
              </p>
              <ul className="text-sm text-green-600">
                {photoResults.map((name, index) => (
                  <li key={index}>✓ {name}</li>
                ))}
              </ul>
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
      {menuItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🍽️</span>
            飲食店のメニュー
          </h2>

          {/* 飲食店選択セクション */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                メニューを保存する飲食店:
              </label>
              <button
                onClick={() => setShowAddRestaurantForm(!showAddRestaurantForm)}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + 新規作成
              </button>
            </div>
            
            {showAddRestaurantForm ? (
              <div className="space-y-2 mb-3">
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
            ) : restaurants.length > 0 && (
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">飲食店を選択してください</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.restaurant_name}
                    {restaurant.location && ` - ${restaurant.location}`}
                  </option>
                ))}
              </select>
            )}

            {selectedRestaurant && menuSakeData.length > 0 && (
              <button
                onClick={handleSaveToRestaurant}
                disabled={savingToMenu}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingToMenu ? '保存中...' : `${menuSakeData.length}件を飲食店メニューに保存`}
              </button>
            )}
          </div>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 block mb-3">
              {menuSakeData.length + notFoundItems.length}件の日本酒が登録されています
              {menuSakeData.length > 0 && ` (データあり: ${menuSakeData.length}件)`}
              {notFoundItems.length > 0 && ` (データなし: ${notFoundItems.length}件)`}
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
                すべてクリア
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
        </div>
      )}

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