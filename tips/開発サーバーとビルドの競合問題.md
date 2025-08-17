# 開発Tips

## Next.js開発サーバーとビルドの競合問題

### 問題の症状
開発サーバー（`npm run dev`）実行中に以下のようなエラーが発生することがあります：

```
⨯ [Error: ENOENT: no such file or directory, open '.next/server/app/page/app-build-manifest.json']
⨯ [Error: ENOENT: no such file or directory, open '.next/static/development/_buildManifest.js.tmp']
```

ブラウザには「Internal Server Error」が表示されます。

### 原因
Next.jsの開発サーバーとビルドコマンドが同じ`.next`ディレクトリを使用するため、キャッシュの競合が発生します：

- **開発サーバー（`npm run dev`）**: 開発用のキャッシュとホットリロード用ファイルを生成
- **ビルド（`npm run build`）**: 本番用の最適化されたビルド成果物を生成

これらを交互に実行すると、ファイルパスの不整合やキャッシュの競合が起こります。

### 解決方法

#### 即座の解決
```bash
# 1. 開発サーバーを停止（Ctrl+C）
# 2. .nextキャッシュディレクトリを削除
rm -rf .next
# 3. 開発サーバーを再起動
npm run dev
```

### 予防策

#### 推奨ワークフロー

1. **開発中は`npm run dev`のみを使用する**
   - ビルドテストは開発作業が一段落してから実行

2. **ビルドテストが必要な場合の手順**
   ```bash
   # 開発サーバーを停止
   # ビルドとテスト
   npm run build
   npm run start  # 本番モードで動作確認
   
   # 開発に戻る前にキャッシュをクリア
   rm -rf .next
   npm run dev
   ```

3. **別ディレクトリでビルドテストを行う**
   ```bash
   # プロジェクトを別ディレクトリにコピー
   cp -r . ../sake-search-build-test
   cd ../sake-search-build-test
   npm run build
   npm run start
   # テスト完了後、元のディレクトリで開発を継続
   ```

4. **CI/CDパイプラインでビルドテストを実行**
   - ローカルではビルドを実行せず、GitHub ActionsやVercelのプレビューデプロイでビルドテストを行う

### ベストプラクティス

- `.gitignore`に`.next`ディレクトリが含まれていることを確認（デフォルトで含まれています）
- 開発中は頻繁にビルドを実行しない
- ビルド後は必ず`.next`をクリアしてから開発サーバーを起動
- チーム開発では、この問題について共有しておく

### トラブルシューティング

もし`.next`削除後も問題が続く場合：

```bash
# node_modulesとpackage-lock.jsonも再生成
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### 関連情報

- このエラーはNext.js 13以降のApp Routerを使用している場合に特に発生しやすい
- Turbopackを使用している場合（`--turbopack`フラグ）も影響を受ける可能性がある
- 本番環境では`npm run build && npm run start`を使用するため、この問題は発生しない