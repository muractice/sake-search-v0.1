# 開発ツール

このディレクトリには開発時に便利なスクリプトが含まれています。

## restart-server.sh

Next.js開発サーバーを安全に再起動するスクリプトです。

### 使用方法

```bash
./tools/restart-server.sh
```

### 機能

- 既存のNext.jsプロセスを安全に終了
- ポート3000/3001で動作中のプロセスをクリーンアップ
- 開発サーバーを再起動
- 起動状況を確認してレポート

### 実行権限

スクリプトには実行権限が付与されているため、直接実行できます。

```bash
# 権限確認
ls -la tools/restart-server.sh

# 実行
./tools/restart-server.sh
```