'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Tesseract from 'tesseract.js';

interface MenuScannerProps {
  onSakeFound: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onMultipleSakeFound?: (sakeNames: string[]) => void;
  onRemoveFromComparison?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onClose: () => void;
}

export default function MenuScanner({ onSakeFound, onMultipleSakeFound, onRemoveFromComparison, onClose }: MenuScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [foundSakeNames, setFoundSakeNames] = useState<string[]>([]);
  const [sakeStatus, setSakeStatus] = useState<Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>>(new Map());
  const [useHighPerformanceOCR] = useState(true); // デフォルトをAI画像解析に
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // 適応型画像最適化（Vercel Hobby制限対応）
  const optimizeImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        const originalWidth = img.width;
        const originalHeight = img.height;
        const maxDimension = Math.max(originalWidth, originalHeight);
        
        // 適応型判定：1400px以下は高品質、超える場合は品質を下げる
        const isLargeImage = maxDimension > 1400;
        
        let width = originalWidth;
        let height = originalHeight;
        let outputFormat: 'png' | 'jpeg' = 'png';
        let quality = 1.0;
        let applyEnhancement = true;

        if (isLargeImage) {
          // 大きな画像：大幅に圧縮
          const maxSize = 800; // さらに小さく制限
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          outputFormat = 'jpeg';
          quality = 0.7; // 品質をさらに下げる
          applyEnhancement = false; // 処理負荷軽減
          console.log(`Large image detected (${maxDimension}px), using compressed mode`);
        } else {
          // 小さな画像：適度に制限
          const maxSize = 1200; // 小さな画像でも制限
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          console.log(`Small image detected (${maxDimension}px), using high quality mode`);
        }

        canvas.width = width;
        canvas.height = height;
        
        // 高品質スケーリング
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 白背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // 小さな画像のみコントラスト強化（文字認識向け）
        if (applyEnhancement) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const enhanced = brightness > 128 ? Math.min(255, brightness * 1.15) : Math.max(0, brightness * 0.85);
            
            data[i] = enhanced;     // R
            data[i + 1] = enhanced; // G
            data[i + 2] = enhanced; // B
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        // 適応型出力
        const result = outputFormat === 'png' 
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality);
        
        const sizeKB = Math.round(result.length * 0.75 / 1024);
        const sizeMB = (sizeKB / 1024).toFixed(2);
        
        console.log(`Image optimized: ${sizeKB}KB (${sizeMB}MB) - Mode: ${isLargeImage ? 'compressed' : 'high-quality'}`);
        
        // Vercel制限チェック（4.5MB）
        if (sizeKB > 4500) {
          console.warn('Image size exceeds 4.5MB limit, may cause issues on Vercel');
        }
        
        resolve(result);
      };
      img.src = imageUrl;
    });
  };

  // ファイル選択処理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        // 大きな画像も自動的に最適化される
        const optimized = await optimizeImage(dataUrl);
        setImage(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  // カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // 背面カメラを優先
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('カメラアクセスエラー:', error);
      alert('カメラにアクセスできません');
    }
  };

  // 写真撮影
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.8);
        const optimized = await optimizeImage(dataURL);
        setImage(optimized);
        stopCamera();
      }
    }
  };

  // カメラ停止
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // 画像の前処理（シンプルなコントラスト調整） - 未使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const preprocessImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // 解像度を調整（大きすぎる場合はリサイズ）
        const maxWidth = 2000;
        const maxHeight = 2000;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // 背景を白にする
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
        // 軽いコントラスト調整のみ
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(canvas, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageUrl;
    });
  };

  // Gemini Vision API処理（推奨）
  const processWithGeminiVision = async (imageData: string) => {
    try {
      setProcessingStatus('🚀 Gemini AIで解析中...');
      
      // 15秒タイムアウトを設定（Vercel制限を考慮）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('/api/gemini-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const result = await response.json();
      
      // デバッグ: APIレスポンスの詳細をログ出力
      console.log('=== Frontend: Gemini API Response ===');
      console.log('Result:', result);
      console.log('Text field present:', !!result.text);
      console.log('Text length:', result.text?.length);
      if (result.text) {
        console.log('First 100 chars of text:', result.text.slice(0, 100));
        console.log('Text char codes (first 10):');
        for (let i = 0; i < Math.min(10, result.text.length); i++) {
          console.log(`  Char ${i}: "${result.text[i]}" (code: ${result.text.charCodeAt(i)})`);
        }
      }
      console.log('Sake names:', result.sake_names);
      
      // タイムアウトエラーの場合
      if (result.timeout) {
        setProcessingStatus('⚠️ Gemini APIがタイムアウトしました。Cloud Visionにフォールバック中...');
        return await processWithCloudVision(imageData);
      }
      
      if (result.error && result.fallback) {
        // Gemini APIエラー時はエラーメッセージを表示
        if (result.error === 'Gemini API key not configured') {
          throw new Error('Gemini APIキーが設定されていません。設定を確認してください。');
        } else if (result.timeout) {
          throw new Error('画像解析がタイムアウトしました。画像サイズを小さくして再試行してください。');
        } else {
          throw new Error(`画像解析に失敗しました: ${result.error}`);
        }
      }
      
      // Geminiの結果を既存の形式に変換
      return {
        text: result.text || '',
        confidence: result.confidence || 0,
        sake_names: result.sake_names || [],
        provider: 'gemini'
      };
    } catch (error: unknown) {
      console.error('Gemini Vision API Error:', error);
      
      // タイムアウトエラーの場合
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('画像解析がタイムアウトしました。画像サイズを小さくして再試行してください。');
      } else {
        throw new Error('Gemini APIとの接続に失敗しました。しばらく待ってから再試行してください。');
      }
    }
  };

  // Google Cloud Vision API処理（フォールバック）
  const processWithCloudVision = async (imageData: string) => {
    try {
      setProcessingStatus('Google Cloud Visionで解析中...');
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();
      
      if (result.error && result.fallback) {
        // APIキーが設定されていない場合はTesseractにフォールバック
        setProcessingStatus('Tesseract.jsにフォールバック中...');
        return await processWithTesseract(imageData);
      }
      
      return { ...result, provider: 'google-cloud-vision' };
    } catch (error) {
      console.error('Cloud Vision API Error:', error);
      setProcessingStatus('Cloud Vision API接続エラー。Tesseract.jsにフォールバック中...');
      return await processWithTesseract(imageData);
    }
  };

  // 画像前処理（OCR向けに最適化）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const preprocessImageForOCR = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // 高解像度を維持（OCRには重要）
        const scale = Math.min(3000 / img.width, 3000 / img.height, 3);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 高品質スケーリング
        ctx.imageSmoothingEnabled = false;
        
        // 背景を白に
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 画像データを取得してコントラスト調整
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // グレースケール化
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // 適応的二値化（Otsu's method簡易版）
          const threshold = 140; // 手書き文字に適した閾値
          const value = gray > threshold ? 255 : 0;
          
          data[i] = value;     // R
          data[i + 1] = value; // G
          data[i + 2] = value; // B
          // data[i + 3] はアルファ値（そのまま）
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageUrl;
    });
  };

  // Tesseract.js処理（シンプル版）
  const processWithTesseract = async (imageData: string) => {
    try {
      setProcessingStatus('Tesseract.jsを初期化中...');
      
      // シンプルなアプローチ - 直接recognize関数を使用
      const result = await Tesseract.recognize(
        imageData,
        'jpn+eng', // 日本語＋英語
        {
          logger: (info) => {
            console.log('Tesseract状態:', info);
            if (info.status === 'loading language traineddata') {
              setProcessingStatus(`言語モデルを読み込み中... ${info.progress ? Math.round(info.progress * 100) + '%' : ''}`);
            } else if (info.status === 'initializing tesseract') {
              setProcessingStatus('Tesseractを初期化中...');
            } else if (info.status === 'recognizing text') {
              const percent = Math.round(info.progress * 100);
              setProcessingStatus(`文字を認識中... ${percent}%`);
            }
          }
        }
      );
      
      console.log('Tesseract認識結果:', result);
      console.log('認識された文字:', result.data.text);
      console.log('認識信頼度:', result.data.confidence);
      
      return { 
        text: result.data.text || '',
        confidence: result.data.confidence || 0
      };
    } catch (error) {
      console.error('Tesseract.jsエラー:', error);
      setProcessingStatus('❌ 全てのOCRエンジンで解析に失敗しました');
      
      // エラーでも空の結果を返す
      return { 
        text: '',
        confidence: 0,
        error: true
      };
    }
  };

  // OCR処理
  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProcessingStatus('画像を処理中...');
    setExtractedText('');
    setFoundSakeNames([]);

    try {
      let result;
      
      if (useHighPerformanceOCR) {
        // Gemini Vision API（エラー時は処理停止）
        result = await processWithGeminiVision(image);
      } else {
        // 標準OCR（Tesseract.js）を使用
        result = await processWithTesseract(image);
      }

      let text = result.text || '';
      let sakeNames = [];
      
      console.log('=== Final Processing Stage ===');
      console.log('OCR生結果:', text);
      console.log('Text length:', text.length);
      console.log('使用プロバイダー:', result.provider);
      
      // テキストの文字コードを詳細にチェック
      if (text && text.length > 0) {
        console.log('Character analysis (first 20 chars):');
        for (let i = 0; i < Math.min(20, text.length); i++) {
          const char = text[i];
          const code = char.charCodeAt(0);
          console.log(`  Position ${i}: "${char}" (Unicode: ${code}, Hex: 0x${code.toString(16)})`);
        }
      }
      
      // エラーの場合は処理を停止
      if (result.error) {
        setExtractedText('');
        setFoundSakeNames([]);
        console.log('OCR処理が全て失敗しました');
        return;
      }
      
      // Geminiが直接日本酒名を抽出した場合はそれを使用
      if (result.sake_names && result.sake_names.length > 0) {
        sakeNames = result.sake_names;
        setFoundSakeNames(sakeNames);
        setExtractedText(text);
        
        console.log('AI抽出された日本酒名:', sakeNames);
      } else {
        // 従来の文字コード正規化処理
        text = text.normalize('NFKC'); // Unicode正規化
        
        // 大量のスペースを除去
        text = text.replace(/\s+/g, ' '); // 連続スペースを単一スペースに
        text = text.replace(/^ +| +$/gm, ''); // 行頭・行末のスペースを除去
        
        // 不要な制御文字を除去
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
        
        // 分離した文字を結合する処理
        text = text.replace(/([あ-んア-ン一-龯]) +([あ-んア-ン一-龯])/g, '$1$2'); // 日本語文字間のスペース除去
        text = text.replace(/([ぁ-ゞァ-ヾ]) ([ぁ-ゞァ-ヾ])/g, '$1$2'); // ひらがな・カタカナ間のスペース除去
        
        // 明らかに意味のない短い行を除去
        const lines = text.split('\n').filter((line: string) => {
          const cleanLine = line.trim();
          return cleanLine.length > 1 || /[あ-んア-ン一-龯]/.test(cleanLine);
        });
        
        text = lines.join('\n');
        
        console.log('OCR結果（正規化前）:', result.text);
        console.log('OCR結果（正規化後）:', text);
        
        setExtractedText(text);

        // 従来のロジックで日本酒名を抽出
        sakeNames = extractSakeNames(text);
        setFoundSakeNames(sakeNames);
      }
    } catch (error) {
      console.error('OCR処理エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '文字認識に失敗しました';
      setProcessingStatus(`❌ ${errorMessage}`);
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // 日本酒名を抽出するロジック（改善版）
  const extractSakeNames = (text: string): string[] => {
    // テキストの正規化（改行、スペースを整理）
    const normalizedText = text.replace(/\s+/g, ' ').replace(/[。、]/g, ' ');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const sakeNames: string[] = [];

    // 拡張された日本酒ブランド名リスト
    const famousBrands = [
      // 人気銘柄
      '獺祭', '十四代', '久保田', '八海山', '剣菱', '白鶴', '菊正宗',
      '磯自慢', '飛露喜', '而今', '新政', '醸し人九平次', '鍋島',
      '伯楽星', '作', '雨後の月', '田酒', '出羽桜', '黒龍', '梵',
      // 追加の有名銘柄
      '風の森', '花陽浴', '写楽', '鳳凰美田', '雪の茅舎', '秋鹿',
      '賀茂鶴', '越乃寒梅', '〆張鶴', '真澄', '立山', '開運',
      '澤屋まつもと', '仙禽', '赤武', '日高見', '東洋美人', '竹鶴',
      // カタカナ表記も対応
      'ダッサイ', 'ジュウヨンダイ', 'クボタ', 'ハッカイサン',
      // 部分一致も試す
      '獺', '祭', '八海', '久保', '田酒', '黒龍', '而今',
    ];

    // 日本酒の種類キーワード
    const sakeTypes = [
      '純米大吟醸', '大吟醸', '純米吟醸', '吟醸', 
      '特別純米', '純米', '特別本醸造', '本醸造',
      '原酒', '生酒', '生詰', '生貯蔵', '無濾過', 
      '山廃', '生もと', '速醸', 'にごり'
    ];

    // 有名ブランドの検索（完全一致優先）
    famousBrands.forEach(brand => {
      if (normalizedText.includes(brand) || lines.some(line => line.includes(brand))) {
        // ブランド名のみ、または種類付きで追加
        sakeNames.push(brand);
      }
    });

    // 日本酒種類キーワードが含まれる行を検索
    lines.forEach(line => {
      sakeTypes.forEach(type => {
        if (line.includes(type)) {
          // キーワードの前にある文字列を銘柄名として抽出
          const index = line.indexOf(type);
          if (index > 0) {
            const possibleName = line.substring(0, index).trim();
            // 2文字以上20文字以下の日本語文字列
            if (possibleName.length >= 2 && possibleName.length <= 20 && 
                /^[ぁ-んァ-ヶー一-龠]+$/.test(possibleName)) {
              sakeNames.push(possibleName);
            }
          }
        }
      });
    });

    // 重複除去と空文字削除
    const uniqueNames = [...new Set(sakeNames)]
      .filter(name => name && name.length > 0)
      .slice(0, 10); // 最大10件まで

    return uniqueNames;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">メニュースキャン</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {!isCameraActive && !image && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                メニューの写真を撮影するか、ギャラリーから画像を選択してください
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📷 カメラで撮影
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  📁 ギャラリーから選択
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {isCameraActive && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📷 撮影
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {image && !isCameraActive && (
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
              </div>
              
              {/* AI解析設定（デフォルトでON） */}
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
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {isProcessing ? '解析中...' : '📷 メニューを解析'}
                </button>
                <button
                  onClick={() => {
                    setImage(null);
                    setExtractedText('');
                    setFoundSakeNames([]);
                  }}
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


              {/* 解析エラー時の表示 */}
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
                    onClick={() => {
                      setImage(null);
                      setExtractedText('');
                      setFoundSakeNames([]);
                      setProcessingStatus('');
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    別の画像で再試行
                  </button>
                </div>
              )}

              {foundSakeNames.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-green-800">見つかった日本酒 ({foundSakeNames.length}件):</h3>
                    <button
                      onClick={() => {
                        if (onMultipleSakeFound) {
                          onMultipleSakeFound(foundSakeNames);
                        } else {
                          foundSakeNames.forEach(name => onSakeFound(name));
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors"
                    >
                      🎯 全て比較に追加
                    </button>
                  </div>
                  <div className="space-y-2">
                    {foundSakeNames.map((name, index) => {
                      const status = sakeStatus.get(name)?.status || 'pending';
                      
                      const getStatusColor = () => {
                        switch (status) {
                          case 'added': return 'bg-green-50 border-green-300';
                          case 'not_found': return 'bg-orange-50 border-orange-300';
                          case 'limit_exceeded': return 'bg-white'; // 件数超過時は通常表示
                          default: return 'bg-white';
                        }
                      };
                      
                      const getStatusIcon = () => {
                        switch (status) {
                          case 'added': return '✓ 追加済み';
                          case 'not_found': return '❌ データなし';
                          case 'limit_exceeded': return ''; // 件数超過時は表示しない
                          default: return '';
                        }
                      };
                      
                      return (
                        <div key={index} className={`flex justify-between items-center p-2 rounded border ${getStatusColor()}`}>
                          <span className="font-medium flex items-center gap-2">
                            {name}
                            {status !== 'pending' && (
                              <span className={`text-sm ${
                                status === 'added' ? 'text-green-600' : 
                                status === 'not_found' ? 'text-orange-600' : 
                                'text-red-600'
                              }`}>
                                {getStatusIcon()}
                              </span>
                            )}
                          </span>
                          <div className="flex gap-2">
                            {status === 'added' ? (
                              <button
                                onClick={async () => {
                                  if (onRemoveFromComparison) {
                                    try {
                                      const result = await onRemoveFromComparison(name);
                                      if (result.success) {
                                        setSakeStatus(prev => new Map(prev).set(name, {
                                          status: 'pending',
                                          message: undefined
                                        }));
                                      }
                                    } catch (err) {
                                      console.error('削除エラー:', err);
                                    }
                                  }
                                }}
                                className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                              >
                                比較から削除
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    const result = await onSakeFound(name);
                                    setSakeStatus(prev => new Map(prev).set(name, {
                                      status: result.success ? 'added' : 
                                              result.message.includes('見つかりませんでした') ? 'not_found' :
                                              result.message.includes('既に比較リストにあります') ? 'added' :
                                              result.message.includes('4件まで') || result.message.includes('削除してから') ? 'limit_exceeded' : 'not_found',
                                      message: result.message
                                    }));
                                  } catch {
                                    setSakeStatus(prev => new Map(prev).set(name, {
                                      status: 'not_found',
                                      message: 'エラーが発生しました'
                                    }));
                                  }
                                }}
                                disabled={status === 'not_found'}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  status === 'not_found'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {status === 'not_found' ? '❌ データなし' : '比較に追加'}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setFoundSakeNames(prev => prev.filter((_, i) => i !== index));
                                setSakeStatus(prev => {
                                  const newMap = new Map(prev);
                                  newMap.delete(name);
                                  return newMap;
                                });
                              }}
                              className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
          )}
        </div>
      </div>
    </div>
  );
}