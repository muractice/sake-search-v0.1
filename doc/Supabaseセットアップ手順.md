# Supabaseセットアップ詳細手順

## 1. pgvector拡張の有効化

### Supabase Dashboard での操作
1. **Supabase Dashboard** にログイン
2. **プロジェクト** を選択
3. 左メニューから **SQL Editor** をクリック
4. 以下のSQLを実行:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

5. **RUN** ボタンをクリック
6. 「Success. No rows returned」と表示されれば成功

### 確認方法
```sql
-- 拡張が有効になっているか確認
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## 2. 環境変数の取得

### SUPABASE_URL の取得
1. Dashboard → **Settings** → **API**
2. **Project URL** をコピー
   - 例: `https://abcdefghijklmnop.supabase.co`

### SUPABASE_SERVICE_KEY の取得
1. 同じページの **Project API keys** セクション
2. **service_role** の「👁️」アイコンをクリックして表示
3. キーをコピー（⚠️ 秘密鍵として扱う）

## 3. ローカル環境での環境変数設定

### Option A: .env.local ファイル作成
```bash
cd sake-search-nextjs
echo 'SUPABASE_URL="https://your-project.supabase.co"' > .env.local
echo 'SUPABASE_SERVICE_KEY="your-service-key"' >> .env.local
```

### Option B: シェルで一時的に設定
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"
```

## 4. データベースセットアップスクリプトの実行

```bash
cd sake-search-nextjs
npm run db:setup
```

### 期待される出力
```
🗄️ Supabaseデータベースのセットアップを開始します...
📦 pgvector拡張を確認中...
✅ pgvector拡張は既に有効です
📜 マイグレーションを実行中...
実行中: CREATE TABLE IF NOT EXISTS sake_master...
実行中: CREATE TABLE IF NOT EXISTS sync_generations...
実行中: CREATE TABLE IF NOT EXISTS sake_master_history...
...
🔍 テーブル構造を確認中...
✅ sake_master: 正常
✅ sync_generations: 正常
✅ sake_master_history: 正常
✅ generation_changes_summary: 正常
✅ データベースセットアップが完了しました！
```

## 5. 手動でのマイグレーション実行（必要な場合）

スクリプトがうまく動作しない場合は、手動でSQLを実行:

### Supabase Dashboard → SQL Editor で実行

```sql
-- 1. pgvector拡張（再確認）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 日本酒マスターテーブル（世代管理対応）
CREATE TABLE IF NOT EXISTS sake_master (
  id VARCHAR(50) PRIMARY KEY,
  brand_id INTEGER NOT NULL UNIQUE,
  brand_name VARCHAR(255) NOT NULL,
  brewery_id INTEGER NOT NULL,
  brewery_name VARCHAR(255) NOT NULL,
  
  -- 味わいデータ
  sweetness FLOAT DEFAULT 0,
  richness FLOAT DEFAULT 0,
  f1_floral FLOAT DEFAULT 0.5,
  f2_mellow FLOAT DEFAULT 0.5,
  f3_heavy FLOAT DEFAULT 0.5,
  f4_mild FLOAT DEFAULT 0.5,
  f5_dry FLOAT DEFAULT 0.5,
  f6_light FLOAT DEFAULT 0.5,
  
  -- ベクトル検索用
  flavor_vector vector(8),
  
  -- 世代管理用
  generation_id INTEGER NOT NULL DEFAULT 0,
  data_hash VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. 世代管理テーブル
CREATE TABLE IF NOT EXISTS sync_generations (
  generation_id SERIAL PRIMARY KEY,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20) DEFAULT 'running',
  total_records INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  deleted_count INTEGER DEFAULT 0,
  unchanged_count INTEGER DEFAULT 0,
  api_snapshot JSONB,
  error_message TEXT,
  error_details JSONB
);

-- 4. 変更履歴テーブル
CREATE TABLE IF NOT EXISTS sake_master_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id INTEGER NOT NULL,
  generation_id INTEGER NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. 変更サマリーテーブル
CREATE TABLE IF NOT EXISTS generation_changes_summary (
  summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id INTEGER REFERENCES sync_generations(generation_id),
  new_brands TEXT[],
  removed_brands TEXT[],
  updated_brands TEXT[],
  major_changes JSONB,
  change_impact VARCHAR(20) CHECK (change_impact IN ('none', 'minor', 'moderate', 'major')),
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_sake_master_generation ON sake_master(generation_id);
CREATE INDEX IF NOT EXISTS idx_sake_master_active ON sake_master(is_active);
CREATE INDEX IF NOT EXISTS idx_sake_master_data_hash ON sake_master(data_hash);
CREATE INDEX IF NOT EXISTS idx_sake_master_brand_id ON sake_master(brand_id);

-- 7. ベクトル検索用インデックス
CREATE INDEX IF NOT EXISTS idx_sake_master_flavor_vector 
ON sake_master USING ivfflat (flavor_vector vector_cosine_ops)
WITH (lists = 100);

-- 8. その他のインデックス
CREATE INDEX IF NOT EXISTS idx_sync_generations_status ON sync_generations(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_generations_completed ON sync_generations(sync_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sake_history_brand_generation ON sake_master_history(brand_id, generation_id);
CREATE INDEX IF NOT EXISTS idx_sake_history_operation ON sake_master_history(operation);
CREATE INDEX IF NOT EXISTS idx_sake_history_changed_at ON sake_master_history(changed_at DESC);

-- 9. RLS (Row Level Security) の設定
ALTER TABLE sake_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sake_master_read_all" ON sake_master FOR SELECT USING (true);

ALTER TABLE sake_master_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_changes_summary ENABLE ROW LEVEL SECURITY;
```

## 6. 初期テストの実行

```bash
# 基本的な接続テスト
npm run sync:test

# 期待される出力:
# ✅ データベース接続成功
# ✅ さけのわAPI取得成功: 銘柄数: 3167件
# ✅ ハッシュ計算成功
# ✅ 差分検出完了
```

## 7. トラブルシューティング

### エラー: "extension "vector" does not exist"
→ pgvector拡張が有効化されていません
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### エラー: "permission denied for relation"
→ SERVICE_KEYではなくANON_KEYを使用している可能性
→ 正しいSERVICE_KEYを使用してください

### エラー: "relation does not exist"
→ テーブルが作成されていません
→ 手動でマイグレーションSQLを実行してください

### エラー: "function ivfflat does not exist"
→ pgvector拡張の問題
→ Supabaseサポートに連絡（まれなケース）

## 8. 確認方法

### テーブルが正しく作成されているか確認
```sql
-- テーブル一覧
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%sake%' OR table_name LIKE '%sync%';

-- 期待される結果:
-- sake_master
-- sake_master_history  
-- sync_generations
-- generation_changes_summary
```

### pgvectorが正しく動作するか確認
```sql
-- ベクトル型のテスト
SELECT '[1,2,3,4,5,6,7,8]'::vector(8);
```

## まとめ

**最小限の手順**:
1. `CREATE EXTENSION IF NOT EXISTS vector;` をSQL Editorで実行
2. 環境変数を設定
3. `npm run db:setup` を実行

**手動の場合**:
1. pgvector拡張を有効化
2. 上記のSQLを全てSQL Editorで実行
3. `npm run sync:test` で動作確認