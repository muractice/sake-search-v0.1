import type { IScanRepository } from '@/repositories/scan/ScanRepository';

export interface ScanResult {
  success: boolean;
  sake_names?: string[];
  error?: string;
  notes?: string;
  confidence?: number;
}

export interface ScanServiceOptions {
  maxSizeInMB?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  timeout?: number;
}

class ScanService {
  private readonly DEFAULT_OPTIONS: Required<ScanServiceOptions> = {
    maxSizeInMB: 2,
    quality: 0.9,
    maxWidth: 1920,
    maxHeight: 1920,
    timeout: 30000,
  };

  private scanRepository: IScanRepository;

  constructor(scanRepository: IScanRepository) {
    this.scanRepository = scanRepository;
  }

  /**
   * 画像データから日本酒を検出する（Server Action用）
   * @param imageData Base64エンコードされた画像データ（data:image/...形式）
   * @returns スキャン結果
   */
  async processImageData(imageData: string): Promise<ScanResult> {
    try {
      // MIMEタイプとBase64データを抽出
      const mimeMatch = imageData.match(/^data:([^;]+);base64,/);
      if (!mimeMatch) {
        return {
          success: false,
          error: '無効な画像データ形式です',
        };
      }

      const mimeType = mimeMatch[1];
      const base64Data = imageData.replace(/^data:[^;]+;base64,/, '');

      // 画像サイズチェック
      const imageSizeKB = Math.round(base64Data.length * 0.75 / 1024);
      const imageSizeMB = (imageSizeKB / 1024).toFixed(2);

      if (imageSizeKB > 2000) {
        return {
          success: false,
          error: `画像サイズが大きすぎます: ${imageSizeMB}MB (最大2MB)`,
        };
      }

      // Repository経由でGemini APIを呼び出し
      const result = await this.scanRepository.detectSakeFromImage(
        base64Data,
        mimeType
      );

      // 結果をScanResult形式に変換
      if (result.sake_names && result.sake_names.length > 0) {
        return {
          success: true,
          sake_names: result.sake_names,
          confidence: result.confidence,
          notes: result.notes,
        };
      } else {
        return {
          success: false,
          error: '日本酒が検出されませんでした',
          notes: result.notes,
        };
      }
    } catch (error) {
      console.error('ScanService error:', error);

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            success: false,
            error: '画像解析がタイムアウトしました（30秒）',
          };
        }
        if (error.message.includes('API key')) {
          return {
            success: false,
            error: 'APIキーの設定に問題があります',
          };
        }
        if (error.message.includes('rate limit')) {
          return {
            success: false,
            error: 'API制限に達しました。しばらくお待ちください',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: '画像処理中にエラーが発生しました',
      };
    }
  }

  /**
   * 画像ファイルを圧縮してBase64に変換する（クライアント用）
   * @param file 画像ファイル
   * @param options オプション
   * @returns Base64エンコードされた画像データ
   */
  async compressImage(file: File, options?: ScanServiceOptions): Promise<string> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          let { width, height } = img;

          if (width > config.maxWidth || height > config.maxHeight) {
            const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedReader = new FileReader();
              compressedReader.onload = () => {
                resolve(compressedReader.result as string);
              };
              compressedReader.onerror = reject;
              compressedReader.readAsDataURL(blob);
            },
            file.type,
            config.quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}

// エクスポート（互換性のため維持、ただし直接使用は非推奨）
export { ScanService };