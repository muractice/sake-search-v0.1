/**
 * Gemini Vision APIのテスト
 */

// Next.js環境をモック
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  }
}));

// fetch APIをモック
global.fetch = jest.fn();

describe('Gemini Vision API Tests', () => {
  let originalEnv;
  let originalConsole;

  beforeEach(() => {
    jest.clearAllMocks();
    // 元の環境変数を保存
    originalEnv = process.env.GEMINI_API_KEY;
    // テスト用のAPIキーを設定
    process.env.GEMINI_API_KEY = 'test-api-key';
    // コンソールログを抑制
    originalConsole = console.log;
    console.log = jest.fn();
    console.error = jest.fn();
    // モジュールキャッシュをクリア
    jest.resetModules();
  });

  afterEach(() => {
    // 元の環境変数を復元
    if (originalEnv) {
      process.env.GEMINI_API_KEY = originalEnv;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    // コンソールを復元
    if (originalConsole) {
      console.log = originalConsole;
    }
  });

  test('APIキーが設定されていない場合はエラーを返す', async () => {
    delete process.env.GEMINI_API_KEY;
    
    const { POST } = require('../../app/api/gemini-vision/route');
    const { NextResponse } = require('next/server');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        image: 'data:image/jpeg;base64,' + 'a'.repeat(200) // 十分な長さのbase64データ
      })
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { 
        error: 'Gemini API key not configured',
        debug: {
          env: 'test',
          vercel: undefined,
          vercelEnv: undefined,
          suggestion: 'Please set GEMINI_API_KEY in Vercel Dashboard > Settings > Environment Variables'
        }
      },
      { status: 500 }
    );
  });

  test('画像データが提供されていない場合はエラーを返す', async () => {
    const { POST } = require('../../app/api/gemini-vision/route');
    const { NextResponse } = require('next/server');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({})
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'No image data provided' },
      { status: 400 }
    );
  });

  test('Gemini APIからの正常なレスポンスを処理する', async () => {
    const mockGeminiResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: '{"sake_names": ["獺祭", "八海山"], "confidence": 0.9, "notes": "test"}'
            }]
          }
        }]
      })
    };

    global.fetch.mockResolvedValue(mockGeminiResponse);

    const { POST } = require('../../app/api/gemini-vision/route');
    const { NextResponse } = require('next/server');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        image: 'data:image/jpeg;base64,' + 'a'.repeat(200) // 十分な長さのbase64データ
      })
    };

    await POST(mockRequest);

    // fetchが正しいパラメータで呼ばれることを確認
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal)
      })
    );

    // 正常なレスポンスが返されることを確認
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        sake_names: ["獺祭", "八海山"],
        confidence: 0.9
      })
    );
  });

  test('タイムアウトエラーを適切に処理する', async () => {
    // AbortErrorをシミュレート
    const abortError = new Error('Abort Error');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValue(abortError);

    const { POST } = require('../../app/api/gemini-vision/route');
    const { NextResponse } = require('next/server');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        image: 'data:image/jpeg;base64,' + 'a'.repeat(200)
      })
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Request timeout'),
        timeout: true,
        vercel_info: expect.any(Object)
      }),
      { status: 408 }
    );
  });

  test('その他のエラーを適切に処理する', async () => {
    const genericError = new Error('Network error');
    global.fetch.mockRejectedValue(genericError);

    const { POST } = require('../../app/api/gemini-vision/route');
    const { NextResponse } = require('next/server');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        image: 'data:image/jpeg;base64,' + 'a'.repeat(200)
      })
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Network error'
      }),
      { status: 500 }
    );
  });

  test('JSON解析に失敗した場合のフォールバック処理', async () => {
    const mockGeminiResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: 'これは有効なJSONではありません。獺祭と八海山が見つかりました。'
            }]
          }
        }]
      })
    };

    global.fetch.mockResolvedValue(mockGeminiResponse);

    const { POST } = require('../../app/api/gemini-vision/route');
    const { NextResponse } = require('next/server');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        image: 'data:image/jpeg;base64,' + 'a'.repeat(200)
      })
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        sake_names: expect.arrayContaining([]),
        confidence: expect.any(Number)
      })
    );
  });
});