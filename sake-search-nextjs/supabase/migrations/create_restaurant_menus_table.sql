-- 既存のrestaurant_menusテーブルを削除（データも削除）
DROP TABLE IF EXISTS restaurant_drinking_records CASCADE;
DROP TABLE IF EXISTS restaurant_menus CASCADE;

-- 飲食店テーブル（シンプル化）
CREATE TABLE restaurant_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name VARCHAR(255) NOT NULL,
  location VARCHAR(255), -- 場所・住所
  notes TEXT, -- 飲食店に関する備考
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じユーザーが同じ飲食店名で重複登録しないようにする
  UNIQUE(user_id, restaurant_name)
);

-- 飲食店と日本酒のリレーションテーブル
CREATE TABLE restaurant_menu_sakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_menu_id UUID NOT NULL REFERENCES restaurant_menus(id) ON DELETE CASCADE,
  sake_id VARCHAR(255) NOT NULL, -- sake_masterのID
  brand_id INTEGER, -- brandsテーブルのID
  is_available BOOLEAN DEFAULT true,
  menu_notes TEXT, -- このメニューアイテムに関する備考（限定品、温度帯など）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じ飲食店で同じ日本酒の重複を防ぐ
  UNIQUE(restaurant_menu_id, sake_id)
);

-- 飲食店での飲酒記録テーブル（再作成）
CREATE TABLE restaurant_drinking_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_menu_id UUID NOT NULL REFERENCES restaurant_menus(id) ON DELETE CASCADE,
  restaurant_menu_sake_id UUID NOT NULL REFERENCES restaurant_menu_sakes(id) ON DELETE CASCADE,
  sake_id VARCHAR(255) NOT NULL, -- 冗長だが検索高速化のため
  brand_id INTEGER, -- 冗長だが検索高速化のため
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  memo TEXT,
  price_paid INTEGER, -- 実際に支払った価格（記録時点で入力）
  glass_ml INTEGER, -- 実際のグラス容量（記録時点で入力）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
-- restaurant_menusのインデックス
CREATE INDEX idx_restaurant_menus_user_id ON restaurant_menus(user_id);
CREATE INDEX idx_restaurant_menus_restaurant_name ON restaurant_menus(restaurant_name);

-- restaurant_menu_sakesのインデックス
CREATE INDEX idx_restaurant_menu_sakes_menu_id ON restaurant_menu_sakes(restaurant_menu_id);
CREATE INDEX idx_restaurant_menu_sakes_sake_id ON restaurant_menu_sakes(sake_id);
CREATE INDEX idx_restaurant_menu_sakes_brand_id ON restaurant_menu_sakes(brand_id);
CREATE INDEX idx_restaurant_menu_sakes_available ON restaurant_menu_sakes(is_available);

-- restaurant_drinking_recordsのインデックス
CREATE INDEX idx_restaurant_drinking_records_user_id ON restaurant_drinking_records(user_id);
CREATE INDEX idx_restaurant_drinking_records_menu_id ON restaurant_drinking_records(restaurant_menu_id);
CREATE INDEX idx_restaurant_drinking_records_sake_id ON restaurant_drinking_records(sake_id);
CREATE INDEX idx_restaurant_drinking_records_date ON restaurant_drinking_records(date DESC);

-- RLS (Row Level Security) の設定
ALTER TABLE restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_sakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_drinking_records ENABLE ROW LEVEL SECURITY;

-- restaurant_menusのRLSポリシー
CREATE POLICY "Users can view own restaurant menus" ON restaurant_menus
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own restaurant menus" ON restaurant_menus
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurant menus" ON restaurant_menus
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurant menus" ON restaurant_menus
  FOR DELETE
  USING (auth.uid() = user_id);

-- restaurant_menu_sakesのRLSポリシー
-- メニューの所有者のみアクセス可能
CREATE POLICY "Users can view own restaurant menu sakes" ON restaurant_menu_sakes
  FOR SELECT
  USING (
    restaurant_menu_id IN (
      SELECT id FROM restaurant_menus WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own restaurant menu sakes" ON restaurant_menu_sakes
  FOR INSERT
  WITH CHECK (
    restaurant_menu_id IN (
      SELECT id FROM restaurant_menus WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own restaurant menu sakes" ON restaurant_menu_sakes
  FOR UPDATE
  USING (
    restaurant_menu_id IN (
      SELECT id FROM restaurant_menus WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own restaurant menu sakes" ON restaurant_menu_sakes
  FOR DELETE
  USING (
    restaurant_menu_id IN (
      SELECT id FROM restaurant_menus WHERE user_id = auth.uid()
    )
  );

-- restaurant_drinking_recordsのRLSポリシー
CREATE POLICY "Users can view own restaurant drinking records" ON restaurant_drinking_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own restaurant drinking records" ON restaurant_drinking_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurant drinking records" ON restaurant_drinking_records
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurant drinking records" ON restaurant_drinking_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_atトリガー（既存の関数を使用）
CREATE TRIGGER update_restaurant_menus_updated_at
  BEFORE UPDATE ON restaurant_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_menu_sakes_updated_at
  BEFORE UPDATE ON restaurant_menu_sakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_drinking_records_updated_at
  BEFORE UPDATE ON restaurant_drinking_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 便利なビュー：飲食店メニューと日本酒情報を結合
CREATE OR REPLACE VIEW restaurant_menu_with_sakes AS
SELECT 
  rm.id as restaurant_menu_id,
  rm.user_id,
  rm.restaurant_name,
  rm.location,
  rm.notes as restaurant_notes,
  rm.created_at as restaurant_created_at,
  rms.id as menu_sake_id,
  rms.sake_id,
  rms.brand_id,
  rms.is_available,
  rms.menu_notes,
  rms.created_at as sake_added_at
FROM restaurant_menus rm
LEFT JOIN restaurant_menu_sakes rms ON rm.id = rms.restaurant_menu_id;

-- 便利なビュー：飲食店記録の詳細情報
CREATE OR REPLACE VIEW restaurant_drinking_records_detail AS
SELECT 
  rdr.id as record_id,
  rdr.user_id,
  rdr.date,
  rdr.rating,
  rdr.memo,
  rdr.price_paid,
  rdr.glass_ml,
  rdr.created_at as record_created_at,
  rm.restaurant_name,
  rm.location,
  rms.sake_id,
  rms.brand_id,
  rms.is_available,
  rms.menu_notes
FROM restaurant_drinking_records rdr
JOIN restaurant_menus rm ON rdr.restaurant_menu_id = rm.id
JOIN restaurant_menu_sakes rms ON rdr.restaurant_menu_sake_id = rms.id;