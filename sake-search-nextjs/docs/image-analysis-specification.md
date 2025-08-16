# 画像解析処理の仕様書

## 概要

本システムは、メニューの写真から日本酒の銘柄を自動認識するOCR（光学文字認識）機能を提供します。複数のOCRエンジンによるフォールバック機構を搭載し、高精度な文字認識を実現しています。

## 目次

1. [システム構成](#システム構成)
2. [フォールバック機構](#フォールバック機構)
3. [画像入力機能](#画像入力機能)
4. [OCRエンジン](#ocrエンジン)
5. [日本酒名抽出ロジック](#日本酒名抽出ロジック)
6. [画像最適化](#画像最適化)
7. [エラーハンドリング](#エラーハンドリング)
8. [パフォーマンス最適化](#パフォーマンス最適化)

## システム構成

### 主要コンポーネント

```
MenuScanner.tsx (Frontend)
├── カメラ撮影機能
├── ファイル選択機能
├── 画像最適化
├── OCR処理
└── 日本酒名抽出

API Routes (Backend)
├── /api/gemini-vision (Gemini AI)
├── /api/ocr (Google Cloud Vision)
└── Tesseract.js (フロントエンド)
```

## フォールバック機構

高精度かつ安定した認識を実現するため、以下の順序でフォールバックします：

### 1. 優先度順序

```
1. Gemini Vision AI (最高精度)
   ↓ 失敗時
2. Google Cloud Vision API (高精度)
   ↓ 失敗時
3. Tesseract.js (基本精度・ローカル処理)
```

### 2. フォールバック条件

- **Gemini AI**: API キー未設定、タイムアウト（30秒）、接続エラー
- **Cloud Vision**: API キー未設定、接続エラー
- **Tesseract.js**: 最終フォールバック（常に動作）

## 画像入力機能

### 1. カメラ撮影

```typescript
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'environment' } // 背面カメラ優先
  });
};
```

**特徴:**
- モバイル対応（背面カメラ優先）
- リアルタイムプレビュー
- 撮影品質: JPEG 80%

### 2. ファイル選択

```typescript
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  // 自動的に画像最適化が適用される
};
```

**対応形式:**
- JPEG, PNG, WebP
- 最大サイズ制限なし（自動最適化）

## OCRエンジン

### 1. Gemini Vision AI（推奨）

```typescript
const processWithGeminiVision = async (imageData: string) => {
  const response = await fetch('/api/gemini-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData }),
    signal: controller.signal, // 30秒タイムアウト
  });
};
```

**特徴:**
- 手書き文字対応
- 日本酒名の直接抽出
- 高精度な文脈理解
- タイムアウト: 30秒

**レスポンス形式:**
```json
{
  "text": "認識されたテキスト",
  "confidence": 0.95,
  "sake_names": ["獺祭", "久保田"],
  "provider": "gemini"
}
```

### 2. Google Cloud Vision API

```typescript
const processWithCloudVision = async (imageData: string) => {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData }),
  });
};
```

**特徴:**
- 印刷文字に最適化
- 高い信頼性
- 文字位置情報提供

### 3. Tesseract.js（ローカル）

```typescript
const processWithTesseract = async (imageData: string) => {
  const result = await Tesseract.recognize(
    imageData,
    'jpn+eng', // 日本語 + 英語
    {
      logger: (info) => {
        // プログレス表示
        setProcessingStatus(`認識中... ${Math.round(info.progress * 100)}%`);
      }
    }
  );
};
```

**特徴:**
- オフライン動作
- プログレス表示
- 言語: 日本語 + 英語

## 日本酒名抽出ロジック

### 1. 有名ブランド検索

```typescript
const famousBrands = [
  // 人気銘柄
  '獺祭', '十四代', '久保田', '八海山', '剣菱', '白鶴',
  // 地方銘柄
  '風の森', '花陽浴', '写楽', '鳳凰美田', '雪の茅舎',
  // カタカナ表記
  'ダッサイ', 'ジュウヨンダイ', 'クボタ',
];
```

### 2. 日本酒種類キーワード

```typescript
const sakeTypes = [
  '純米大吟醸', '大吟醸', '純米吟醸', '吟醸', 
  '特別純米', '純米', '特別本醸造', '本醸造',
  '原酒', '生酒', '生詰', '生貯蔵', '無濾過'
];
```

### 3. 抽出アルゴリズム

1. **完全一致検索**: 有名ブランド名の完全一致
2. **パターンマッチング**: `銘柄名 + 種類` の組み合わせ
3. **正規表現**: 日本語文字列の形式チェック
4. **文字数制限**: 2〜20文字の範囲
5. **重複除去**: 同一銘柄の重複を排除

## 画像最適化

### 1. 自動リサイズ

```typescript
const optimizeImage = async (imageUrl: string): Promise<string> => {
  const maxSize = 1200; // 最大サイズ
  const ratio = Math.min(maxSize / width, maxSize / height);
  
  // 高品質スケーリング
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // JPEG 85%品質で出力
  return canvas.toDataURL('image/jpeg', 0.85);
};
```

**最適化項目:**
- 最大サイズ: 1200px
- フォーマット: JPEG
- 品質: 85%
- 背景: 白色塗りつぶし

### 2. OCR向け前処理（未使用）

```typescript
const preprocessImageForOCR = async (imageUrl: string) => {
  // 高解像度維持
  const scale = Math.min(3000 / img.width, 3000 / img.height, 3);
  
  // グレースケール化 + 二値化
  const threshold = 140;
  const value = gray > threshold ? 255 : 0;
};
```

## エラーハンドリング

### 1. タイムアウト処理

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

fetch('/api/gemini-vision', {
  signal: controller.signal
}).finally(() => clearTimeout(timeoutId));
```

### 2. エラーメッセージ

| エラー種類 | メッセージ | 対応 |
|-----------|-----------|------|
| Gemini APIキー未設定 | `Gemini APIキーが未設定です` | Cloud Visionにフォールバック |
| タイムアウト | `Gemini APIがタイムアウトしました` | Cloud Visionにフォールバック |
| 接続エラー | `接続エラーが発生しました` | 次のエンジンにフォールバック |
| 全エンジン失敗 | `全てのOCRエンジンで解析に失敗` | ユーザーに再試行を促す |

### 3. デバッグ情報

```typescript
// 認識結果の詳細ログ
console.log('OCR生結果:', text);
console.log('使用プロバイダー:', result.provider);
console.log('文字コード解析:', text.split('').map(char => char.charCodeAt(0)));
```

## パフォーマンス最適化

### 1. 画像サイズ最適化

- **目的**: APIコール時間短縮、通信量削減
- **方法**: 1200px以下にリサイズ、JPEG圧縮85%
- **効果**: 処理速度向上、コスト削減

### 2. プログレス表示

```typescript
setProcessingStatus('🚀 Gemini AIで解析中...');
setProcessingStatus('言語モデルを読み込み中... 45%');
setProcessingStatus('文字を認識中... 78%');
```

### 3. 状態管理最適化

```typescript
const [sakeStatus, setSakeStatus] = useState<Map<string, {
  status: 'pending' | 'added' | 'not_found' | 'limit_exceeded',
  message?: string
}>>(new Map());
```

## UI機能

### 1. 結果表示

- **見つかった日本酒リスト**: 銘柄名と追加ボタン
- **ステータス表示**: 追加済み、データなし、件数超過
- **個別操作**: 追加、削除、リストから除外
- **一括操作**: 全て比較に追加

### 2. デバッグ機能

- **読み取りテキスト表示**: 認識されたテキスト全文
- **文字コード確認**: Unicode情報
- **エンコーディング情報**: UTF-8バイト数

## API仕様

### Gemini Vision API

**エンドポイント**: `/api/gemini-vision`

**リクエスト**:
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**レスポンス**:
```json
{
  "text": "認識されたテキスト",
  "confidence": 0.95,
  "sake_names": ["獺祭", "久保田"],
  "provider": "gemini"
}
```

### Google Cloud Vision API

**エンドポイント**: `/api/ocr`

**リクエスト**:
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**レスポンス**:
```json
{
  "text": "認識されたテキスト",
  "confidence": 0.92,
  "provider": "google-cloud-vision"
}
```

## 設定とセットアップ

### 環境変数

```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PRIVATE_KEY=your_private_key
GOOGLE_CLOUD_CLIENT_EMAIL=your_client_email
```

### 必要なパッケージ

```json
{
  "dependencies": {
    "tesseract.js": "^4.x.x",
    "@google-ai/generativelanguage": "^2.x.x",
    "@google-cloud/vision": "^4.x.x"
  }
}
```

## トラブルシューティング

### よくある問題

1. **画像が読み込まれない**
   - ファイル形式を確認（JPEG, PNG推奨）
   - ファイルサイズを確認（大きすぎる場合は自動最適化）

2. **文字認識精度が低い**
   - 照明を改善
   - 文字を大きく撮影
   - 印刷されたメニューを使用

3. **APIエラー**
   - 環境変数の設定確認
   - APIキーの有効性確認
   - ネットワーク接続確認

### ログ確認

```typescript
// ブラウザコンソールで確認
console.log('=== OCR Processing Log ===');
console.log('Provider:', result.provider);
console.log('Confidence:', result.confidence);
console.log('Extracted text:', result.text);
```

## 今後の改善案

1. **精度向上**
   - 手書き文字専用モデルの導入
   - 画像前処理の改善
   - 文脈理解の強化

2. **パフォーマンス向上**
   - エッジ処理の導入
   - キャッシュ機構の実装
   - 並列処理の最適化

3. **ユーザビリティ向上**
   - リアルタイム認識
   - 音声入力の併用
   - 手動補正機能