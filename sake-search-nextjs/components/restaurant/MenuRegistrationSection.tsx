'use client';

import { useState, useRef, useCallback } from 'react';
import { SakeData } from '@/types/sake';
import ComparisonPanel from '@/components/ComparisonPanel';
import TasteChart from '@/components/TasteChart';
import SakeRadarChartSection from '@/components/SakeRadarChartSection';
import { useScanOCR } from '@/hooks/scan/useScanOCR';
import { optimizeImageForScan } from '@/lib/scanImageOptimizer';

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
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [photoResults, setPhotoResults] = useState<string[]>([]);
  const [noSakeDetected, setNoSakeDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      setShowTextInput(false);
    }
  };

  const handleIndividualRemove = (item: string) => {
    onMenuItemsChange(menuItems.filter(menuItem => menuItem !== item));
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
          {/* 登録方法の選択ボタン */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setShowPhotoUpload(true);
                setShowTextInput(false);
              }}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">📷</span>
              写真から登録
            </button>
            <button
              onClick={() => {
                setShowTextInput(true);
                setShowPhotoUpload(false);
              }}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">⌨️</span>
              手入力で登録
            </button>
          </div>

          {/* 写真アップロードUI */}
          {showPhotoUpload && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700">写真から日本酒を検出</h3>
                <button
                  onClick={() => setShowPhotoUpload(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCameraCapture}
                  className="px-4 py-3 bg-white border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  📸 カメラで撮影
                </button>
                <button
                  onClick={handleGallerySelect}
                  className="px-4 py-3 bg-white border-2 border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  🖼️ ギャラリーから選択
                </button>
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
            </div>
          )}

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

          {/* テキスト入力UI */}
          {showTextInput && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700">日本酒名を入力</h3>
                <button
                  onClick={() => setShowTextInput(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="日本酒名を入力（改行で複数入力可）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
              />
              <button
                onClick={handleTextSubmit}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                登録
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メニュー一覧 */}
      {menuItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              {menuSakeData.length + notFoundItems.length}件の日本酒が登録されています
              {menuSakeData.length > 0 && ` (データあり: ${menuSakeData.length}件)`}
              {notFoundItems.length > 0 && ` (データなし: ${notFoundItems.length}件)`}
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
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
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
              >
                一括登録
              </button>
              <button
                onClick={() => {
                  onMenuItemsChange([]);
                }}
                className="text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg min-h-[44px] flex items-center justify-center"
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
          onToggleComparison={onToggleComparison}
          onClearComparison={onClearComparison}
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