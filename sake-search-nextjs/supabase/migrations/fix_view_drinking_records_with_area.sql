-- drinking_records_with_areaビューを修正
-- sake_masterテーブルを使用せず、直接brewery_idでJOINする方式に変更

-- 既存のビューがあれば削除
DROP VIEW IF EXISTS drinking_records_with_area;

-- ビューを作成：記録と蔵元・地域情報を結合（シンプル版）
CREATE VIEW drinking_records_with_area AS
SELECT 
  dr.*,
  b.name as brewery_name,
  b.area_id,
  a.name as area_name
FROM drinking_records dr
LEFT JOIN breweries b ON dr.brewery_id = b.id
LEFT JOIN areas a ON b.area_id = a.id;

-- ビューにコメントを追加
COMMENT ON VIEW drinking_records_with_area IS '飲酒記録と蔵元・地域情報を結合したビュー（brewery_id直接結合版）';

-- 権限設定（必要に応じて）
GRANT SELECT ON drinking_records_with_area TO anon;
GRANT SELECT ON drinking_records_with_area TO authenticated;