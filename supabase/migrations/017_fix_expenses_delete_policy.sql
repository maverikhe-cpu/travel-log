-- ============================================
-- 修复费用表 DELETE RLS 策略
-- ============================================
-- 问题：删除策略只允许创建者和所有者删除，但更新策略已扩展到编辑者
-- 解决：允许创建者、漫游长和漫行客删除费用

-- 删除旧的删除策略
DROP POLICY IF EXISTS "Creators can delete expenses" ON expenses;

-- 重新创建包含漫行客的删除策略
CREATE POLICY "Creators can delete expenses"
  ON expenses FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );
