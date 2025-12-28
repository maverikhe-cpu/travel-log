-- Migration: Add location columns for AMap integration
-- Description: Add longitude, latitude, and POI related fields to activities table

-- Add location columns to activities table
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS poi_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(longitude, latitude) WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN activities.longitude IS '经度 (高德地图坐标系)';
COMMENT ON COLUMN activities.latitude IS '纬度 (高德地图坐标系)';
COMMENT ON COLUMN activities.poi_id IS '高德地图 POI ID';
COMMENT ON COLUMN activities.address IS '详细地址';
COMMENT ON COLUMN activities.district IS '区县';
COMMENT ON COLUMN activities.city IS '城市';
