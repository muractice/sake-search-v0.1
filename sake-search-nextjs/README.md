# 酒サーチ - 日本酒の味覚を4象限で視覚化

日本酒の味わいを「甘辛度」と「淡濃度」の4象限チャートで視覚的に表現するWebアプリケーションです。

## 🌟 主な機能

- 🔍 **日本酒検索**: 名前で日本酒を検索
- 📊 **4象限チャート**: 味覚を視覚的に表示
- 🆚 **比較機能**: 最大10つの日本酒を同時比較
- 📷 **メニュー撮影機能**: AI画像解析でメニューから日本酒を認識
  - 🚀 **Gemini AI**: 手書きメニュー対応、超低コスト（月額160円〜）
  - 📝 **フォールバック**: Google Cloud Vision API + Tesseract.js
  - ⚡ **標準モード**: Tesseract.jsでローカル処理
- ⭐ **お気に入り機能**: Supabaseベースのユーザー管理
- 📱 **レスポンシブ対応**: モバイル・デスクトップ両対応
- 🎨 **美しいUI**: グラデーションとアニメーション

## 🛠 技術スタック

- **フレームワーク**: Next.js 15.4.5
- **UI**: React 19 + TypeScript
- **スタイリング**: Tailwind CSS
- **グラフ**: Chart.js
- **データソース**: さけのわAPI

## 🚀 セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## 📝 環境変数

`.env.local` ファイルを作成し、以下を設定：

```bash
# さけのわAPI
USE_SAKENOWA_API=true

# Supabase（お気に入り機能）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI（推奨 - 超低コスト手書きメニュー認識）
GEMINI_API_KEY=your_gemini_api_key  # 月額160円〜の超低コストAI画像解析

# Google Cloud Vision API（フォールバック）
GOOGLE_CLOUD_VISION_API_KEY=your_api_key
```

### AI画像解析機能について

- **🥇 Gemini AI**: 手書きメニュー対応、月額160円〜の超低コスト
- **🥈 Google Cloud Vision API**: フォールバック、従来の高性能OCR
- **🥉 Tesseract.js**: 標準モード（ローカル処理、無料）

APIキーが設定されていない場合は自動で下位モードにフォールバックします。

## 🧑‍💻 開発者向け

### 開発ワークフロー

このプロジェクトでは品質保証のための開発ワークフローが整備されています：

```bash
# 手順確認
npm run workflow

# 品質チェック（リント + テスト + ビルド）
npm run check-all
```

詳細は **[開発ワークフローガイド](docs/development-workflow.md)** を参照してください。

### Git Hooks

コミット前に自動で品質チェックが実行されます：
- ESLint（リント）
- Jest（テスト）
- Next.js（ビルド）

## 📁 プロジェクト構造

```
sake-search-nextjs/
├── app/                 # Next.js App Router
│   ├── page.tsx        # メインページ
│   └── api/            # API Routes
├── components/         # Reactコンポーネント
│   ├── SearchSection.tsx
│   ├── TasteChart.tsx
│   ├── SakeDetail.tsx
│   └── ComparisonPanel.tsx
├── docs/               # 技術文書
│   └── development-workflow.md  # 開発ワークフロー
├── lib/                # ユーティリティ
│   ├── sakenowaApi.ts
│   └── mockData.ts
└── types/              # TypeScript型定義
```

## 🎯 使い方

### 基本機能
1. 検索バーに日本酒の名前を入力
2. チャート上に味覚がプロット
3. 複数の日本酒を同時比較（最大10件）
4. ポイントをクリックで詳細表示

### メニュー撮影機能
1. 「📷 メニューをスキャン」ボタンをクリック
2. 手書き対応が必要な場合は「🚀 AI画像解析」をチェック
3. カメラで撮影 or ギャラリーから画像選択
4. Gemini AIが自動で日本酒名を抽出
5. 認識された日本酒を個別/一括で比較に追加
6. 必要に応じて手動入力で補完

### お気に入り機能
1. ユーザー登録・ログイン
2. 日本酒詳細画面で ❤️ ボタンをクリック
3. お気に入り一覧から比較チャートに追加

## 📊 味覚マッピング

- **横軸**: 甘辛度（左：辛い ⇔ 右：甘い）
- **縦軸**: 淡濃度（下：淡麗 ⇔ 上：濃醇）

### 4象限の特徴

- **左上**: 辛口・濃醇（力強い系）
- **右上**: 甘口・濃醇（デザート系）
- **左下**: 辛口・淡麗（すっきり系）
- **右下**: 甘口・淡麗（やわらか系）

## 🤝 データ提供

[さけのわ](https://sakenowa.com) のAPIを使用しています。

## 📄 ライセンス

MIT License

---

Made with ❤️ by 酒サーチチーム
# テスト用の小さな変更
# 自動デプロイテスト 2025年 8月12日 火曜日 22時34分56秒 JST
# デプロイテスト - 接続解除後 07:22:33
# Node.js 20.xでのデプロイテスト - 07:36:30
# Root Directory設定後のデプロイテスト - 08:01:08
# Node.js 20.x + vercel.json修正後のデプロイテスト - 08:11:18
# vercel.json重複解消後の最終デプロイテスト - 09:03:01
# Root Directory設定変更後のテスト - 2025年 8月13日 水曜日 09時50分44秒 JST
