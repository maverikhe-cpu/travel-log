-- 创建 avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS 策略: 公开读取
CREATE POLICY "Avatar Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- RLS 策略: 用户只能上传自己的头像
CREATE POLICY "Avatar Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS 策略: 用户只能更新自己的头像
CREATE POLICY "Avatar Update" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS 策略: 用户只能删除自己的头像
CREATE POLICY "Avatar Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
