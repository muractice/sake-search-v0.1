'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MenuScanner from '@/components/MenuScanner';
import TasteChart from '@/components/TasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
import ComparisonPanel from '@/components/ComparisonPanel';
import { SakeData } from '@/types/sake';
import { useScanOCR } from '@/hooks/scan/useScanOCR';
import { optimizeImageForScan } from '@/lib/scanImageOptimizer';

interface RestaurantTabProps {
  comparisonList: SakeData[];
  onToggleComparison: (sake: SakeData) => void;
  isInComparison: (sakeId: string) => boolean;
  onClearComparison: () => void;
  onSelectSake: (sake: SakeData) => void;
  onChartClick: (sake: SakeData) => void;
  onSearch: (query: string) => Promise<SakeData | null>;
  menuItems: string[];
  onMenuItemsChange: (items: string[]) => void;
}

export const RestaurantTab = ({
  comparisonList,
  onToggleComparison,
  isInComparison,
  onClearComparison,
  onSelectSake,
  onChartClick,
  onSearch,
  menuItems,
  onMenuItemsChange,
}: RestaurantTabProps) => {
  const [showMenuScanner, setShowMenuScanner] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'similarity' | 'pairing' | 'random'>('similarity');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [photoResults, setPhotoResults] = useState<string[]>([]);
  const [noSakeDetected, setNoSakeDetected] = useState(false);
  const [menuSakeData, setMenuSakeData] = useState<SakeData[]>([]);
  const [notFoundItems, setNotFoundItems] = useState<string[]>([]);
  const [isLoadingMenuData, setIsLoadingMenuData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // OCR処理用のフック
  const { processImage, isProcessing: isOCRProcessing, processingStatus: ocrProcessingStatus } = useScanOCR();
  
  // デバッグ用: 状態変更を監視
  useEffect(() => {
    console.log('[RestaurantTab] State Debug:', {
      isOCRProcessing,
      isLoadingMenuData,
      menuItemsLength: menuItems.length,
      menuSakeDataLength: menuSakeData.length,
      showPhotoUpload,
      photoResultsLength: photoResults.length,
      noSakeDetected,
      timestamp: new Date().toISOString()
    });
  }, [isOCRProcessing, isLoadingMenuData, menuItems.length, menuSakeData.length, showPhotoUpload, photoResults.length, noSakeDetected]);
  
  // onSearchを直接使用（useCallbackは不要）

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
      // FileReaderで画像をBase64に変換
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
      
      // 画像を最適化
      const optimizedImage = await optimizeImageForScan(base64Image);
      
      // OCR処理を実行
      const result = await processImage(optimizedImage);
      
      // エラーチェック
      if (result && 'error' in result && result.error) {
        console.error('OCR処理エラー:', result.message);
        setNoSakeDetected(true);
        return;
      }
      
      if (result && result.foundSakeNames && result.foundSakeNames.length > 0) {
        setPhotoResults(result.foundSakeNames);
        // 状態更新を分離し、競合を回避
        const currentItems = [...menuItems];
        const newItems = result.foundSakeNames.filter(name => !currentItems.includes(name));
        if (newItems.length > 0) {
          onMenuItemsChange([...currentItems, ...newItems]);
        }
        setNoSakeDetected(false);
      } else {
        // 日本酒が見つからなかった場合
        setNoSakeDetected(true);
      }
    } catch (error) {
      console.error('画像処理エラー:', error);
      setNoSakeDetected(true);
    }
  }, [isOCRProcessing, processImage, menuItems, onMenuItemsChange]);

  // メニューアイテムが変更されたら日本酒データを取得
  useEffect(() => {
    // OCR処理中は重い処理を避ける
    if (isOCRProcessing) {
      console.log('OCR処理中のため、データ取得をスキップ');
      return;
    }
    
    const fetchMenuSakeData = async () => {
      if (menuItems.length === 0) {
        setMenuSakeData([]);
        setNotFoundItems([]);
        setIsLoadingMenuData(false);
        return;
      }
      
      setIsLoadingMenuData(true);
      const sakeDataList: SakeData[] = [];
      const notFoundList: string[] = [];
      
      // 短時間で処理を完了させるため、並列処理に変更
      const promises = menuItems.map(async (sakeName) => {
        try {
          const sakeData = await onSearch(sakeName);
          return { sakeName, sakeData };
        } catch (error) {
          console.log(`日本酒「${sakeName}」のデータ取得に失敗:`, error);
          return { sakeName, sakeData: null };
        }
      });
      
      const results = await Promise.all(promises);
      
      for (const { sakeName, sakeData } of results) {
        if (sakeData) {
          sakeDataList.push(sakeData);
        } else {
          notFoundList.push(sakeName);
        }
      }
      
      setMenuSakeData(sakeDataList);
      setNotFoundItems(notFoundList);
      setIsLoadingMenuData(false);
    };
    
    // debounce効果を付与して、連続更新を回避
    const timer = setTimeout(fetchMenuSakeData, 300);
    return () => clearTimeout(timer);
  }, [menuItems, onSearch, isOCRProcessing]);

  // メニューから見つかった日本酒を処理
  const handleSakeFound = async (sakeName: string) => {
    try {
      const searchResult = await onSearch(sakeName);
      
      if (searchResult) {
        // 比較リストの件数チェック（最大10件）
        if (comparisonList.length >= 10 && !isInComparison(searchResult.id)) {
          return { success: false, message: `比較リストは10件までです。他のアイテムを削除してから追加してください` };
        }
        
        // 検索結果を比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          onToggleComparison(searchResult);
          return { success: true, message: `「${sakeName}」を比較に追加しました！` };
        } else {
          return { success: false, message: `「${sakeName}」は既に比較リストにあります` };
        }
      } else {
        return { success: false, message: `「${sakeName}」が見つかりませんでした` };
      }
    } catch {
      return { success: false, message: '検索中にエラーが発生しました' };
    }
  };

  // 複数の日本酒を一括処理
  const handleMultipleSakeFound = async (sakeNames: string[], updateStatus?: (statusMap: Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>) => void) => {
    let currentCount = comparisonList.length; // 現在の件数を追跡
    const statusMap = new Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>();

    for (const sakeName of sakeNames) {
      try {
        const searchResult = await onSearch(sakeName);
        
        if (searchResult) {
          // 既に存在するかチェック
          if (isInComparison(searchResult.id)) {
            statusMap.set(sakeName, {
              status: 'added',
              message: `「${sakeName}」は既に比較リストにあります`
            });
          } else {
            // 比較リストの件数チェック（動的に追跡）
            if (currentCount >= 10) {
              statusMap.set(sakeName, {
                status: 'limit_exceeded',
                message: `比較リストは10件までです`
              });
            } else {
              // 検索結果を比較リストに追加
              onToggleComparison(searchResult);
              currentCount++; // 件数を増加
              statusMap.set(sakeName, {
                status: 'added',
                message: `「${sakeName}」を比較に追加しました！`
              });
            }
          }
        } else {
          statusMap.set(sakeName, {
            status: 'not_found',
            message: `「${sakeName}」が見つかりませんでした`
          });
        }
      } catch {
        statusMap.set(sakeName, {
          status: 'not_found',
          message: 'エラーが発生しました'
        });
      }
    }

    // ステータスをスキャナーに渡す
    if (updateStatus) {
      updateStatus(statusMap);
    }
  };

  // 個別追加（ダイアログなし）
  const handleIndividualAdd = async (sakeName: string) => {
    try {
      const searchResult = await onSearch(sakeName);
      
      if (searchResult) {
        // 比較リストの件数チェック（最大10件）
        if (comparisonList.length >= 10 && !isInComparison(searchResult.id)) {
          return { success: false, message: `比較リストは10件までです。他のアイテムを削除してから追加してください` };
        }
        
        // 検索結果を比較リストに追加（既に存在しない場合のみ）
        if (!isInComparison(searchResult.id)) {
          onToggleComparison(searchResult);
          return { success: true, message: `「${sakeName}」を比較に追加しました！` };
        } else {
          return { success: false, message: `「${sakeName}」は既に比較リストにあります` };
        }
      } else {
        return { success: false, message: `「${sakeName}」が見つかりませんでした` };
      }
    } catch {
      return { success: false, message: '検索中にエラーが発生しました' };
    }
  };

  // 個別削除（ダイアログなし）
  const handleIndividualRemove = async (sakeName: string) => {
    try {
      const searchResult = await onSearch(sakeName);
      
      if (searchResult && isInComparison(searchResult.id)) {
        onToggleComparison(searchResult);
        return { success: true, message: `「${sakeName}」を比較リストから削除しました` };
      } else {
        return { success: false, message: `「${sakeName}」は比較リストにありません` };
      }
    } catch {
      return { success: false, message: '削除中にエラーが発生しました' };
    }
  };

  return (
    <div className="space-y-6">
      {/* メニュー登録セクション */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">📝</span>
          メニューから日本酒を登録
        </h2>
        <p className="text-gray-600 mb-4">
          飲食店のメニューから日本酒を登録して、味わいの比較やおすすめを見つけましょう。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 写真で登録 */}
          <button
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg 
                     hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>📷</span>
            写真で登録
          </button>
          
          {/* テキスト入力で登録 */}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg 
                     hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>⌨️</span>
            テキストで登録
          </button>
        </div>
        
        {/* テキスト入力エリア（インライン） */}
        {showTextInput && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                const items = textInput.split(',').map(item => item.trim()).filter(item => item);
                onMenuItemsChange([...menuItems, ...items]);
                setTextInput('');
                setShowTextInput(false);
              }
            }} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="日本酒名をカンマ区切りで入力（例: 獺祭, 久保田, 八海山）"
                  className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  登録
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 写真アップロードエリア（インライン） */}
        {showPhotoUpload && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
              {/* カメラ撮影用 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageProcessing(file);
                  }
                }}
              />
              {/* カメラロール用 */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageProcessing(file);
                  }
                }}
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    // モバイルデバイスではカメラ、デスクトップではファイル選択
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobile) {
                      fileInputRef.current?.click();
                    } else {
                      // デスクトップではファイル選択
                      galleryInputRef.current?.click();
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isOCRProcessing}
                >
                  {isOCRProcessing ? (
                    <>
                      <span className="animate-spin inline-block mr-2">⏳</span>
                      処理中...
                    </>
                  ) : (
                    <>📷 カメラで撮影</>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    // カメラロール用のinputをクリック
                    galleryInputRef.current?.click();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isOCRProcessing}
                >
                  <>🖼️ ギャラリーから選択</>
                </button>
              </div>
              <p className="text-sm text-gray-600">
                メニューの写真から日本酒を自動で検出します
              </p>
              
              {/* 処理状態表示 */}
              {isOCRProcessing && (
                <div className="mt-4 p-3 bg-white rounded-lg animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin text-xl">⏳</span>
                    <span className="text-blue-600 font-medium">{ocrProcessingStatus}</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPhotoUpload(false)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
          </div>
        )}
        
        {/* 写真読み取り結果表示 */}
        {photoResults.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-semibold text-green-800 mb-2">📷 写真から検出された日本酒</h3>
            <div className="flex flex-wrap gap-2">
              {photoResults.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 border border-green-300 text-green-800"
                >
                  {item}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                setPhotoResults([]);
                setNoSakeDetected(false);
              }}
              className="mt-2 text-sm text-green-600 hover:text-green-800"
            >
              結果をクリア
            </button>
          </div>
        )}
        
        {/* OCR処理中の状態表示 */}
        {isOCRProcessing && (
          <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-3">
              <span className="animate-spin text-2xl">⏳</span>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">画像を解析中...</h3>
                <p className="text-sm text-blue-600">{ocrProcessingStatus || 'メニューから日本酒を検出しています'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 日本酒が検出されなかった場合の表示 */}
        {noSakeDetected && photoResults.length === 0 && !isOCRProcessing && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-semibold text-orange-800 mb-2">⚠️ 日本酒が検出されませんでした</h3>
            <p className="text-sm text-orange-700 mb-3">
              以下をお試しください：
            </p>
            <ul className="text-sm text-orange-700 space-y-1 mb-3">
              <li>• 文字がはっきり見える角度で撮影</li>
              <li>• 照明を明るくして撮影</li>
              <li>• 日本酒の銘柄名が写っているか確認</li>
              <li>• 手動でテキスト入力を試す</li>
            </ul>
            <button
              onClick={() => setNoSakeDetected(false)}
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              このメッセージを閉じる
            </button>
          </div>
        )}
        
        {/* データ取得中の表示 */}
        {menuItems.length > 0 && !isOCRProcessing && isLoadingMenuData && (
          <div className="mt-4 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🍾</span>
              メニューの日本酒比較
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin text-xl">⏳</span>
                  <span className="text-blue-600 font-medium">データ取得中...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* メニューの日本酒比較 */}
        {menuItems.length > 0 && !isOCRProcessing && !isLoadingMenuData && (
          <div className="mt-4 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🍾</span>
              メニューの日本酒比較
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  {menuSakeData.length + notFoundItems.length}件の日本酒が登録されています
                  {menuSakeData.length > 0 && ` (データあり: ${menuSakeData.length}件)`}
                  {notFoundItems.length > 0 && ` (データなし: ${notFoundItems.length}件)`}
                </span>
                <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // データありの日本酒のみを一括で比較リストに追加
                        const sakesToAdd = menuSakeData.filter(sake => !isInComparison(sake.id));
                        if (sakesToAdd.length === 0) {
                          alert('すべての日本酒が既に比較リストに追加されています');
                          return;
                        }
                        if (comparisonList.length + sakesToAdd.length > 10) {
                          alert(`比較リストは10件までです。現在${comparisonList.length}件登録済みのため、${10 - comparisonList.length}件まで追加できます。`);
                          return;
                        }
                        sakesToAdd.forEach(sake => onToggleComparison(sake));
                        alert(`${sakesToAdd.length}件の日本酒を比較リストに追加しました`);
                      }}
                      disabled={menuSakeData.length === 0}
                      className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      一括登録
                    </button>
                    <button
                      onClick={() => {
                        onMenuItemsChange([]);
                        setMenuSakeData([]);
                        setNotFoundItems([]);
                      }}
                      className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50"
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
                    className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => onSelectSake(sake)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {sake.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {sake.brewery}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full mt-1">
                          データあり
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            
                            // 比較リストに追加する場合の件数チェック
                            if (!isInComparison(sake.id) && comparisonList.length >= 10) {
                              alert('比較リストは10件までです。他のアイテムを削除してから追加してください。');
                              return;
                            }
                            
                            onToggleComparison(sake);
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            isInComparison(sake.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isInComparison(sake.id) ? '比較中' : '比較'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedItems = menuItems.filter(item => item !== sake.name);
                            onMenuItemsChange(updatedItems);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* APIで見つからなかった日本酒 */}
                {notFoundItems.map((sakeName, index) => (
                  <div
                    key={`not-found-${index}`}
                    className="bg-white p-3 rounded-lg border border-gray-200 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-700 truncate">
                          {sakeName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          情報が見つかりません
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full mt-1">
                          データなし
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                          比較不可
                        </span>
                        <button
                          onClick={() => {
                            const updatedItems = menuItems.filter(item => item !== sakeName);
                            onMenuItemsChange(updatedItems);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            <div className="h-96 md:h-[500px] lg:h-[600px]">
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

      {/* レコメンド機能 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">💡</span>
          飲食店向けレコメンド
        </h2>
        
        {menuItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            メニューを登録すると、レコメンド機能が利用できます
          </p>
        ) : (
          <div className="space-y-4">
            {/* レコメンドタイプ選択 */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setRecommendationType('similarity');
                  setShowRecommendations(true);
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  recommendationType === 'similarity' && showRecommendations
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎯 お気に入りに近い順
              </button>
              <button
                onClick={() => {
                  setRecommendationType('pairing');
                  setShowRecommendations(true);
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  recommendationType === 'pairing' && showRecommendations
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🍴 料理に合わせる
              </button>
              <button
                onClick={() => {
                  setRecommendationType('random');
                  setShowRecommendations(true);
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  recommendationType === 'random' && showRecommendations
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎲 おすすめガチャ
              </button>
            </div>
            
            {/* レコメンド結果表示 */}
            {showRecommendations && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-3">
                  {recommendationType === 'similarity' && '🎯 あなたの好みに近い順'}
                  {recommendationType === 'pairing' && '🍴 料理とのペアリング'}
                  {recommendationType === 'random' && '🎲 今日のおすすめ'}
                </h3>
                
                {recommendationType === 'pairing' && (
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="料理名を入力（例: 刺身、焼き魚、天ぷら）"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  {/* デモ用のレコメンド結果 */}
                  {menuItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-semibold">{item}</p>
                          <p className="text-sm text-gray-600">
                            {recommendationType === 'similarity' && 'マッチ度: ' + (95 - index * 5) + '%'}
                            {recommendationType === 'pairing' && '相性: ★'.repeat(5 - index)}
                            {recommendationType === 'random' && ['本日のラッキー酒', '隠れた名酒', '新しい発見'][index]}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleIndividualAdd(item)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        比較に追加
                      </button>
                    </div>
                  ))}
                </div>
                
              </div>
            )}
          </div>
        )}
      </div>

      {/* メニュースキャナーモーダル */}
      {showMenuScanner && (
        <MenuScanner
          onClose={() => setShowMenuScanner(false)}
          onSakeFound={handleSakeFound}
          onMultipleSakeFound={handleMultipleSakeFound}
          onIndividualAdd={handleIndividualAdd}
          onIndividualRemove={handleIndividualRemove}
        />
      )}
    </div>
  );
};