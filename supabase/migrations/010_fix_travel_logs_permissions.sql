-- ============================================
-- 修复旅行记录权限 - 只有创建者可以编辑和删除
-- ============================================

-- 删除旧的更新策略
DROP POLICY IF EXISTS "成员可以更新自己的记录" ON travel_logs;

-- 创建新的更新策略：只有创建者可以更新
CREATE POLICY "只有创建者可以更新记录"
  ON travel_logs FOR UPDATE
  USING (auth.uid() = created_by);

-- 删除旧的删除策略
DROP POLICY IF EXISTS "创建者可以删除记录" ON travel_logs;

-- 创建新的删除策略：只有创建者可以删除
CREATE POLICY "只有创建者可以删除记录"
  ON travel_logs FOR DELETE
  USING (auth.uid() = created_by);

-- 添加注释
COMMENT ON POLICY "只有创建者可以更新记录" ON travel_logs IS '只有记录的创建者可以更新自己的记录';
COMMENT ON POLICY "只有创建者可以删除记录" ON travel_logs IS '只有记录的创建者可以删除自己的记录';

