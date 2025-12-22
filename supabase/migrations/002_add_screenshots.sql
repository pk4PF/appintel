-- Add screenshots columns to apps table
-- Run this in your Supabase SQL Editor

ALTER TABLE apps ADD COLUMN IF NOT EXISTS screenshots TEXT[];
ALTER TABLE apps ADD COLUMN IF NOT EXISTS ipad_screenshots TEXT[];

-- Add index for apps with screenshots (for filtering)
CREATE INDEX IF NOT EXISTS idx_apps_has_screenshots ON apps ((screenshots IS NOT NULL));






