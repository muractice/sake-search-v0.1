import { NextResponse } from 'next/server';

export async function GET() {
  // 環境変数の状態を確認（キーの一部のみ表示）
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
    },
    gemini: {
      keyExists: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET',
      keySuffix: apiKey ? '...' + apiKey.substring(apiKey.length - 4) : 'NOT SET',
    },
    timestamp: new Date().toISOString()
  });
}