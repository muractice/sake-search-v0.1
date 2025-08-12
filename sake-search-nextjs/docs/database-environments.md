# データベース環境の分離

## 概要
本アプリケーションでは、開発環境と本番環境で異なるSupabaseデータベースを使用します。

## 環境構成

### 開発環境
- **ファイル**: `.env.local`
- **データベース**: 開発用Supabaseプロジェクト
- **用途**: 開発・テスト用

### 本番環境
- **ファイル**: Vercelの環境変数設定
- **データベース**: 本番用Supabaseプロジェクト
- **用途**: 本番サービス用

## セットアップ手順

### 1. 開発環境の設定
`.env.local`ファイルに開発用Supabaseの認証情報を設定：
```
NEXT_PUBLIC_SUPABASE_URL=your_dev_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_supabase_anon_key
```

### 2. 本番環境の設定
Vercelダッシュボードで以下の環境変数を設定：
- `NEXT_PUBLIC_SUPABASE_URL`: 本番用SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 本番用Supabaseプロジェクトのanon key

### 3. 新しいSupabaseプロジェクトの作成
1. [Supabase](https://supabase.com)にログイン
2. 新しいプロジェクトを作成（例：`sake-search-prod`）
3. 以下のSQLを実行してテーブルを作成：

```sql
-- お気に入りテーブル
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sake_id TEXT NOT NULL,
  sake_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, sake_id)
);

-- ユーザー設定テーブル
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  show_favorites BOOLEAN DEFAULT true NOT NULL,
  comparison_mode BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- RLS（Row Level Security）を有効化
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成
CREATE POLICY "Users can only see their own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

## 環境変数の優先順位

Next.jsは以下の順序で環境変数を読み込みます：

### 本番環境（`NODE_ENV=production`）
1. `.env.production.local`（最優先・gitignore推奨）
2. `.env.production`
3. `.env`

### 開発環境（`NODE_ENV=development`）
1. `.env.development.local`（最優先・gitignore推奨）
2. `.env.local`（gitignore推奨）
3. `.env.development`
4. `.env`

## 注意事項
- `.env.local`は開発環境専用で、gitignoreに含める
- 本番環境の認証情報は絶対にコードにコミットしない
- Vercelの環境変数はプロジェクト設定から管理する