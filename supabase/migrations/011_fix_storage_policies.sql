-- ============================================
-- 修复 Storage RLS 策略
-- 上传路径是 {tripId}/{date}/{filename}
-- 但原策略检查的是 auth.uid()，导致上传失败
-- ============================================

-- 删除旧的策略
DROP POLICY IF EXISTS "成员可以上传图片" ON storage.objects;
DROP POLICY IF EXISTS "成员可以查看图片" ON storage.objects;
DROP POLICY IF EXISTS "上传者可以删除图片" ON storage.objects;

-- 创建新的策略：检查是否为该行程的成员
CREATE POLICY "成员可以上传图片"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-images' AND
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.user_id = auth.uid()
      AND trip_members.trip_id::TEXT = (storage.foldername(name))[1]::TEXT
    )
  );

CREATE POLICY "成员可以查看图片"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-images');

CREATE POLICY "上传者可以删除图片"
  ON storage.objects FOR DELETE
  WITH CHECK (
    bucket_id = 'trip-images' AND
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.user_id = auth.uid()
      AND trip_members.trip_id::TEXT = (storage.foldername(name))[1]::TEXT
    )
  );
