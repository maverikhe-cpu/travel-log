-- ============================================
-- 云伴游角色 - 扩展 trip_members 表
-- ============================================

-- 1. 修改角色约束，添加 companion 角色
ALTER TABLE trip_members
DROP CONSTRAINT IF EXISTS trip_members_role_check;

ALTER TABLE trip_members
ADD CONSTRAINT trip_members_role_check
CHECK (role IN ('owner', 'editor', 'viewer', 'companion'));

-- 2. 添加屏蔽字段（用于云伴游）
ALTER TABLE trip_members
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- 3. 添加注释
COMMENT ON COLUMN trip_members.role IS '角色：owner（所有者）, editor（编辑者）, viewer（查看者）, companion（云伴游）';
COMMENT ON COLUMN trip_members.is_blocked IS '是否被屏蔽（仅用于云伴游，被屏蔽后无法点赞/评论）';

-- 4. 创建索引（用于快速查询未屏蔽的成员）
CREATE INDEX IF NOT EXISTS idx_trip_members_role_blocked
  ON trip_members(trip_id, role, is_blocked);
