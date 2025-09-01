import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  sake_names?: string[];
  provider?: string;
  error?: boolean;
  timeout?: boolean;
  fallback?: boolean;
}

export async function processWithGeminiVision(
  imageData: string,
  setProcessingStatus: (status: string) => void
): Promise<OCRResult> {
  try {
    setProcessingStatus('解析中...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Vercel Pro Plan考慮で15秒
    
    const response = await fetch('/api/gemini-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`=== API Error Debug ===`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Result:`, result);
      
      // Vercel環境でのデバッグ情報を含める
      if (response.status === 500 && result.error?.includes('Gemini API key not configured')) {
        throw new Error('Gemini APIキーが設定されていません。Vercel Dashboard > Settings > Environment Variables で GEMINI_API_KEY を設定してください。');
      } else if (response.status === 413) {
        const sizeInfo = result.size ? ` (${result.size})` : '';
        throw new Error(`画像サイズが大きすぎます${sizeInfo}。より小さな画像をお使いください。自動圧縮機能が正常に動作しない場合があります。`);
      } else if (response.status === 408 || result.timeout) {
        const timeoutError = new Error('画像解析がタイムアウトしました（15秒）。画像が複雑すぎるため、画像サイズを小さくして再試行してください。');
        console.error('Throwing timeout error:', timeoutError.message);
        throw timeoutError;
      } else if (result.error) {
        // デバッグ情報があれば含める
        const debugInfo = result.debug ? ` (環境: ${result.debug.vercelEnv || 'unknown'})` : '';
        throw new Error(result.error + debugInfo);
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
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
    
    if (result.timeout) {
      setProcessingStatus('⚠️ Gemini APIがタイムアウトしました。Cloud Visionにフォールバック中...');
      return await processWithCloudVision(imageData, setProcessingStatus);
    }
    
    if (result.error && result.fallback) {
      if (result.error === 'Gemini API key not configured') {
        throw new Error('Gemini APIキーが設定されていません。設定を確認してください。');
      } else if (result.timeout) {
        throw new Error('画像解析がタイムアウトしました。画像サイズを小さくして再試行してください。');
      } else {
        throw new Error(`画像解析に失敗しました: ${result.error}`);
      }
    }
    
    return {
      text: result.text || '',
      confidence: result.confidence || 0,
      sake_names: result.sake_names || [],
      provider: 'gemini'
    };
  } catch (error: unknown) {
    console.error('Gemini Vision API Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('画像解析がタイムアウトしました。画像サイズを小さくして再試行してください。');
    } else {
      throw new Error('Gemini APIとの接続に失敗しました。しばらく待ってから再試行してください。');
    }
  }
}

export async function processWithCloudVision(
  imageData: string,
  setProcessingStatus: (status: string) => void
): Promise<OCRResult> {
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
      setProcessingStatus('Tesseract.jsにフォールバック中...');
      return await processWithTesseract(imageData, setProcessingStatus);
    }
    
    return { ...result, provider: 'google-cloud-vision' };
  } catch (error) {
    console.error('Cloud Vision API Error:', error);
    setProcessingStatus('Cloud Vision API接続エラー。Tesseract.jsにフォールバック中...');
    return await processWithTesseract(imageData, setProcessingStatus);
  }
}

export async function processWithTesseract(
  imageData: string,
  setProcessingStatus: (status: string) => void
): Promise<OCRResult> {
  try {
    setProcessingStatus('Tesseract.jsを初期化中...');
    
    const result = await Tesseract.recognize(
      imageData,
      'jpn+eng',
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
      confidence: result.data.confidence || 0,
      provider: 'tesseract'
    };
  } catch (error) {
    console.error('Tesseract.jsエラー:', error);
    setProcessingStatus('❌ 全てのOCRエンジンで解析に失敗しました');
    
    return { 
      text: '',
      confidence: 0,
      error: true,
      provider: 'tesseract'
    };
  }
}

export function extractSakeNames(text: string): string[] {
  const normalizedText = text.replace(/\s+/g, ' ').replace(/[。、]/g, ' ');
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const sakeNames: string[] = [];

  const famousBrands = [
    '獺祭', '十四代', '久保田', '八海山', '剣菱', '白鶴', '菊正宗',
    '磯自慢', '飛露喜', '而今', '新政', '醸し人九平次', '鍋島',
    '伯楽星', '作', '雨後の月', '田酒', '出羽桜', '黒龍', '梵',
    '風の森', '花陽浴', '写楽', '鳳凰美田', '雪の茅舎', '秋鹿',
    '賀茂鶴', '越乃寒梅', '〆張鶴', '真澄', '立山', '開運',
    '澤屋まつもと', '仙禽', '赤武', '日高見', '東洋美人', '竹鶴',
    'ダッサイ', 'ジュウヨンダイ', 'クボタ', 'ハッカイサン',
    '獺', '祭', '八海', '久保', '田酒', '黒龍', '而今',
  ];

  const sakeTypes = [
    '純米大吟醸', '大吟醸', '純米吟醸', '吟醸', 
    '特別純米', '純米', '特別本醸造', '本醸造',
    '原酒', '生酒', '生詰', '生貯蔵', '無濾過', 
    '山廃', '生もと', '速醸', 'にごり'
  ];

  famousBrands.forEach(brand => {
    if (normalizedText.includes(brand) || lines.some(line => line.includes(brand))) {
      sakeNames.push(brand);
    }
  });

  lines.forEach(line => {
    sakeTypes.forEach(type => {
      if (line.includes(type)) {
        const index = line.indexOf(type);
        if (index > 0) {
          const possibleName = line.substring(0, index).trim();
          if (possibleName.length >= 2 && possibleName.length <= 20 && 
              /^[ぁ-んァ-ヶー一-龠]+$/.test(possibleName)) {
            sakeNames.push(possibleName);
          }
        }
      }
    });
  });

  const uniqueNames = [...new Set(sakeNames)]
    .filter(name => name && name.length > 0)
    .slice(0, 10);

  return uniqueNames;
}

export function normalizeOCRText(text: string): string {
  text = text.normalize('NFKC');
  
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/^ +| +$/gm, '');
  
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  text = text.replace(/([あ-んア-ン一-龯]) +([あ-んア-ン一-龯])/g, '$1$2');
  text = text.replace(/([ぁ-ゞァ-ヾ]) ([ぁ-ゞァ-ヾ])/g, '$1$2');
  
  const lines = text.split('\n').filter((line: string) => {
    const cleanLine = line.trim();
    return cleanLine.length > 1 || /[あ-んア-ン一-龯]/.test(cleanLine);
  });
  
  return lines.join('\n');
}