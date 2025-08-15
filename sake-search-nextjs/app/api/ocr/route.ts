import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    // 画像データからbase64部分を取得
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Google Cloud Vision API キー（環境変数から取得）
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
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
}