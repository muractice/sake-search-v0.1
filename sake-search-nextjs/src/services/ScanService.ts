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
    timeout: 15000,
  };

  private async compressImage(file: File, options?: ScanServiceOptions): Promise<string> {
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

          const tryCompress = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                const sizeInMB = blob.size / (1024 * 1024);
                
                if (sizeInMB > config.maxSizeInMB && quality > 0.1) {
                  tryCompress(quality - 0.1);
                } else {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress(config.quality);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async processImage(
    file: File,
    setProcessingStatus?: (status: string) => void
  ): Promise<ScanResult> {
    try {
      setProcessingStatus?.('画像を圧縮中...');
      const compressedImage = await this.compressImage(file);
      
      const imageSizeInMB = (compressedImage.length * 3 / 4) / (1024 * 1024);
      console.log(`Compressed image size: ${imageSizeInMB.toFixed(2)} MB`);
      
      setProcessingStatus?.('画像を解析中...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_OPTIONS.timeout);
      
      try {
        const response = await fetch('/api/gemini-vision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: compressedImage }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        if (!response.ok) {
          if (response.status === 413) {
            return {
              success: false,
              error: '画像サイズが大きすぎます。より小さな画像をお試しください。',
            };
          } else if (response.status === 408 || result.timeout) {
            return {
              success: false,
              error: '画像解析がタイムアウトしました。画像を簡素化してお試しください。',
            };
          } else if (result.error) {
            return {
              success: false,
              error: result.error,
            };
          } else {
            return {
              success: false,
              error: `エラーが発生しました: ${response.statusText}`,
            };
          }
        }
        
        if (result.sake_names && result.sake_names.length > 0) {
          return {
            success: true,
            sake_names: result.sake_names,
            notes: result.notes,
            confidence: result.confidence,
          };
        } else {
          return {
            success: false,
            error: '日本酒が検出されませんでした',
            notes: result.notes,
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('ScanService error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: '画像解析がタイムアウトしました（15秒）',
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

  async processImageData(
    imageData: string,
    setProcessingStatus?: (status: string) => void
  ): Promise<ScanResult> {
    try {
      setProcessingStatus?.('画像を解析中...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_OPTIONS.timeout);
      
      try {
        const response = await fetch('/api/gemini-vision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: imageData }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        if (!response.ok) {
          if (response.status === 413) {
            return {
              success: false,
              error: '画像サイズが大きすぎます（2MB以下にしてください）',
            };
          } else if (response.status === 408 || result.timeout) {
            return {
              success: false,
              error: 'タイムアウトしました（画像が複雑すぎる可能性があります）',
            };
          } else if (result.error) {
            let errorMessage = '画像の処理に失敗しました';
            if (result.error.includes('API key')) {
              errorMessage = 'APIキーの設定に問題があります';
            } else if (result.error.includes('rate limit')) {
              errorMessage = 'API利用制限に達しました。しばらく待ってから再試行してください';
            } else {
              errorMessage = result.error;
            }
            return {
              success: false,
              error: errorMessage,
            };
          } else {
            return {
              success: false,
              error: `APIエラー (${response.status}): ${response.statusText}`,
            };
          }
        }
        
        if (result.sake_names && result.sake_names.length > 0) {
          return {
            success: true,
            sake_names: result.sake_names,
            notes: result.notes,
            confidence: result.confidence,
          };
        } else {
          let message = '日本酒が検出されませんでした';
          if (result.notes) {
            if (result.notes.includes('不鮮明') || result.notes.includes('解像度')) {
              message = '画像が不鮮明で読み取れませんでした';
            } else if (result.notes.includes('フィルタリング') || result.notes.includes('safety')) {
              message = '画像の内容が制限により処理できませんでした';
            }
          }
          return {
            success: false,
            error: message,
            notes: result.notes,
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('ScanService error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'タイムアウトしました（15秒）',
          };
        }
        if (error.message.includes('fetch')) {
          return {
            success: false,
            error: 'ネットワークエラーが発生しました',
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
}

export default new ScanService();