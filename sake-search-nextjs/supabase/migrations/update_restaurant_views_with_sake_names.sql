-- 飲食店メニューとsake_masterを結合して日本酒名を取得するビューを更新
DROP VIEW IF EXISTS restaurant_menu_with_sakes CASCADE;
DROP VIEW IF EXISTS restaurant_drinking_records_detail CASCADE;

-- 飲食店メニューと日本酒情報を結合（sake_masterから名前を取得）
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
  rms.created_at as sake_added_at,
  sm.brand_name as sake_name,
  sm.brewery_name as sake_brewery,
  sm.sweetness,
  sm.richness
FROM restaurant_menus rm
LEFT JOIN restaurant_menu_sakes rms ON rm.id = rms.restaurant_menu_id
LEFT JOIN sake_master sm ON rms.sake_id = sm.id;

-- 飲食店記録の詳細情報（sake_masterから名前を取得）
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
  rms.menu_notes,
  sm.brand_name as sake_name,
  sm.brewery_name as sake_brewery,
  sm.sweetness,
  sm.richness
FROM restaurant_drinking_records rdr
JOIN restaurant_menus rm ON rdr.restaurant_menu_id = rm.id
JOIN restaurant_menu_sakes rms ON rdr.restaurant_menu_sake_id = rms.id
LEFT JOIN sake_master sm ON rms.sake_id = sm.id;