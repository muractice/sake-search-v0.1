import { NextRequest, NextResponse } from 'next/server';

/**
 * @deprecated このAPIは非推奨です。代わりに /api/gemini-vision を使用してください。
 * 
 * このエンドポイントはGoogle Cloud Vision APIを使用していましたが、
 * 現在はGemini Vision APIに移行しています。
 * 
 * 新しいエンドポイント: /api/gemini-vision
 * - Gemini APIを使用した日本酒名の自動抽出
 * - より高精度な日本酒メニュー解析
 * - APIキーの設定が簡単（GEMINI_API_KEYのみ）
 */
export async function POST(request: NextRequest) {
  // このAPIは非推奨です。/api/gemini-vision を使用してください。
  console.warn('警告: このAPIは非推奨です。/api/gemini-vision を使用してください。');
  
  return NextResponse.json({ 
    text: '', 
    error: 'This API is deprecated. Please use /api/gemini-vision instead.',
    fallback: true 
  }, { status: 410 }); // 410 Gone
  
  /* 元の処理はコメントアウト（ScanService経由でGemini APIのみ使用）
  console.log('=== OCR API (DEPRECATED): リクエスト受信 ===');
  try {
    const requestBody = await request.json();
    console.log('OCR API: リクエストボディの型:', typeof requestBody);
    console.log('OCR API: リクエストボディのキー:', Object.keys(requestBody));
    
    const { image } = requestBody;
    console.log('OCR API: image フィールドの型:', typeof image);
    console.log('OCR API: image データサイズ:', image ? image.length : 0);
    
    // 画像データからbase64部分を取得
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('OCR API: base64Data サイズ:', base64Data.length);
    
    // Google Cloud Vision API キー（環境変数から取得）
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    console.log('OCR API: APIキーの存在:', !!apiKey);
    
    if (!apiKey) {
      // APIキーがない場合はTesseract.jsの結果を返す（フォールバック）
      return NextResponse.json({ 
        text: '', 
        error: 'Google Cloud Vision API key not configured',
        fallback: true 
      });
    }

    // Google Cloud Vision APIを呼び出し
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 50,
                },
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 50,
                }
              ],
              imageContext: {
                languageHints: ['ja', 'en'] // 日本語と英語を指定
              }
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionResult = await visionResponse.json();
    
    // レスポンスからテキストを抽出
    let extractedText = '';
    
    if (visionResult.responses?.[0]?.fullTextAnnotation?.text) {
      // DOCUMENT_TEXT_DETECTION の結果を優先
      extractedText = visionResult.responses[0].fullTextAnnotation.text;
    } else if (visionResult.responses?.[0]?.textAnnotations?.length > 0) {
      // TEXT_DETECTION の結果をフォールバック
      extractedText = visionResult.responses[0].textAnnotations[0].description || '';
    }

    return NextResponse.json({ 
      text: extractedText,
      confidence: visionResult.responses?.[0]?.fullTextAnnotation?.pages?.[0]?.confidence || 0,
      detectedBreaks: visionResult.responses?.[0]?.fullTextAnnotation?.pages?.[0]?.blocks?.length || 0
    });

  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ 
      text: '', 
      error: 'OCR processing failed',
      fallback: true 
    }, { status: 500 });
  }
  */
}