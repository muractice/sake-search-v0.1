/**
 * Gemini APIを使用した画像スキャンリポジトリ
 */

import { IScanRepository, SakeDetectionResult } from './ScanRepository';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
    safetyRatings?: unknown;
  }>;
};

export class GeminiScanRepository implements IScanRepository {
  private apiKey: string;
  private modelId: string;
  private fallbackModels: string[];
  private timeout: number;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.apiKey = apiKey;
    this.modelId = process.env.GEMINI_MODEL_ID?.trim() || 'gemini-2.0-flash';
    this.fallbackModels = process.env.GEMINI_MODEL_FALLBACKS
      ?.split(',')
      .map(model => model.trim())
      .filter(Boolean) ?? ['gemini-2.5-flash', 'gemini-1.5-flash-002'];
    this.timeout = 30000; // 30秒
  }

  async detectSakeFromImage(
    base64Image: string,
    mimeType: string
  ): Promise<SakeDetectionResult> {
    // 画像サイズチェック
    const imageSizeKB = Math.round(base64Image.length * 0.75 / 1024);
    const isLargeMenu = imageSizeKB > 1500; // 1.5MB以上は大きいメニュー

    // リクエストボディを構築
    const requestBody = this.buildRequestBody(base64Image, mimeType, isLargeMenu);

    // モデル候補を準備
    const modelCandidates = this.getModelCandidates();

    // モデルを順番に試す
    let geminiResult: unknown = null;
    let selectedModel: string | null = null;
    let lastErrorDetails = '';

    for (const modelId of modelCandidates) {
      try {
        const result = await this.callGeminiAPI(modelId, requestBody);
        if (result) {
          geminiResult = result;
          selectedModel = modelId;
          break;
        }
      } catch (error) {
        if (error instanceof Error) {
          // APIキーやレート制限のエラーは即座に投げる
          if (error.message.includes('API key') || error.message.includes('rate limit')) {
            throw error;
          }
          lastErrorDetails = error.message;
        }
        console.warn(`Model ${modelId} failed, trying next...`);
      }
    }

    if (!geminiResult || !selectedModel) {
      throw new Error(
        `Gemini API error: no accessible model found. Tried: ${modelCandidates.join(', ')}. ${lastErrorDetails}`
      );
    }

    // レスポンスをパース
    return this.parseGeminiResponse(geminiResult as GeminiGenerateContentResponse, selectedModel);
  }

  private buildRequestBody(base64Image: string, mimeType: string, isLargeMenu: boolean) {
    const promptText = isLargeMenu
      ? this.getLargeMenuPrompt()
      : this.getStandardPrompt();

    return {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: isLargeMenu
        ? {
            temperature: 0.15,
            topK: 2,
            topP: 0.85,
            maxOutputTokens: 800,
          }
        : {
            temperature: 0.2,
            topK: 2,
            topP: 0.9,
            maxOutputTokens: 2048,
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
  }

  private getStandardPrompt(): string {
    return `この画像を分析して、日本酒メニューから日本酒の銘柄名を抽出してください。

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
  "notes": "画像の品質や認識に関する簡潔な補足"
}

JSONのみを返し、他の説明文は含めないでください。`;
  }

  private getLargeMenuPrompt(): string {
    return `画像から日本酒の銘柄名を抽出してください。

日本酒メニューの特徴:
- 銘柄は2-6文字の漢字/ひらがな
- 例: 獺祭、八海山、久保田、田酒、十四代、而今、新政、伯楽星、黒龍、出羽桜

最大20個まで抽出。

JSON形式で返答:
{"sake_names":["銘柄1","銘柄2"],"confidence":0.8,"notes":"補足"}

JSONのみ返答。`;
  }

  private getModelCandidates(): string[] {
    const defaultModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-001',
    ];

    return Array.from(
      new Set([
        this.modelId,
        ...this.fallbackModels,
        ...defaultModels,
      ].filter(Boolean))
    );
  }

  private async callGeminiAPI(modelId: string, requestBody: unknown): Promise<unknown | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      }).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.text();

      if (response.status === 400 && errorData.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key');
      }
      if (response.status === 403) {
        throw new Error('Gemini API key is not authorized');
      }
      if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded');
      }

      // 404はモデルが利用できないので、次のモデルを試す
      if (response.status === 404) {
        return null;
      }

      throw new Error(`Gemini API error [${modelId}]: ${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout (30s)');
      }
      throw error;
    }
  }

  private parseGeminiResponse(
    geminiResult: GeminiGenerateContentResponse,
    selectedModel: string
  ): SakeDetectionResult {
    // レスポンスからテキストを抽出
    let extractedText = '';
    if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
      extractedText = geminiResult.candidates[0].content.parts[0].text;
    }

    if (!extractedText) {
      return {
        sake_names: [],
        confidence: 0,
        notes: 'Gemini APIからテキストを抽出できませんでした',
        provider: selectedModel,
      };
    }

    try {
      // JSONをパース
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);

      return {
        sake_names: parsedResult.sake_names || [],
        confidence: parsedResult.confidence || 0,
        notes: parsedResult.notes,
        provider: selectedModel,
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        sake_names: [],
        confidence: 0,
        notes: 'レスポンスの解析に失敗しました',
        provider: selectedModel,
      };
    }
  }
}