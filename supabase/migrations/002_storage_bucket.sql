-- ============================================
-- 图片存储 Bucket 配置
-- ============================================

-- 创建 trip-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- Storage RLS 策略
-- ============================================

-- 成员可以上传图片
CREATE POLICY "成员可以上传图片"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]::TEXT -- 通过路径验证
  );

-- 成员可以查看图片
CREATE POLICY "成员可以查看图片"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-images');

-- 上传者可以删除自己的图片
CREATE POLICY "上传者可以删除图片"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trip-images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]::TEXT
  );
