-- 世代管理用のテーブル作成
-- 実行前に pgvector 拡張を有効化する必要があります
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 既存のsake_masterテーブルを世代管理対応に拡張
-- （既存テーブルがない場合は新規作成）
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
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- インデックス作成は後で
  CONSTRAINT uk_brand_id UNIQUE (brand_id)
);

-- 2. 世代管理テーブル
CREATE TABLE IF NOT EXISTS sync_generations (
  generation_id SERIAL PRIMARY KEY,
  
  -- 同期情報
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
  
  -- 統計情報
  total_records INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  deleted_count INTEGER DEFAULT 0,
  unchanged_count INTEGER DEFAULT 0,
  
  -- データソース情報
  api_snapshot JSONB, -- APIレスポンスのメタデータ
  
  -- エラー情報
  error_message TEXT,
  error_details JSONB
);

-- 3. 変更履歴テーブル
CREATE TABLE IF NOT EXISTS sake_master_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 元データの識別子
  brand_id INTEGER NOT NULL,
  generation_id INTEGER NOT NULL,
  
  -- 変更タイプ
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- 変更前データ（JSONで保存）
  old_data JSONB,
  
  -- 変更後データ（JSONで保存）
  new_data JSONB,
  
  -- 変更されたフィールドのリスト
  changed_fields TEXT[],
  
  -- メタデータ
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. 変更サマリーテーブル
CREATE TABLE IF NOT EXISTS generation_changes_summary (
  summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id INTEGER REFERENCES sync_generations(generation_id),
  
  -- 主要な変更
  new_brands TEXT[], -- 新規追加された銘柄
  removed_brands TEXT[], -- 削除された銘柄
  updated_brands TEXT[], -- 更新された銘柄
  major_changes JSONB, -- 大きな変更のサマリー
  
  -- 変更の影響度
  change_impact VARCHAR(20) CHECK (change_impact IN ('none', 'minor', 'moderate', 'major')),
  
  -- 通知フラグ
  notification_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_sake_master_generation ON sake_master(generation_id);
CREATE INDEX IF NOT EXISTS idx_sake_master_active ON sake_master(is_active);
CREATE INDEX IF NOT EXISTS idx_sake_master_data_hash ON sake_master(data_hash);
CREATE INDEX IF NOT EXISTS idx_sake_master_brand_id ON sake_master(brand_id);

-- ベクトル検索用インデックス（pgvector）
CREATE INDEX IF NOT EXISTS idx_sake_master_flavor_vector 
ON sake_master USING ivfflat (flavor_vector vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_sync_generations_status ON sync_generations(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_generations_completed ON sync_generations(sync_completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sake_history_brand_generation ON sake_master_history(brand_id, generation_id);
CREATE INDEX IF NOT EXISTS idx_sake_history_operation ON sake_master_history(operation);
CREATE INDEX IF NOT EXISTS idx_sake_history_changed_at ON sake_master_history(changed_at DESC);

-- RLS (Row Level Security) ポリシー
-- sake_masterは全ユーザーが読み取り可能
ALTER TABLE sake_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sake_master_read_all" ON sake_master FOR SELECT USING (true);

-- 履歴テーブルは管理者のみアクセス可能（必要に応じて調整）
ALTER TABLE sake_master_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_changes_summary ENABLE ROW LEVEL SECURITY;

-- Database Functions

-- 特定世代のデータを取得する関数
CREATE OR REPLACE FUNCTION get_sake_by_generation(target_generation INTEGER)
RETURNS TABLE (
  brand_id INTEGER,
  brand_name VARCHAR,
  brewery_name VARCHAR,
  sweetness FLOAT,
  richness FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.brand_id,
    sm.brand_name,
    sm.brewery_name,
    sm.sweetness,
    sm.richness
  FROM sake_master sm
  WHERE sm.generation_id <= target_generation
    AND sm.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM sake_master_history h
      WHERE h.brand_id = sm.brand_id
      AND h.generation_id > target_generation
      AND h.operation = 'DELETE'
    );
END;
$$;

-- 変更履歴を取得する関数
CREATE OR REPLACE FUNCTION get_sake_change_history(
  target_brand_id INTEGER,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  generation_id INTEGER,
  operation VARCHAR,
  changed_fields TEXT[],
  changed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.generation_id,
    h.operation,
    h.changed_fields,
    h.changed_at
  FROM sake_master_history h
  WHERE h.brand_id = target_brand_id
  ORDER BY h.changed_at DESC
  LIMIT limit_count;
END;
$$;