-- drinking_recordsテーブルの修正
-- 都道府県カラムを削除し、brewery_idカラムを追加してJOIN方式に変更

-- 既存の都道府県カラムとそのインデックスを削除（存在する場合）
ALTER TABLE drinking_records 
DROP COLUMN IF EXISTS sake_prefecture,
DROP COLUMN IF EXISTS sake_area_id;

DROP INDEX IF EXISTS idx_drinking_records_prefecture;
DROP INDEX IF EXISTS idx_drinking_records_area_id;

-- brewery_idカラムを追加（蔵元マスターとの結合用）
ALTER TABLE drinking_records 
ADD COLUMN IF NOT EXISTS brewery_id INTEGER REFERENCES breweries(id);

-- brewery_idのインデックスを追加
CREATE INDEX IF NOT EXISTS idx_drinking_records_brewery_id ON drinking_records(brewery_id);

-- ビューを作成：記録と蔵元・地域情報を結合した完全なデータ
CREATE OR REPLACE VIEW drinking_records_with_area AS
SELECT 
  dr.*,
  b.name as brewery_name,
  b.area_id,
  a.name as area_name
FROM drinking_records dr
LEFT JOIN sake_master sm ON dr.sake_id = sm.id::varchar
LEFT JOIN breweries b ON sm.brewery_id = b.id
LEFT JOIN areas a ON b.area_id = a.id;

-- コメント追加
COMMENT ON VIEW drinking_records_with_area IS '飲酒記録と蔵元・地域情報を結合したビュー';
COMMENT ON COLUMN drinking_records.brewery_id IS '蔵元ID（breweries.idへの外部キー）';