import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Vercel Debug: Request Start ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Vercel Region:', process.env.VERCEL_REGION);
    
    const { image } = await request.json();
    
    if (!image) {
      console.log('DEBUG: No image data provided');
      return NextResponse.json({ 
        error: 'No image data provided' 
      }, { status: 400 });
    }
    
    // 画像のMIMEタイプを検出
    const mimeTypeMatch = image.match(/^data:image\/([a-z]+);base64,/);
    const mimeType = mimeTypeMatch ? `image/${mimeTypeMatch[1]}` : 'image/jpeg';
    console.log('DEBUG: Detected MIME type:', mimeType);
    
    // 画像データからbase64部分を取得
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // リクエストサイズをチェック（Vercel制限: 4.5MB）
    const imageSizeKB = Math.round(base64Data.length * 0.75 / 1024);
    const imageSizeMB = (imageSizeKB / 1024).toFixed(2);
    console.log(`DEBUG: Image size - ${imageSizeKB}KB (${imageSizeMB}MB)`);
    
    // Vercel制限チェック（4MB以下に制限）
    if (imageSizeKB > 4000) {
      console.log('ERROR: Image size exceeds Vercel limit');
      return NextResponse.json({ 
        error: `Image too large: ${imageSizeMB}MB (max 4MB for Vercel)`,
        size: imageSizeMB
      }, { status: 413 });
    }
    
    // base64データの妥当性を簡易チェック
    if (!base64Data || base64Data.length < 100) {
      console.log('ERROR: Invalid image data');
      return NextResponse.json({ 
        error: 'Invalid image data provided' 
      }, { status: 400 });
    }
    
    // Gemini API キー（環境変数から取得）
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('DEBUG: API key exists:', !!apiKey);
    console.log('DEBUG: API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.log('ERROR: Gemini API key not configured');
      return NextResponse.json({ 
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    // Gemini Vision APIを呼び出し（Vercel制限対応: 5秒タイムアウト）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Vercel用に5秒に短縮
    
    console.log('DEBUG: Starting Gemini API call');
    const requestStart = Date.now();
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
            {
              text: `この画像を分析して、日本酒メニューから日本酒の銘柄名を抽出してください。

タスク：
1. 画像内のテキストを正確に読み取る（OCR）
2. 日本酒の銘柄名を識別して抽出
3. 手書き文字の場合は、文脈から推測して読み取る

日本酒メニューの特徴：
- 銘柄名は通常2-6文字の漢字・ひらがなで構成
- 有名銘柄例：獺祭、八海山、久保田、田酒、十四代、而今、新政、伯楽星、黒龍、出羽桜
- 「純米大吟醸」「大吟醸」「純米吟醸」「特別純米」などの種類表記が付くことがある
- 価格（円、¥マーク）が併記されることが多い

画像が不鮮明で文字が読み取れない場合：
- 読み取れる部分のみを抽出
- 完全に読み取れない場合は空のリストを返す

必ず以下のJSON形式で返答してください：
{
  "sake_names": ["読み取れた銘柄名1", "銘柄名2"],
  "confidence": 0.0-1.0の信頼度,
  "notes": "画像の品質や認識に関する補足",
  "raw_text": "画像から読み取った生のテキスト（デバッグ用）"
}

JSONのみを返し、他の説明文は含めないでください。`
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 2,
        topP: 0.9,
        maxOutputTokens: 1024,  // Vercel用に短縮
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };
    
    const requestSizeKB = Math.round(JSON.stringify(requestBody).length / 1024);
    console.log(`DEBUG: Request body size: ${requestSizeKB}KB`);
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody)
      }
    ).finally(() => clearTimeout(timeoutId));
    
    const requestEnd = Date.now();
    console.log(`DEBUG: Gemini API call completed in ${requestEnd - requestStart}ms`);

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('ERROR: Gemini API failed:', geminiResponse.status, errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    console.log('DEBUG: Gemini API response received');
    
    // レスポンスからテキストを抽出
    let extractedText = '';
    let parsedResult = null;
    
    if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
      extractedText = geminiResult.candidates[0].content.parts[0].text;
      console.log('DEBUG: Text extracted, length:', extractedText.length);
      
      // JSONレスポンスをパース
      try {
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          console.log('DEBUG: JSON parsed successfully');
        }
      } catch {
        console.log('DEBUG: JSON parse failed, fallback to text extraction');
        // JSONパースに失敗した場合、テキストから銘柄名を抽出
        const sakeNames = extractedText
          .split(/[、。\n,]/)
          .filter(text => /[酒山鶴櫻祭海田政龍]/.test(text))
          .map(text => text.trim())
          .filter(text => text.length >= 2 && text.length <= 8)
          .slice(0, 5);
          
        parsedResult = {
          sake_names: sakeNames,
          confidence: 0.7,
          notes: 'JSON形式での応答に失敗したため、テキストから抽出しました'
        };
      }
    } else {
      console.error('ERROR: No text found in Gemini response');
      parsedResult = {
        sake_names: [],
        confidence: 0,
        notes: 'Gemini APIからのテキスト抽出に失敗しました'
      };
    }

    const responseData = {
      sake_names: parsedResult?.sake_names || [],
      confidence: parsedResult?.confidence || 0,
      provider: 'gemini-1.5-flash',
      vercel_debug: {
        imageSize: imageSizeMB,
        requestTime: requestEnd - requestStart,
        region: process.env.VERCEL_REGION || 'unknown'
      }
    };
    
    console.log('DEBUG: Final response:', JSON.stringify(responseData, null, 2));
    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error('=== VERCEL ERROR HANDLER ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // タイムアウトエラーの場合
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('ERROR: Request timeout (5 seconds)');
      return NextResponse.json({ 
        error: 'Request timeout - image too complex or server busy',
        timeout: true,
        vercel_info: {
          region: process.env.VERCEL_REGION || 'unknown',
          timeout: '5s'
        }
      }, { status: 408 });
    }
    
    // その他のエラー
    const errorMessage = error instanceof Error ? error.message : 'Gemini vision analysis failed';
    console.log('ERROR: Unhandled exception:', errorMessage);
    
    return NextResponse.json({ 
      error: errorMessage,
      vercel_info: {
        region: process.env.VERCEL_REGION || 'unknown',
        env: process.env.NODE_ENV || 'unknown'
      }
    }, { status: 500 });
  }
}