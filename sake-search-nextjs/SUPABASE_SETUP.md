# Supabaseセットアップガイド

このアプリケーションでお気に入り機能を使用するには、Supabaseプロジェクトのセットアップが必要です。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成/ログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: sake-search）
4. データベースパスワードを設定
5. リージョンを選択（Japan (東京) 推奨）
6. 「Create new project」をクリック

## 2. 環境変数の設定

1. Supabaseダッシュボードで「Settings」→「API」に移動
2. 以下の値をコピー：
   - Project URL
   - public anon key

3. プロジェクトルートに `.env.local` ファイルを作成：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 既存の設定
USE_SAKENOWA_API=true
```

## 3. データベーステーブルの作成

1. Supabaseダッシュボードで「SQL Editor」に移動
2. 以下のSQLを実行：

```sql
-- ユーザーのお気に入り日本酒を保存するテーブル
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sake_id TEXT NOT NULL,
  sake_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, sake_id)
);

-- ユーザーの設定を保存するテーブル
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  show_favorites BOOLEAN DEFAULT true,
  comparison_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security (RLS)を有効化
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- favoritesテーブルのポリシー
CREATE POLICY "Users can view own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" 
  ON favorites FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- user_preferencesテーブルのポリシー
CREATE POLICY "Users can view own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_sake_id ON favorites(sake_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);
```

## 4. 認証設定

1. Supabaseダッシュボードで「Authentication」→「Settings」に移動
2. 「Site URL」を設定：
   - 開発環境: `http://localhost:3000`
   - 本番環境: あなたのVercelドメイン
3. 「Redirect URLs」に同じURLを追加

## 5. メール認証の設定（オプション）

デフォルトではメール確認なしでサインアップが可能ですが、より安全にするためメール確認を有効にできます：

1. 「Authentication」→「Settings」
2. 「Enable email confirmations」をオンに設定

## 6. 動作確認

1. アプリケーションを起動：`npm run dev`
2. ブラウザで http://localhost:3000 にアクセス
3. 右側のユーザー認証パネルでサインアップ/ログインをテスト
4. 日本酒を検索してお気に入りボタンをテスト

## トラブルシューティング

### よくあるエラー

1. **"Invalid API key"**
   - `.env.local`の環境変数が正しく設定されているか確認
   - サーバーを再起動（`npm run dev`を停止して再実行）

2. **"relation 'favorites' does not exist"**
   - データベーステーブルが作成されているか確認
   - SQLスクリプトを再実行

3. **認証エラー**
   - Site URLとRedirect URLsが正しく設定されているか確認
   - ブラウザのキャッシュをクリア

### デバッグ方法

ブラウザのDeveloper Tools（F12）でConsoleタブを確認し、エラーメッセージを確認してください。