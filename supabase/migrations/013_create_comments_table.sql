-- ============================================
-- 评论表 - 支持对日志、照片、活动进行评论
-- ============================================

-- 1. 创建评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('log', 'image', 'activity')),
  target_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_trip_target ON comments(trip_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 3. 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略

-- 行程成员和未屏蔽的云伴游可以查看评论
CREATE POLICY "成员可以查看评论"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = comments.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- 行程成员和未屏蔽的云伴游可以创建评论
CREATE POLICY "成员可以创建评论"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = comments.trip_id
      AND trip_members.user_id = auth.uid()
      AND (trip_members.role != 'companion' OR trip_members.is_blocked = false)
    )
    AND auth.uid() = user_id
  );

-- 评论作者可以编辑自己的评论
CREATE POLICY "作者可以编辑评论"
  ON comments FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = comments.trip_id
      AND trip_members.user_id = auth.uid()
      AND (trip_members.role != 'companion' OR trip_members.is_blocked = false)
    )
  );

-- 评论作者和行程 owner 可以删除评论
CREATE POLICY "作者和所有者可以删除评论"
  ON comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = comments.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'owner'
    )
  );

-- 5. 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- 6. 添加注释
COMMENT ON TABLE comments IS '评论表 - 支持对日志(log)、照片(image)、活动(activity)进行评论';
COMMENT ON COLUMN comments.target_type IS '评论目标类型：log（日志）, image（照片）, activity（活动）';
COMMENT ON COLUMN comments.target_id IS '评论目标的 ID（对应 travel_logs.id 或 trip_images.id 或 activities.id）';
COMMENT ON COLUMN comments.content IS '评论内容，最长 1000 字符';
