-- Emerging App Intelligence - Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  app_store_id INTEGER UNIQUE,
  slug VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apps table
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_store_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon_url TEXT,
  description TEXT,
  short_description TEXT,
  developer_name VARCHAR(255),
  developer_id VARCHAR(50),
  category_id UUID REFERENCES categories(id),
  secondary_category_id UUID REFERENCES categories(id),
  release_date DATE,
  last_updated DATE,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  pricing_model VARCHAR(50) DEFAULT 'free', -- free, freemium, paid, subscription
  bundle_id VARCHAR(255),
  minimum_os_version VARCHAR(20),
  size_bytes BIGINT,
  languages TEXT[], -- Array of language codes
  countries TEXT[], -- Array of country codes where available
  content_rating VARCHAR(20),
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App metrics (daily snapshots)
CREATE TABLE app_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  downloads_estimate INTEGER,
  revenue_estimate DECIMAL(12,2),
  rating DECIMAL(2,1),
  rating_count INTEGER,
  review_count INTEGER,
  rank_overall INTEGER,
  rank_category INTEGER,
  rank_free INTEGER,
  rank_paid INTEGER,
  rank_grossing INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, date)
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  review_id VARCHAR(100), -- Original App Store review ID
  author VARCHAR(255),
  title TEXT,
  review_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date DATE,
  country VARCHAR(5),
  version VARCHAR(20),
  helpful_count INTEGER DEFAULT 0,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, review_id)
);

-- Review insights (AI-generated summaries)
CREATE TABLE review_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- complaint, praise, feature_request, missed_opportunity
  summary TEXT NOT NULL,
  evidence TEXT[], -- Array of supporting quotes from reviews
  frequency INTEGER DEFAULT 1,
  sentiment_score DECIMAL(3,2), -- -1 to 1
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunity scores
CREATE TABLE opportunity_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  momentum DECIMAL(5,2),
  demand_signal DECIMAL(5,2),
  user_satisfaction DECIMAL(5,2),
  monetization_potential DECIMAL(5,2),
  competitive_density DECIMAL(5,2),
  time_window VARCHAR(10) DEFAULT '30d', -- 7d, 14d, 30d
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, time_window)
);

-- Similar apps mapping
CREATE TABLE similar_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  similar_app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2), -- 0 to 1
  positioning_diff TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, similar_app_id)
);

-- Create indexes for performance
CREATE INDEX idx_apps_category ON apps(category_id);
CREATE INDEX idx_apps_release_date ON apps(release_date DESC);
CREATE INDEX idx_apps_pricing_model ON apps(pricing_model);
CREATE INDEX idx_app_metrics_app_date ON app_metrics(app_id, date DESC);
CREATE INDEX idx_reviews_app ON reviews(app_id);
CREATE INDEX idx_reviews_date ON reviews(review_date DESC);
CREATE INDEX idx_reviews_processed ON reviews(processed) WHERE processed = FALSE;
CREATE INDEX idx_opportunity_scores_score ON opportunity_scores(score DESC);
CREATE INDEX idx_opportunity_scores_app ON opportunity_scores(app_id);

-- Full-text search on apps
CREATE INDEX idx_apps_search ON apps USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Insert default categories (iOS App Store categories)
INSERT INTO categories (name, app_store_id, slug) VALUES
  ('Games', 6014, 'games'),
  ('Business', 6000, 'business'),
  ('Education', 6017, 'education'),
  ('Entertainment', 6016, 'entertainment'),
  ('Finance', 6015, 'finance'),
  ('Food & Drink', 6023, 'food-drink'),
  ('Graphics & Design', 6027, 'graphics-design'),
  ('Health & Fitness', 6013, 'health-fitness'),
  ('Lifestyle', 6012, 'lifestyle'),
  ('Medical', 6020, 'medical'),
  ('Music', 6011, 'music'),
  ('Navigation', 6010, 'navigation'),
  ('News', 6009, 'news'),
  ('Photo & Video', 6008, 'photo-video'),
  ('Productivity', 6007, 'productivity'),
  ('Reference', 6006, 'reference'),
  ('Shopping', 6024, 'shopping'),
  ('Social Networking', 6005, 'social-networking'),
  ('Sports', 6004, 'sports'),
  ('Travel', 6003, 'travel'),
  ('Utilities', 6002, 'utilities'),
  ('Weather', 6001, 'weather'),
  ('Developer Tools', 6026, 'developer-tools'),
  ('Books', 6018, 'books');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for apps updated_at
CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

