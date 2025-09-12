-- 飲食店メニューテーブルにregistration_dateカラムを追加し、一意制約を変更

-- 既存の一意制約を削除
ALTER TABLE restaurant_menus 
DROP CONSTRAINT IF EXISTS restaurant_menus_user_id_restaurant_name_key;

-- registration_dateカラムを追加
ALTER TABLE restaurant_menus 
ADD COLUMN IF NOT EXISTS registration_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- 新しい一意制約を追加（user_id + restaurant_name + registration_date）
ALTER TABLE restaurant_menus 
ADD CONSTRAINT restaurant_menus_user_id_restaurant_name_registration_date_key 
UNIQUE(user_id, restaurant_name, registration_date);

-- インデックスを追加（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_registration_date 
ON restaurant_menus(registration_date DESC);

-- 既存のビューを更新してregistration_dateを含める
DROP VIEW IF EXISTS restaurant_menu_with_sakes;
CREATE OR REPLACE VIEW restaurant_menu_with_sakes AS
SELECT 
  rm.id as restaurant_menu_id,
  rm.user_id,
  rm.restaurant_name,
  rm.registration_date,
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

-- 飲食店記録の詳細ビューも更新
DROP VIEW IF EXISTS restaurant_drinking_records_detail;
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
  rm.registration_date,
  rm.location,
  rms.sake_id,
  rms.brand_id,
  rms.is_available,
  rms.menu_notes
FROM restaurant_drinking_records rdr
JOIN restaurant_menus rm ON rdr.restaurant_menu_id = rm.id
JOIN restaurant_menu_sakes rms ON rdr.restaurant_menu_sake_id = rms.id;