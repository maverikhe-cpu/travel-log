'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils';

interface AvatarUploaderProps {
  currentAvatar: string | null;
  username: string;
  onAvatarUpdate: (url: string) => void;
}

export default function AvatarUploader({ currentAvatar, username, onAvatarUpdate }: AvatarUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('请先登录');
      }

      // 压缩图片 (200x200)
      const { blob } = await compressImage(file, 200, 0.85);

      // 生成文件路径
      const ext = file.name.split('.').pop();
      const filename = `avatar.${ext}`;
      const storagePath = `${user.id}/${filename}`;

      // 上传到 Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(storagePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(storagePath);

      // 更新数据库
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
    } catch (error: any) {
      alert('上传失败：' + (error.message || '未知错误'));
    } finally {
      setUploading(false);
      // 重置 input 以便重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      {/* 头像 */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary-100 rounded-full overflow-hidden flex items-center justify-center">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl sm:text-4xl text-primary-600 font-semibold">
            {username?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>

      {/* 上传按钮 */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </button>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
