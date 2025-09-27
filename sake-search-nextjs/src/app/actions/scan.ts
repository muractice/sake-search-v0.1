'use server';

import { ScanService } from '@/services/ScanService';
import { GeminiScanRepository } from '@/repositories/scan/GeminiScanRepository';
import type { ScanResult } from '@/services/ScanService';

/**
 * 画像から日本酒メニューをスキャンする
 * @param imageData Base64エンコードされた画像データ（data:image/...形式）
 * @returns スキャン結果
 */
export async function scanSakeMenu(imageData: string): Promise<ScanResult> {
  try {
    // サーバー側でRepositoryを注入
    const scanRepository = new GeminiScanRepository();
    const scanService = new ScanService(scanRepository);

    // 画像処理とGemini API呼び出し
    const result = await scanService.processImageData(imageData);

    return result;
  } catch (error) {
    console.error('Server action scan error:', error);

    // エラーメッセージを適切に処理
    let errorMessage = '画像解析に失敗しました';

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = '画像解析がタイムアウトしました（30秒）';
      } else if (error.message.includes('API key')) {
        errorMessage = 'APIキーの設定に問題があります';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API制限に達しました。しばらくお待ちください';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}