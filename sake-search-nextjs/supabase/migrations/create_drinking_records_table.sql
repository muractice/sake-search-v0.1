-- 飲酒記録テーブルの作成
CREATE TABLE IF NOT EXISTS drinking_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sake_id VARCHAR(255) NOT NULL,
  sake_name VARCHAR(255) NOT NULL, -- 冗長だが表示高速化のため
  sake_brewery VARCHAR(255), -- 冗長だが表示高速化のため
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_drinking_records_user_id ON drinking_records(user_id);
CREATE INDEX idx_drinking_records_sake_id ON drinking_records(sake_id);
CREATE INDEX idx_drinking_records_date ON drinking_records(date DESC);
CREATE INDEX idx_drinking_records_user_date ON drinking_records(user_id, date DESC);

-- RLS (Row Level Security) の設定
ALTER TABLE drinking_records ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の記録のみ参照可能
CREATE POLICY "Users can view own records" ON drinking_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の記録のみ作成可能
CREATE POLICY "Users can create own records" ON drinking_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の記録のみ更新可能
CREATE POLICY "Users can update own records" ON drinking_records
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分の記録のみ削除可能
CREATE POLICY "Users can delete own records" ON drinking_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drinking_records_updated_at
  BEFORE UPDATE ON drinking_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();