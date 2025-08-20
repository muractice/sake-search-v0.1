'use client';

import Image from 'next/image';

interface ScanImagePreviewProps {
  image: string;
  isProcessing: boolean;
  processingStatus: string;
  extractedText: string;
  foundSakeNames: string[];
  onProcessImage: () => void;
  onReset: () => void;
}

export default function ScanImagePreview({
  image,
  isProcessing,
  processingStatus,
  extractedText,
  foundSakeNames,
  onProcessImage,
  onReset
}: ScanImagePreviewProps) {
  // 画像サイズを計算
  const getImageSizeInfo = (base64Image: string) => {
    const sizeBytes = base64Image.length * 0.75; // base64のエンコード効率考慮
    const sizeKB = Math.round(sizeBytes / 1024);
    const sizeMB = (sizeKB / 1024).toFixed(2);
    
    return {
      sizeKB,
      sizeMB: parseFloat(sizeMB),
      displayText: sizeKB > 1024 ? `${sizeMB}MB` : `${sizeKB}KB`
    };
  };

  const sizeInfo = getImageSizeInfo(image);

  return (
    <div className="space-y-4">
      <div className="text-center relative">
        <Image 
          src={image} 
          alt="Selected" 
          width={800}
          height={600}
          className="max-w-full h-auto rounded-lg mx-auto"
          style={{ width: 'auto', height: 'auto' }}
        />
        
        {/* 画像サイズ情報表示 */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {sizeInfo.displayText}
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <div className="flex-1">
            <p className="font-medium text-purple-800">AI画像解析モード</p>
            <p className="text-xs text-purple-600">
              Gemini AIが手書きメニューも高精度で認識します
            </p>
          </div>
        </div>
      </div>

      {/* 画像サイズ警告 */}
      {sizeInfo.sizeKB > 1500 && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-orange-800">画像サイズが大きめです ({sizeInfo.displayText})</p>
              <p className="text-xs text-orange-600">
                Vercelでの処理が失敗する可能性があります。自動圧縮を適用済みです。
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-4 justify-center">
        <button
          onClick={onProcessImage}
          disabled={isProcessing}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
        >
          {isProcessing ? '解析中...' : '📷 メニューを解析'}
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          やり直し
        </button>
      </div>

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="mt-4 text-gray-600">{processingStatus || '文字を読み取っています...'}</span>
        </div>
      )}

      {!isProcessing && foundSakeNames.length === 0 && extractedText === '' && processingStatus.includes('❌') && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">❌</span>
            <h3 className="font-bold text-red-800">解析に失敗しました</h3>
          </div>
          <p className="text-red-700 text-sm mb-3">
            画像の解析に失敗しました。以下をお試しください：
          </p>
          <ul className="text-sm text-red-600 space-y-1 ml-4">
            <li>• より鮮明な画像を撮影し直す</li>
            <li>• 照明を良くする</li>
            <li>• メニューの文字が大きく写るように撮影する</li>
            <li>• 手書き文字の場合は印刷されたメニューを試す</li>
          </ul>
          <button
            onClick={onReset}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            別の画像で再試行
          </button>
        </div>
      )}

      {extractedText && (
        <details className="mt-4 p-4 bg-gray-50 rounded-lg">
          <summary className="cursor-pointer font-medium text-gray-700">
            読み取った全テキストを表示（デバッグ情報）
          </summary>
          <div className="mt-3 space-y-2">
            <div className="text-sm text-gray-600">
              <strong>文字数:</strong> {extractedText.length}文字
            </div>
            <div className="text-sm text-gray-600">
              <strong>エンコーディング情報:</strong>
              <div className="mt-1 text-xs bg-white p-2 rounded border">
                UTF-8: {new TextEncoder().encode(extractedText).length}バイト
              </div>
            </div>
            <div>
              <strong className="text-sm text-gray-700">認識されたテキスト:</strong>
              <div className="mt-2 p-3 bg-white border rounded text-sm font-mono max-h-32 overflow-y-auto">
                {extractedText.split('\n').map((line, index) => (
                  <div key={index} className="mb-1 border-b border-gray-100 pb-1">
                    <span className="text-gray-400 mr-2">{index + 1}:</span>
                    <span className="break-all">{line || '（空行）'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <strong className="text-sm text-gray-700">文字コード確認:</strong>
              <div className="mt-1 text-xs bg-white p-2 rounded border max-h-24 overflow-y-auto">
                {extractedText.slice(0, 100).split('').map((char, index) => (
                  <span key={index} className="inline-block mr-1 mb-1">
                    <span className="bg-blue-100 px-1 rounded">{char}</span>
                    <span className="text-gray-500 text-xs">({char.charCodeAt(0)})</span>
                  </span>
                )).slice(0, 20)}
                {extractedText.length > 20 && <span className="text-gray-500">...</span>}
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}