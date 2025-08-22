-- RLSポリシーを修正（サービスロールでのINSERT/UPDATE/DELETEを許可）

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Areas are viewable by everyone" ON areas;
DROP POLICY IF EXISTS "Breweries are viewable by everyone" ON breweries;

-- areasテーブルのポリシー
-- 全ユーザーが読み取り可能
CREATE POLICY "Areas are viewable by everyone" ON areas
  FOR SELECT
  USING (true);

-- サービスロールのみ変更可能（またはRLSを無効化）
CREATE POLICY "Service role can insert areas" ON areas
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role can update areas" ON areas
  FOR UPDATE
  USING (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role can delete areas" ON areas
  FOR DELETE
  USING (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- breweriesテーブルのポリシー
-- 全ユーザーが読み取り可能
CREATE POLICY "Breweries are viewable by everyone" ON breweries
  FOR SELECT
  USING (true);

-- サービスロールのみ変更可能
CREATE POLICY "Service role can insert breweries" ON breweries
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role can update breweries" ON breweries
  FOR UPDATE
  USING (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role can delete breweries" ON breweries
  FOR DELETE
  USING (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');