# 酒サーチ - 起動方法

## ローカルサーバーの起動

Sakenowa APIを使用するため、ローカルサーバーを起動する必要があります。

### 方法1: Python（推奨）
```bash
cd /Users/murahige/product/agents-service/meshi-search/sake-search
python3 server.py
```

ブラウザで http://localhost:8000 にアクセス

### 方法2: Node.js（npxを使用）
```bash
cd /Users/murahige/product/agents-service/meshi-search/sake-search
npx http-server -p 8000 --cors
```

### 方法3: Python標準サーバー
```bash
cd /Users/murahige/product/agents-service/meshi-search/sake-search
python3 -m http.server 8000
```
※この方法ではCORSエラーが発生する可能性があります

## 使い方

1. 上記のいずれかの方法でサーバーを起動
2. ブラウザで http://localhost:8000 を開く
3. 日本酒名を入力して検索（例：獺祭、久保田、八海山）

## 注意事項

- 初回アクセス時にデータ読み込みに数秒かかります
- インターネット接続が必要です（Sakenowa APIアクセスのため）