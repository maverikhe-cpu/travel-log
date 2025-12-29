-- ============================================
-- 点赞表 - 支持对日志、照片、评论进行点赞
-- ============================================

-- 1. 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('log', 'image', 'comment')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_trip ON likes(trip_id);
CREATE INDEX IF NOT EXISTS idx_likes_count ON likes(target_type, target_id) WHERE created_at IS NOT NULL;

-- 3. 启用 RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略

-- 行程成员可以查看点赞
CREATE POLICY "成员可以查看点赞"
  ON likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = likes.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- 行程成员和未屏蔽的云伴游可以点赞
CREATE POLICY "成员可以点赞"
  ON likes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = likes.trip_id
      AND trip_members.user_id = auth.uid()
      AND (trip_members.role != 'companion' OR trip_members.is_blocked = false)
    )
    AND auth.uid() = user_id
  );

-- 用户可以取消自己的点赞
CREATE POLICY "用户可以取消点赞"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 添加注释
COMMENT ON TABLE likes IS '点赞表 - 支持对日志(log)、照片(image)、评论(comment)进行点赞';
COMMENT ON COLUMN likes.target_type IS '点赞目标类型：log（日志）, image（照片）, comment（评论）';
COMMENT ON COLUMN likes.target_id IS '点赞目标的 ID';
COMMENT ON COLUMN likes.trip_id IS '行程 ID（冗余字段，用于 RLS 查询优化）';

-- 6. 创建辅助函数：获取点赞数
CREATE OR REPLACE FUNCTION get_like_count(p_target_type TEXT, p_target_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT FROM likes
  WHERE target_type = p_target_type AND target_id = p_target_id;
$$ LANGUAGE SQL STABLE;

-- 7. 创建辅助函数：检查用户是否已点赞
CREATE OR REPLACE FUNCTION is_liked(p_user_id UUID, p_target_type TEXT, p_target_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE user_id = p_user_id
    AND target_type = p_target_type
    AND target_id = p_target_id
  );
$$ LANGUAGE SQL STABLE;
