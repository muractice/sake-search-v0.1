-- Migration for preference analysis and recommendation tables

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preference vector (basic taste preferences)
  sweetness_preference FLOAT DEFAULT 0, -- -5 to +5
  richness_preference FLOAT DEFAULT 0,  -- -5 to +5
  
  -- 6-element preference scores (0-1 normalized)
  f1_preference FLOAT DEFAULT 0.5, -- floral
  f2_preference FLOAT DEFAULT 0.5, -- mellow
  f3_preference FLOAT DEFAULT 0.5, -- heavy
  f4_preference FLOAT DEFAULT 0.5, -- mild
  f5_preference FLOAT DEFAULT 0.5, -- dry
  f6_preference FLOAT DEFAULT 0.5, -- light
  
  -- Metadata
  taste_type VARCHAR(50),
  diversity_score FLOAT DEFAULT 0,
  adventure_score FLOAT DEFAULT 0,
  total_favorites INT DEFAULT 0,
  
  -- Update management
  calculated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create recommendation_cache table
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sake_id VARCHAR(255),
  
  -- Scores
  similarity_score FLOAT,
  predicted_rating FLOAT,
  recommendation_type VARCHAR(50), -- 'similar', 'explore', 'trending'
  recommendation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  INDEX (user_id, similarity_score DESC)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for recommendation_cache
CREATE POLICY "Users can view own recommendations" ON recommendation_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON recommendation_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON recommendation_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations" ON recommendation_cache
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_recommendation_cache_user_id ON recommendation_cache(user_id);
CREATE INDEX idx_recommendation_cache_expires ON recommendation_cache(expires_at);