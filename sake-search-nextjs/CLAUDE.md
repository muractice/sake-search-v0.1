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

### 必須ワークフロー（ソースコード修正時）

**IMPORTANT: コード修正時は必ず以下の順序で実行してください**

1. **ブランチ作成**
   ```bash
   git checkout -b feature/修正内容-YYYYMMDD
   ```

2. **コード修正**
   - 必要な修正を実行

3. **テスト実行**
   ```bash
   npm test
   ```

4. **ローカル動作確認**
   ```bash
   npm run dev  # バックグラウンド起動
   # http://localhost:3000 で動作確認
   ```

5. **ビルド確認**
   ```bash
   npm run build
   ```

6. **リント確認**
   ```bash
   npm run lint
   ```

7. **コミット・マージ**
   ```bash
   git add .
   git commit -m "修正内容"
   git checkout main
   git merge feature/修正内容-YYYYMMDD
   ```

8. **ブランチ削除**
   ```bash
   git branch -d feature/修正内容-YYYYMMDD
   ```

### 基本開発ワークフロー

1. サーバーを自動でバックグラウンド起動
2. ブラウザで http://localhost:3000 確認
3. コード変更時は自動リロード

### 品質保証チェックリスト

- [ ] 新しいブランチで作業
- [ ] テストが全て通る
- [ ] ローカルで正常動作
- [ ] ビルドエラーなし
- [ ] リントエラーなし
- [ ] mainブランチにマージ