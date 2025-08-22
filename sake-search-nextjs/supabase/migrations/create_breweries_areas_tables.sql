-- Sake NoWaからインポートする蔵元と地域マスターテーブルの作成

-- 地域（都道府県）マスターテーブル
CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 地域マスターのインデックス
CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);

-- 蔵元マスターテーブル
CREATE TABLE IF NOT EXISTS breweries (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  area_id INTEGER REFERENCES areas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 蔵元マスターのインデックス
CREATE INDEX IF NOT EXISTS idx_breweries_name ON breweries(name);
CREATE INDEX IF NOT EXISTS idx_breweries_area_id ON breweries(area_id);

-- updated_at を自動更新するトリガー（areas）
CREATE OR REPLACE FUNCTION update_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON areas
  FOR EACH ROW
  EXECUTE FUNCTION update_areas_updated_at();

-- updated_at を自動更新するトリガー（breweries）
CREATE OR REPLACE FUNCTION update_breweries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_breweries_updated_at
  BEFORE UPDATE ON breweries
  FOR EACH ROW
  EXECUTE FUNCTION update_breweries_updated_at();

-- RLS (Row Level Security) の設定
-- これらのテーブルは公開読み取り専用（マスターデータのため）
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE breweries ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Areas are viewable by everyone" ON areas
  FOR SELECT
  USING (true);

CREATE POLICY "Breweries are viewable by everyone" ON breweries
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETEは管理者のみ（アプリケーションのサービスロールで実行）
-- ※ ユーザーからの直接変更は不可