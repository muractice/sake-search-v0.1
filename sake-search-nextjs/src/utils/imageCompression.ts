/**
 * 画像圧縮ユーティリティ
 * Server Actionの2MB制限に収まるように画像を圧縮
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

/**
 * 画像ファイルを圧縮してBase64に変換
 * @param file 画像ファイル
 * @param options 圧縮オプション
 * @returns Base64エンコードされた圧縮画像
 */
export async function compressImageToBase64(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    maxSizeKB = 1500, // 1.5MB（Base64化後2MB以下を目指す）
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        try {
          // 初回圧縮
          let compressedData = await compressImage(
            img,
            file.type,
            maxWidth,
            maxHeight,
            quality
          );

          // サイズチェックと追加圧縮
          let currentQuality = quality;
          let attempts = 0;
          const maxAttempts = 5;

          while (getBase64SizeKB(compressedData) > maxSizeKB && attempts < maxAttempts) {
            attempts++;
            currentQuality *= 0.85; // 品質を15%ずつ下げる

            if (currentQuality < 0.3) {
              // 品質が低すぎる場合は解像度も下げる
              const scaleFactor = 0.8;
              compressedData = await compressImage(
                img,
                file.type,
                maxWidth * scaleFactor,
                maxHeight * scaleFactor,
                0.5
              );
              break;
            }

            compressedData = await compressImage(
              img,
              file.type,
              maxWidth,
              maxHeight,
              currentQuality
            );
          }

          // 最終サイズチェック
          const finalSizeKB = getBase64SizeKB(compressedData);
          if (finalSizeKB > maxSizeKB * 1.1) {
            // 10%の余裕を持って警告
            console.warn(
              `画像圧縮後もサイズが大きい: ${finalSizeKB}KB (目標: ${maxSizeKB}KB)`
            );
          }

          console.log(
            `画像圧縮完了: ${Math.round(file.size / 1024)}KB → ${finalSizeKB}KB`
          );

          resolve(compressedData);
        } catch (error) {
          reject(new Error(`画像圧縮エラー: ${error}`));
        }
      };

      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

/**
 * 画像を圧縮
 */
async function compressImage(
  img: HTMLImageElement,
  mimeType: string,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // アスペクト比を維持してリサイズ
    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    // 画像を描画
    ctx.drawImage(img, 0, 0, width, height);

    // Blobに変換してBase64化
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('画像の変換に失敗しました'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Base64データのサイズをKB単位で取得
 */
function getBase64SizeKB(base64Data: string): number {
  // data:image/jpeg;base64, の部分を除去してサイズ計算
  const base64 = base64Data.split(',')[1] || base64Data;
  const sizeInBytes = base64.length * 0.75;
  return Math.round(sizeInBytes / 1024);
}