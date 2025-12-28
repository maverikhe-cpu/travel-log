-- ============================================
-- 修复费用表 UPDATE RLS 策略
-- ============================================
-- 问题：UPDATE 策略缺少 WITH CHECK 子句，导致更新操作返回 0 行
-- 解决：添加 WITH CHECK 子句，确保更新后的值也符合策略

-- 删除旧的 UPDATE 策略
DROP POLICY IF EXISTS "Creators or editors can update expenses" ON expenses;

-- 重新创建包含 WITH CHECK 的 UPDATE 策略
CREATE POLICY "Creators or editors can update expenses"
  ON expenses FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

