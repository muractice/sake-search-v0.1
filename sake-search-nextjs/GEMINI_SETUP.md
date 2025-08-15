# Gemini Vision API セットアップガイド

## 📝 概要
AI画像解析機能を使用するには、Google Gemini APIキーが必要です。
このガイドでは、APIキーの取得から設定までの手順を説明します。

## 🔑 APIキーの取得方法

1. **Google AI Studio にアクセス**
   - https://aistudio.google.com/ にアクセス
   - Googleアカウントでログイン

2. **APIキーを作成**
   - 左側メニューから「Get API key」をクリック
   - 「Create API key」をクリック
   - プロジェクトを選択（または新規作成）
   - 生成されたAPIキーをコピー

## ⚙️ 環境変数の設定

### 方法1: .env.localファイルに追加（推奨）

`.env.local`ファイルに以下の行を追加:

```bash
GEMINI_API_KEY=あなたのAPIキー
```

例:
```bash
GEMINI_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 方法2: 環境変数として設定

ターミナルで実行:
```bash
export GEMINI_API_KEY="あなたのAPIキー"
```

## 🔄 設定後の確認

1. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

2. **ブラウザでアクセス**
   - http://localhost:3000 を開く
   - メニュースキャン機能を開く
   - 「🚀 AI画像解析（手書き対応）」にチェックを入れる
   - 画像をアップロードして処理

## ❗ トラブルシューティング

### APIキーが認識されない場合
1. `.env.local`ファイルの保存を確認
2. 開発サーバーを完全に停止して再起動
3. APIキーに余分なスペースや改行がないか確認

### API呼び出しでエラーが発生する場合
1. APIキーが有効か確認（Google AI Studioで確認）
2. APIの利用上限に達していないか確認
3. ネットワーク接続を確認

### フォールバック動作
- Gemini APIが利用できない場合、自動的にGoogle Cloud Vision APIまたはTesseract.jsにフォールバック
- フォールバック時は処理画面にメッセージが表示されます

## 📊 API利用制限

無料プランの制限:
- 1分あたり60リクエスト
- 1日あたり1,500リクエスト
- 詳細: https://ai.google.dev/pricing

## 🔒 セキュリティ注意事項

- APIキーを公開リポジトリにコミットしない
- `.env.local`は`.gitignore`に含まれていることを確認
- 本番環境では環境変数として安全に管理

## 📚 参考リンク

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [API料金プラン](https://ai.google.dev/pricing)