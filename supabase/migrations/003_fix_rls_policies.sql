-- ============================================
-- 修复 RLS 策略循环依赖问题
-- ============================================

-- 删除有问题的策略
DROP POLICY IF EXISTS "成员可以查看行程成员" ON trip_members;
DROP POLICY IF EXISTS "创建者可以邀请成员" ON trip_members;

-- 重新创建更简单的策略
CREATE POLICY "成员可以查看行程成员"
  ON trip_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "创建者可以邀请成员"
  ON trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.created_by = auth.uid()
    )
    OR
    -- 允许行程创建者将自己添加为成员
    (
      SELECT trips.created_by FROM trips WHERE trips.id = trip_members.trip_id
    ) = auth.uid()
  );

-- 同时给 trips 表添加更宽松的查看策略
DROP POLICY IF EXISTS "成员可以查看参与的行程" ON trips;

CREATE POLICY "成员可以查看参与的行程"
  ON trips FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
    )
  );
