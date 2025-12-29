'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, X, Image as ImageIcon, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils';
import Image from 'next/image';

interface TravelLogFormProps {
  tripId: string;
  date: string;
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    images?: string[];
    is_private?: boolean;
  };
  mode?: 'create' | 'edit';
}

export default function TravelLogForm({
  tripId,
  date,
  initialData,
  mode = 'create',
}: TravelLogFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 处理图片选择
  const handleImageSelect = async (files: FileList) => {
    if (images.length + files.length > 10) {
      setError('每条记录最多上传10张图片');
      return;
    }

    setUploadingImages(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('请先登录');
        setUploadingImages(false);
        return;
      }

      // 先创建记录（如果是新建模式）以获取logId
      let logId = initialData?.id;

      if (mode === 'create' && !logId) {
        const { data: newLog, error: createError } = await supabase
          .from('travel_logs')
          .insert({
            trip_id: tripId,
            day_date: date,
            title: title.trim() || null,
            content: content.trim(),
            images: [],
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        logId = newLog.id;
        if (initialData) {
          initialData.id = logId;
        }
      }

      const newImageUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setError('单张图片不能超过5MB');
          continue;
        }

        try {
          const { blob } = await compressImage(file, 2000, 0.92);

          // 生成文件路径
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const ext = file.name.split('.').pop();
          const filename = `log-${timestamp}-${randomStr}.${ext}`;
          const storagePath = `${tripId}/logs/${date}/${filename}`;

          // 上传到 Storage
          const { error: uploadError } = await supabase.storage
            .from('trip-images')
            .upload(storagePath, blob, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          // 获取公共URL
          const { data: { publicUrl } } = supabase.storage
            .from('trip-images')
            .getPublicUrl(storagePath);

          newImageUrls.push(publicUrl);

          // 保存到 trip_images 表（用于照片库统一展示）
          await supabase.from('trip_images').insert({
            trip_id: tripId,
            day_date: date,
            user_id: user.id,
            storage_path: storagePath,
            public_url: publicUrl,
            thumbnail_url: `${publicUrl}?width=400&quality=80`,
            original_filename: file.name,
            file_size: blob.size,
            caption: title || '旅行记录',
            source: 'log',
            log_id: logId,
          });
        } catch (err) {
          console.error('Image upload error:', err);
        }
      }

      // 更新记录的图片数组
      if (newImageUrls.length > 0) {
        await supabase
          .from('travel_logs')
          .update({
            images: [...images, ...newImageUrls],
          })
          .eq('id', logId);
      }

      setImages([...images, ...newImageUrls]);
    } catch (err) {
      setError('图片上传失败');
    } finally {
      setUploadingImages(false);
    }
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 保存记录
  const handleSave = async () => {
    if (!content.trim() && images.length === 0) {
      setError('请输入内容或上传图片');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('请先登录');
        setSaving(false);
        return;
      }

      if (mode === 'edit' && initialData?.id) {
        // 找出被移除的图片
        const removedImages = (initialData.images || []).filter(
          (img: string) => !images.includes(img)
        );

        // 删除 trip_images 中对应的记录
        if (removedImages.length > 0) {
          const { data: imagesToDelete } = await supabase
            .from('trip_images')
            .select('id, storage_path')
            .eq('log_id', initialData.id)
            .in('public_url', removedImages);

          if (imagesToDelete && imagesToDelete.length > 0) {
            // 从 Storage 删除文件
            const storagePaths = imagesToDelete
              .map((img) => img.storage_path)
              .filter(Boolean) as string[];

            if (storagePaths.length > 0) {
              await supabase.storage
                .from('trip-images')
                .remove(storagePaths);
            }

            // 从 trip_images 表删除记录
            await supabase
              .from('trip_images')
              .delete()
              .eq('log_id', initialData.id)
              .in('public_url', removedImages);
          }
        }

        // 更新现有记录
        const { error } = await supabase
          .from('travel_logs')
          .update({
            title: title.trim() || null,
            content: content.trim(),
            images,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('travel_logs')
          .insert({
            trip_id: tripId,
            day_date: date,
            title: title.trim() || null,
            content: content.trim(),
            images,
            created_by: user.id,
          });

        if (error) throw error;
      }

      router.push(`/trips/${tripId}/logs?date=${date}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || '保存失败');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}/logs?date=${date}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">
            {mode === 'edit' ? '编辑记录' : '新建记录'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* 标题输入 */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="添加标题（可选）"
              className="w-full px-4 py-3 text-lg font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-primary-500 placeholder-gray-400"
              disabled={saving}
            />
          </div>

          {/* 内容输入 */}
          <div className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录这一天的点点滴滴..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder-gray-400"
              disabled={saving}
            />
          </div>

          {/* 图片上传 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              添加照片 ({images.length}/10)
            </label>

            {/* 上传按钮 */}
            {images.length < 10 && (
              <div className="relative mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files && handleImageSelect(e.target.files)}
                  disabled={saving || uploadingImages}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-colors ${saving || uploadingImages ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 hover:bg-primary-50/30'}`}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      <span className="text-sm text-gray-600">上传中...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">添加照片（最多10张）</span>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* 图片预览 */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={imageUrl}
                      alt={`上传的图片 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={saving}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 touch-target"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-4">
            <Link href={`/trips/${tripId}/logs?date=${date}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full" disabled={saving}>
                取消
              </Button>
            </Link>
            <Button onClick={handleSave} className="flex-1" disabled={saving || uploadingImages}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
