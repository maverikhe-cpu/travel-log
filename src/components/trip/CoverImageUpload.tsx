'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils';
import Image from 'next/image';

interface CoverImageUploadProps {
  currentCoverUrl?: string | null;
  onCoverChange: (coverUrl: string | null) => void;
  tripId?: string; // 用于编辑时上传
}

export default function CoverImageUpload({
  currentCoverUrl,
  onCoverChange,
  tripId,
}: CoverImageUploadProps) {
  const supabase = createClient();

  const [preview, setPreview] = useState<string | null>(currentCoverUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (file: File) => {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }

      // 验证文件大小（最大5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }

      setError('');
      setUploading(true);

      try {
        // 压缩图片
        const { blob } = await compressImage(file, 2000, 0.92);

        // 生成文件路径
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const filename = `cover-${timestamp}-${randomStr}.${ext}`;

        // 如果有tripId，上传到trip-images bucket，否则先不上传（创建时）
        let publicUrl = '';

        if (tripId) {
          // 编辑模式：直接上传到Storage
          const storagePath = `${tripId}/covers/${filename}`;

          const { data, error: uploadError } = await supabase.storage
            .from('trip-images')
            .upload(storagePath, blob, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // 获取公共URL
          const { data: { publicUrl: url } } = supabase.storage
            .from('trip-images')
            .getPublicUrl(storagePath);

          publicUrl = url;
        } else {
          // 创建模式：创建临时预览URL
          publicUrl = URL.createObjectURL(blob);
        }

        // 更新预览和回调
        setPreview(publicUrl);
        onCoverChange(publicUrl);
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(err.message || '上传失败');
      } finally {
        setUploading(false);
      }
    },
    [tripId, onCoverChange]
  );

  // 移除封面
  const handleRemove = () => {
    setPreview(null);
    onCoverChange(null);
    setError('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        行程封面
      </label>

      {/* 上传区域 */}
      <div className="relative">
        {!preview ? (
          /* 上传框 */
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              disabled={uploading}
              className="hidden"
              id="cover-upload"
            />
            <label
              htmlFor="cover-upload"
              className={`
                flex flex-col items-center justify-center
                border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer
                ${uploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'}
              `}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-3" />
                  <p className="text-sm text-gray-600">上传中...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    点击上传封面图片
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    支持 JPG、PNG、WebP 格式<br />
                    建议尺寸 16:9，最大 5MB
                  </p>
                </>
              )}
            </label>
          </div>
        ) : (
          /* 预览图 */
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <div className="aspect-video w-full relative">
              <Image
                src={preview}
                alt="行程封面预览"
                fill
                className="object-cover"
              />
              {/* 删除按钮 */}
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="absolute top-3 right-3 w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors disabled:opacity-50 touch-target"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              {/* 上传中遮罩 */}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    <span className="text-sm font-medium">上传中...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 提示信息 */}
      {!preview && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            💡 推荐使用横屏照片作为封面，视觉效果更佳
          </p>
        </div>
      )}
    </div>
  );
}
