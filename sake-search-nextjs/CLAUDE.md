# プロジェクト設定

## 開発サーバー

このプロジェクトでは以下のコマンドで開発サーバーを起動します：

```bash
npm run dev
```

- ポート: 3000
- URL: http://localhost:3000
- 自動でバックグラウンド起動を推奨

## 主要コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# リント実行
npm run lint
```

## 環境変数

- `.env.local`ファイルでSupabase設定
- 必須変数：
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - USE_SAKENOWA_API=true

## 開発ワークフロー

1. サーバーを自動でバックグラウンド起動
2. ブラウザで http://localhost:3000 確認
3. コード変更時は自動リロード