'use client';

import { useState, useRef } from 'react';

interface MenuInputSectionProps {
  onMenuItemsAdd: (items: string[]) => void;
  isProcessing: boolean;
  processingStatus?: string;
}

export const MenuInputSection = ({
  onMenuItemsAdd,
  isProcessing,
  processingStatus
}: MenuInputSectionProps) => {
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const lines = textInput.split('\n').filter(line => line.trim());
      onMenuItemsAdd(lines);
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
    const file = event.target.files?.[0];
    if (file) {
      // OCR処理は親コンポーネントに委譲
      // TODO: OCR処理を実装する場合は、onProcessImage propsを追加
      console.log('File selected:', file.name);
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