-- recommendation_cacheテーブルにmoodカラムを追加
ALTER TABLE recommendation_cache 
ADD COLUMN IF NOT EXISTS mood VARCHAR(20) DEFAULT 'usual';

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_mood 
ON recommendation_cache(user_id, mood);

-- 既存の一意制約を削除して、moodを含む新しい制約を作成
ALTER TABLE recommendation_cache 
DROP CONSTRAINT IF EXISTS recommendation_cache_user_id_sake_id_key;

ALTER TABLE recommendation_cache 
ADD CONSTRAINT recommendation_cache_user_id_sake_id_mood_key 
UNIQUE(user_id, sake_id, mood);