-- ============================================
-- 升级旅行记录表 - 支持多条记录和图片
-- ============================================

-- 1. 删除旧的唯一约束
ALTER TABLE travel_logs DROP CONSTRAINT IF EXISTS travel_logs_trip_id_day_date_key;

-- 2. 添加新字段到 travel_logs
ALTER TABLE travel_logs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 3. 添加字段到 trip_images 标识图片来源
ALTER TABLE trip_images
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'gallery',
  ADD COLUMN IF NOT EXISTS log_id UUID REFERENCES travel_logs(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trip_images_source
  ON trip_images(source, log_id);

CREATE INDEX IF NOT EXISTS idx_travel_logs_trip_date_created
  ON travel_logs(trip_id, day_date, created_at DESC);

-- 4. 更新 trip_images 的 source 字段默认值
UPDATE trip_images SET source = 'gallery' WHERE source IS NULL;

-- 5. 更新 RLS 策略以支持新功能

-- 删除旧的策略
DROP POLICY IF EXISTS "成员可以创建记录" ON travel_logs;
DROP POLICY IF EXISTS "成员可以更新记录" ON travel_logs;

-- 创建新的策略
CREATE POLICY "成员可以创建记录"
  ON travel_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "成员可以更新自己的记录"
  ON travel_logs FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "创建者可以删除记录"
  ON travel_logs FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'owner'
    )
  );

-- 6. 添加注释
COMMENT ON TABLE travel_logs IS '旅行记录表 - 每个成员每天可以创建多条记录';
COMMENT ON COLUMN travel_logs.title IS '记录标题（可选）';
COMMENT ON COLUMN travel_logs.content IS '记录内容（富文本）';
COMMENT ON COLUMN travel_logs.images IS '记录图片URL数组';
COMMENT ON COLUMN travel_logs.is_private IS '是否为私密记录';
COMMENT ON COLUMN travel_logs.created_by IS '创建者ID';

COMMENT ON COLUMN trip_images.source IS '图片来源：gallery（照片库上传）或 log（旅行记录）';
COMMENT ON COLUMN trip_images.log_id IS '关联的旅行记录ID（如果来源是log）';
