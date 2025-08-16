import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ 
        error: 'No image data provided' 
      }, { status: 400 });
    }
    
    // 画像のMIMEタイプを検出
    const mimeTypeMatch = image.match(/^data:image\/([a-z]+);base64,/);
    const mimeType = mimeTypeMatch ? `image/${mimeTypeMatch[1]}` : 'image/jpeg';
    
    // 画像データからbase64部分を取得
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // base64データの妥当性を簡易チェック
    if (!base64Data || base64Data.length < 100) {
      return NextResponse.json({ 
        error: 'Invalid image data provided' 
      }, { status: 400 });
    }
    
    // Gemini API キー（環境変数から取得）
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    // Gemini Vision APIを呼び出し（30秒タイムアウト付き）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Vercel用に8秒に短縮
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
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
            temperature: 0.2,  // 少し上げて柔軟性を持たせる
            topK: 2,
            topP: 0.9,
            maxOutputTokens: 2048,  // より長い出力を許可
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
        }),
      }
    ).finally(() => clearTimeout(timeoutId));

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    
    // デバッグ: Gemini APIの生レスポンスをログ出力
    console.log('=== Gemini API Raw Response ===');
    console.log('Status:', geminiResponse.status);
    console.log('Headers:', geminiResponse.headers);
    console.log('Result structure:', JSON.stringify(geminiResult, null, 2).slice(0, 500));
    
    // レスポンスからテキストを抽出
    let extractedText = '';
    let parsedResult = null;
    
    if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
      extractedText = geminiResult.candidates[0].content.parts[0].text;
      
      // デバッグ: 抽出されたテキストの詳細
      console.log('=== Extracted Text Details ===');
      console.log('Text length:', extractedText.length);
      console.log('First 200 chars:', extractedText.slice(0, 200));
      console.log('Text encoding check (first 10 chars):');
      for (let i = 0; i < Math.min(10, extractedText.length); i++) {
        console.log(`  Char ${i}: "${extractedText[i]}" (code: ${extractedText.charCodeAt(i)})`);
      }
      
      // JSONレスポンスをパース
      try {
        // JSONの前後にある説明文を除去
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          console.log('=== Parsed JSON Result ===');
          console.log(JSON.stringify(parsedResult, null, 2));
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // JSONパースに失敗した場合、テキストから銘柄名を抽出
        const lines = extractedText.split('\n');
        const sakeNames = lines
          .filter(line => line.includes('酒') || line.includes('山') || line.includes('鶴') || line.includes('櫻'))
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .slice(0, 10); // 最大10件
          
        parsedResult = {
          sake_names: sakeNames,
          confidence: 0.7,
          notes: 'JSON形式での応答に失敗したため、テキストから抽出しました'
        };
      }
    } else {
      console.error('=== No text found in Gemini response ===');
      console.log('Full geminiResult:', JSON.stringify(geminiResult, null, 2));
    }

    // raw_textがある場合はそれも含める（デバッグ用）
    const responseData = {
      text: parsedResult?.raw_text || extractedText,  // raw_textがあればそれを優先
      parsed: parsedResult,
      confidence: parsedResult?.confidence || 0,
      sake_names: parsedResult?.sake_names || [],
      provider: 'gemini-1.5-flash',
      debug: {
        originalText: extractedText,
        rawText: parsedResult?.raw_text
      }
    };
    
    console.log('=== Final API Response ===');
    console.log('Sake names found:', responseData.sake_names);
    console.log('Confidence:', responseData.confidence);
    
    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error('Gemini Vision API Error:', error);
    
    // タイムアウトエラーの場合
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ 
        text: '', 
        error: 'Gemini API timeout - please try again',
        fallback: true,
        timeout: true
      }, { status: 408 });
    }
    
    // その他のエラー
    const errorMessage = error instanceof Error ? error.message : 'Gemini vision analysis failed';
    return NextResponse.json({ 
      text: '', 
      error: errorMessage,
      fallback: true 
    }, { status: 500 });
  }
}