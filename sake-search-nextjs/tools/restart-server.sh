#!/bin/bash

# サーバー再起動スクリプト
# Usage: ./tools/restart-server.sh

echo "🔄 Next.js開発サーバーを再起動します..."

# 既存のNext.jsプロセスを終了
echo "📱 既存のプロセスを終了中..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# ポート3000, 3001のプロセスも確認して終了
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "🔌 ポート3000のプロセスを終了中..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
fi

if lsof -ti:3001 >/dev/null 2>&1; then
    echo "🔌 ポート3001のプロセスを終了中..."
    kill -9 $(lsof -ti:3001) 2>/dev/null || true
fi

# 少し待機
sleep 2

# 開発サーバーを起動
echo "🚀 開発サーバーを起動中..."
npm run dev &

# プロセスIDを取得
DEV_PID=$!

# 起動確認
sleep 3
if ps -p $DEV_PID > /dev/null; then
    echo "✅ サーバーが正常に起動しました (PID: $DEV_PID)"
    echo "🌐 http://localhost:3001 でアクセスできます"
else
    echo "❌ サーバーの起動に失敗しました"
    exit 1
fi