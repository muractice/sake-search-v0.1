/**
 * 画像スキャン用のリポジトリインターフェース
 */

export interface SakeDetectionResult {
  sake_names: string[];
  confidence: number;
  notes?: string;
  provider?: string;
}

export interface IScanRepository {
  /**
   * 画像から日本酒を検出する
   * @param base64Image Base64エンコードされた画像データ
   * @param mimeType 画像のMIMEタイプ
   * @returns 検出結果
   */
  detectSakeFromImage(
    base64Image: string,
    mimeType: string
  ): Promise<SakeDetectionResult>;
}