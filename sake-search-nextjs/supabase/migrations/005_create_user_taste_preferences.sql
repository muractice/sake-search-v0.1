-- user_taste_preferences テーブルの作成
-- 嗜好分析データを保存するためのテーブル

CREATE TABLE IF NOT EXISTS user_taste_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本的な嗜好傾向 (-5 to +5)
  sweetness_preference FLOAT DEFAULT 0,
  richness_preference FLOAT DEFAULT 0,

  -- 6要素の嗜好スコア (0-1 normalized)
  f1_preference FLOAT DEFAULT 0.5, -- floral
  f2_preference FLOAT DEFAULT 0.5, -- mellow
  f3_preference FLOAT DEFAULT 0.5, -- heavy
  f4_preference FLOAT DEFAULT 0.5, -- mild
  f5_preference FLOAT DEFAULT 0.5, -- dry
  f6_preference FLOAT DEFAULT 0.5, -- light

  -- 分析結果のメタデータ
  taste_type VARCHAR(50),
  diversity_score FLOAT DEFAULT 0,
  adventure_score FLOAT DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,

  -- 更新管理
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 一人のユーザーにつき一つの嗜好データ
  UNIQUE(user_id)
);

-- インデックスの作成
CREATE INDEX idx_user_taste_preferences_user_id ON user_taste_preferences(user_id);
CREATE INDEX idx_user_taste_preferences_calculated_at ON user_taste_preferences(calculated_at DESC);
CREATE INDEX idx_user_taste_preferences_taste_type ON user_taste_preferences(taste_type);

-- Row Level Security (RLS)を有効化
ALTER TABLE user_taste_preferences ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
CREATE POLICY "Users can view own taste preferences"
  ON user_taste_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own taste preferences"
  ON user_taste_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own taste preferences"
  ON user_taste_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own taste preferences"
  ON user_taste_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
CREATE TRIGGER update_user_taste_preferences_updated_at
  BEFORE UPDATE ON user_taste_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();