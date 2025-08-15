# Gemini AI画像解析統合ガイド

## 🚀 実装完了

Gemini Vision APIを使用した超低コストの手書きメニュー認識機能を実装しました。

## 📋 実装内容

### 1. 新しいAPIエンドポイント
- **ファイル**: `/app/api/gemini-vision/route.ts`
- **機能**: Gemini 1.5 Flashによる画像解析と日本酒名抽出
- **出力**: JSON形式で日本酒名リストを返却

### 2. フォールバックシステム
```
🥇 Gemini AI (最優先)
    ↓ エラー時
🥈 Google Cloud Vision API
    ↓ エラー時  
🥉 Tesseract.js (最終手段)
```

### 3. UI更新
- **ラベル変更**: "高性能OCR" → "AI画像解析"
- **説明更新**: Gemini AIの利用を強調
- **手動入力**: 補助的な位置づけに変更

## 🔧 設定手順

### 1. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. 「Get API Key」をクリック
3. プロジェクトを選択または作成
4. APIキーを生成・コピー

### 2. 環境変数設定

`.env.local` ファイルに追加：

```bash
# Gemini AI（推奨）
GEMINI_API_KEY=your_gemini_api_key

# フォールバック用（オプション）
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 💰 コスト試算

### 月間5,000リクエストの場合

```
Gemini 2.5 Flash-Lite:
- 入力: 5,000 × 1,290トークン × $0.10/1M = $0.65
- 出力: 5,000 × 200トークン × $0.40/1M = $0.40
- 合計: $1.05/月 (約160円/月)
```

従来のClaude Vision ($35.99/月) と比較して **97%のコスト削減**！

## 🎯 使用方法

### ユーザー側
1. メニュー撮影画面で「🚀 AI画像解析」をチェック
2. 手書きメニューを撮影
3. Gemini AIが自動で日本酒名を抽出
4. 認識された銘柄を比較リストに追加

### 開発者側
```typescript
// API呼び出し例
const response = await fetch('/api/gemini-vision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64Image }),
});

const result = await response.json();
// result.sake_names に抽出された日本酒名の配列
```

## 🔍 認識精度向上のコツ

### プロンプト最適化
現在のプロンプト:
```
この画像は日本酒メニューです。手書きまたは印刷された日本酒の銘柄名を正確に抽出してください。

以下の形式のJSONで返してください：
{
  "sake_names": ["銘柄名1", "銘柄名2", "銘柄名3"],
  "confidence": 0.95,
  "notes": "認識に関する補足情報"
}

重要な点：
- 日本酒の銘柄名のみを抽出してください
- 価格や説明文は除外してください  
- 不明瞭な文字は推測せず、確実に読める銘柄のみ抽出してください
```

### 画像品質向上
- 明るい環境での撮影
- ブレの少ない画像
- 適切なフォーカス

## 🚨 トラブルシューティング

### よくある問題と解決策

1. **APIキーエラー**
   ```
   Error: Gemini API key not configured
   ```
   → `.env.local`でGEMINI_API_KEYを設定

2. **JSON解析エラー**
   ```
   JSON parse error
   ```
   → テキストからの抽出にフォールバック（自動処理済み）

3. **認識精度が低い**
   → Google Cloud Vision APIにフォールバック（自動）

## 📊 監視とメトリクス

### 推奨監視項目
- **使用量**: 月間リクエスト数
- **コスト**: 月額費用追跡
- **精度**: 認識成功率
- **レスポンス時間**: API応答速度

### ログ出力
```javascript
console.log('使用プロバイダー:', result.provider);
console.log('AI抽出された日本酒名:', sakeNames);
console.log('認識信頼度:', result.confidence);
```

## 🔄 今後の改善計画

### Phase 1: 精度監視 (完了)
- Gemini AI認識結果の品質評価
- フォールバック発生率の監視

### Phase 2: Claude Vision統合 (オプション)
- 認識精度が不十分な場合のClaude Vision API統合
- ハイブリッドアプローチの実装

### Phase 3: 機械学習最適化
- ファインチューニング検討
- カスタムプロンプト最適化

## 🎉 実装完了事項

✅ Gemini Vision APIエンドポイント作成  
✅ MenuScannerコンポーネント統合  
✅ フォールバックシステム実装  
✅ UI/UX更新  
✅ 環境変数設定ガイド作成  
✅ README更新  
✅ コスト試算完了  

## 🔗 関連ドキュメント

- [AI Vision OCR Analysis](./ai-vision-ocr-analysis.md) - 詳細な比較分析
- [README.md](../README.md) - プロジェクト概要
- [.env.example](../.env.example) - 環境変数テンプレート

---

**作成日**: 2025年8月14日  
**実装者**: Claude Code  
**ステータス**: 実装完了 ✅