-- ============================================
-- 举报表 - 支持举报不当评论
-- ============================================

-- 1. 创建举报表
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('comment')),
  target_id UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_reports_trip ON reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);

-- 3. 启用 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略

-- 行程成员可以查看举报
CREATE POLICY "成员可以查看举报"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = reports.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- 行程成员可以创建举报
CREATE POLICY "成员可以创建举报"
  ON reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = reports.trip_id
      AND trip_members.user_id = auth.uid()
      AND (trip_members.role != 'companion' OR trip_members.is_blocked = false)
    )
    AND auth.uid() = reporter_id
  );

-- 行程 owner/editor 可以更新举报状态
CREATE POLICY "管理员可以处理举报"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = reports.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- 5. 添加注释
COMMENT ON TABLE reports IS '举报表 - 支持举报不当内容';
COMMENT ON COLUMN reports.target_type IS '被举报目标类型（目前仅支持 comment）';
COMMENT ON COLUMN reports.target_id IS '被举报目标的 ID';
COMMENT ON COLUMN reports.reason IS '举报原因';
COMMENT ON COLUMN reports.status IS '处理状态：pending（待处理）, resolved（已处理）, dismissed（已驳回）';
COMMENT ON COLUMN reports.reviewed_by IS '处理人 ID';
COMMENT ON COLUMN reports.reviewed_at IS '处理时间';
