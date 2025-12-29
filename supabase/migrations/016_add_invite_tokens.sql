-- ============================================
-- 邀请令牌表 - 安全的邀请机制
-- ============================================

-- 1. 创建邀请令牌表
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('member', 'companion')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INT DEFAULT NULL, -- NULL 表示无限制
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_trip ON invite_tokens(trip_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_active ON invite_tokens(is_active, expires_at);

-- 3. 启用 RLS
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略

-- 行程成员可以查看邀请令牌
CREATE POLICY "成员可以查看邀请令牌"
  ON invite_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = invite_tokens.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- 行程 owner/editor 可以创建邀请令牌
CREATE POLICY "管理员可以创建邀请令牌"
  ON invite_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = invite_tokens.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
    AND auth.uid() = created_by
  );

-- 行程 owner/editor 可以更新邀请令牌
CREATE POLICY "管理员可以更新邀请令牌"
  ON invite_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = invite_tokens.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- 行程 owner/editor 可以删除邀请令牌
CREATE POLICY "管理员可以删除邀请令牌"
  ON invite_tokens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = invite_tokens.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- 5. 创建函数：验证邀请令牌
CREATE OR REPLACE FUNCTION verify_invite_token(p_token TEXT)
RETURNS TABLE (
  trip_id UUID,
  invite_type TEXT,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_token_record invite_tokens%ROWTYPE;
BEGIN
  -- 查找令牌
  SELECT * INTO v_token_record
  FROM invite_tokens
  WHERE token = p_token
  AND is_active = true;

  -- 如果令牌不存在
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, '邀请链接无效'::TEXT;
    RETURN;
  END IF;

  -- 检查是否过期
  IF v_token_record.expires_at IS NOT NULL AND v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT v_token_record.trip_id, v_token_record.invite_type, false, '邀请链接已过期'::TEXT;
    RETURN;
  END IF;

  -- 检查使用次数限制
  IF v_token_record.max_uses IS NOT NULL AND v_token_record.used_count >= v_token_record.max_uses THEN
    RETURN QUERY SELECT v_token_record.trip_id, v_token_record.invite_type, false, '邀请链接使用次数已达上限'::TEXT;
    RETURN;
  END IF;

  -- 令牌有效
  RETURN QUERY SELECT v_token_record.trip_id, v_token_record.invite_type, true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建函数：使用邀请令牌（增加使用计数）
CREATE OR REPLACE FUNCTION use_invite_token(p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE invite_tokens
  SET used_count = used_count + 1
  WHERE token = p_token
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_uses IS NULL OR used_count < max_uses);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 添加注释
COMMENT ON TABLE invite_tokens IS '邀请令牌表 - 安全的邀请机制，支持不同类型的邀请';
COMMENT ON COLUMN invite_tokens.token IS '邀请令牌（唯一标识）';
COMMENT ON COLUMN invite_tokens.invite_type IS '邀请类型：member（正式成员）, companion（云伴游）';
COMMENT ON COLUMN invite_tokens.expires_at IS '过期时间（NULL 表示永不过期）';
COMMENT ON COLUMN invite_tokens.max_uses IS '最大使用次数（NULL 表示无限制）';
COMMENT ON COLUMN invite_tokens.used_count IS '已使用次数';
COMMENT ON COLUMN invite_tokens.is_active IS '是否激活';

