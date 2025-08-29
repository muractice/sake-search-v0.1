'use client';

import { useState, useRef } from 'react';

interface MenuInputSectionProps {
  onMenuItemsAdd: (items: string[], fromImageProcessing?: boolean) => void;
  onProcessImage: (imageData: string) => void;
  isProcessing: boolean;
  processingStatus?: string;
}

export const MenuInputSection = ({
  onMenuItemsAdd,
  onProcessImage,
  isProcessing,
  processingStatus
}: MenuInputSectionProps) => {
  const [textInput, setTextInput] = useState('');
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
      
      // FileをBase64データURLに変換
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log('MenuInputSection: Base64変換完了。データサイズ:', dataUrl.length);
        console.log('MenuInputSection: データ先頭100文字:', dataUrl.substring(0, 100));
        console.log('MenuInputSection: onProcessImage関数の型:', typeof onProcessImage);
        
        // 親コンポーネントにOCR処理を委譲
        console.log('MenuInputSection: onProcessImageを呼び出します...');
        onProcessImage(dataUrl);
        console.log('MenuInputSection: onProcessImage呼び出し完了');
      };
      reader.onerror = (error) => {
        console.error('ファイル読み込みエラー:', error);
      };
      console.log('FileReaderで読み込み開始...');
      reader.readAsDataURL(file);
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

        {/* OCR処理状態の表示 */}
        {isProcessing && (
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