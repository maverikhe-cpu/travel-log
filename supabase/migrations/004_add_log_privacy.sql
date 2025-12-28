-- ============================================
-- 添加旅行记录隐私设置
-- ============================================

-- 添加 is_private 字段，默认为 false（公开）
ALTER TABLE travel_logs
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 添加注释
COMMENT ON COLUMN travel_logs.is_private IS '私密记录，仅创建者可见';

-- ============================================
-- 更新 RLS 策略
-- ============================================

-- 删除旧的策略
DROP POLICY IF EXISTS "成员可以查看记录" ON travel_logs;
DROP POLICY IF EXISTS "成员可以创建记录" ON travel_logs;
DROP POLICY IF EXISTS "成员可以更新记录" ON travel_logs;

-- 创建新的策略（考虑隐私设置）
CREATE POLICY "成员可以查看公开记录"
  ON travel_logs FOR SELECT
  USING (
    -- 公开记录：行程成员可见
    NOT is_private AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = travel_logs.trip_id
      AND trips.created_by = auth.uid()
    )
    OR
    -- 或通过 trip_members 可见
    NOT is_private AND EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "创建者可以查看自己的私密记录"
  ON travel_logs FOR SELECT
  USING (
    is_private AND created_by = auth.uid()
  );

CREATE POLICY "成员可以创建记录"
  ON travel_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = travel_logs.trip_id
      AND trips.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "创建者可以更新记录"
  ON travel_logs FOR UPDATE
  USING (created_by = auth.uid());
