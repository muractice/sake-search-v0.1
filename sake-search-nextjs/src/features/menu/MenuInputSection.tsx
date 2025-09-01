'use client';

import { useState, useRef } from 'react';
import { optimizeImageForScan } from '@/lib/scanImageOptimizer';

interface MenuInputSectionProps {
  onMenuItemsAdd: (items: string[], fromImageProcessing?: boolean) => void;
  onProcessImage: (imageData: string) => void;
  isProcessing: boolean;
  processingStatus?: string;
}

interface ImageSize {
  width: number;
  height: number;
}

export const MenuInputSection = ({
  onMenuItemsAdd,
  onProcessImage,
  isProcessing,
  processingStatus
}: MenuInputSectionProps) => {
  const [textInput, setTextInput] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const lines = textInput.split('\n').filter(line => line.trim());
      // テキスト入力の場合はfromImageProcessing = false（デフォルト値）
      onMenuItemsAdd(lines, false);
      setTextInput('');
    }
  };

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
    console.log('=== 画像選択 ===');
    const file = event.target.files?.[0];
    console.log('選択されたファイル:', file);
    
    if (file) {
      console.log('ファイル名:', file.name);
      console.log('ファイルサイズ:', file.size);
      console.log('ファイルタイプ:', file.type);
      
      try {
        setIsOptimizing(true);
        console.log('MenuInputSection: 画像最適化を開始...');
        
        // FileをBase64データURLに変換
        const reader = new FileReader();
        const originalDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
        
        console.log('MenuInputSection: Base64変換完了。元画像サイズ:', originalDataUrl.length);
        
        // 画像最適化を実行
        const optimizedDataUrl = await optimizeImageForScan(originalDataUrl);
        console.log('MenuInputSection: 画像最適化完了。最適化後サイズ:', optimizedDataUrl.length);
        
        // 親コンポーネントにOCR処理を委譲
        console.log('MenuInputSection: onProcessImageを呼び出します...');
        onProcessImage(optimizedDataUrl);
        console.log('MenuInputSection: onProcessImage呼び出し完了');
        
      } catch (error) {
        console.error('MenuInputSection: 画像処理エラー:', error);
        alert('画像の処理に失敗しました。別の画像を試してください。');
      } finally {
        setIsOptimizing(false);
      }
    } else {
      console.warn('ファイルが選択されませんでした');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
        <span className="mr-2">📝</span>
        メニュー登録
      </h2>
      
      <div className="space-y-4">
        {/* 登録方法の選択 */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCameraCapture}
              disabled={isOptimizing || isProcessing}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="カメラで撮影"
            >
              <span className="text-2xl">📷</span>
            </button>
            <button
              onClick={handleGallerySelect}
              disabled={isOptimizing || isProcessing}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
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

        {/* 画像最適化状態の表示 */}
        {isOptimizing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">画像を最適化中...</span>
            </div>
          </div>
        )}

        {/* OCR処理状態の表示 */}
        {!isOptimizing && isProcessing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-700">{processingStatus || '画像を処理中...'}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};