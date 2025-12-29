-- ============================================
-- 修复 profiles RLS 策略
-- 允许行程成员查看彼此的基本资料
-- ============================================

-- 删除旧的 profiles 查看策略
DROP POLICY IF EXISTS "用户可以查看自己的资料" ON profiles;

-- 创建新的策略：允许查看自己的资料，也允许查看同一行程成员的资料
CREATE POLICY "用户可以查看自己及行程成员的资料"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.user_id = profiles.id
      AND trip_members.trip_id IN (
        SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
      )
    )
  );

-- 说明：
-- 这个策略允许用户查看：
-- 1. 自己的完整资料
-- 2. 与自己同在一个行程的成员的资料（用于显示上传者信息）
