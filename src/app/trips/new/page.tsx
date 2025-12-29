'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils';

export default function NewTripPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2025-03-15');
  const [endDate, setEndDate] = useState('2025-03-21');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');

  const handleCoverSelect = async (file: File) => {
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

    try {
      // 压缩图片并创建预览
      const { blob } = await compressImage(file, 2000, 0.92);
      const preview = URL.createObjectURL(blob);
      setCoverPreview(preview);
      setCoverFile(file);
    } catch (err) {
      setError('图片处理失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      // 创建行程
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          name,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
          created_by: user.id,
        })
        .select()
        .single();

      if (tripError) {
        setError(tripError.message);
        setLoading(false);
        return;
      }

      // 添加创建者为成员
      const { error: memberError } = await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      // 上传封面图片（如果有）
      if (coverFile) {
        setUploadingCover(true);
        try {
          const { blob } = await compressImage(coverFile, 2000, 0.92);

          // 生成文件路径
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const ext = coverFile.name.split('.').pop();
          const filename = `cover-${timestamp}-${randomStr}.${ext}`;
          const storagePath = `${trip.id}/covers/${filename}`;

          // 上传到 Storage
          const { error: uploadError } = await supabase.storage
            .from('trip-images')
            .upload(storagePath, blob, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // 获取公共URL
          const { data: { publicUrl } } = supabase.storage
            .from('trip-images')
            .getPublicUrl(storagePath);

          // 更新行程封面
          await supabase
            .from('trips')
            .update({ cover_image_url: publicUrl })
            .eq('id', trip.id);
        } catch (err) {
          console.error('Cover upload error:', err);
          // 封面上传失败不影响行程创建
        } finally {
          setUploadingCover(false);
        }
      }

      router.push(`/trips/${trip.id}`);
      router.refresh();
    } catch {
      setError('创建失败，请稍后重试');
      setLoading(false);
    }
  };

  const daysCount =
    startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

  return (
    <div className="min-h-screen bg-background text-ink-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-semibold">创建新行程</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 行程封面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              行程封面
            </label>
            {!coverPreview ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files && handleCoverSelect(e.target.files[0])}
                  disabled={loading}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">点击上传封面图片</p>
                  <p className="text-xs text-gray-500 text-center">支持 JPG、PNG、WebP 格式，建议 16:9，最大 5MB</p>
                </label>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-video w-full relative bg-gray-100">
                  <img
                    src={coverPreview}
                    alt="封面预览"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview(null);
                      setCoverFile(null);
                    }}
                    disabled={loading}
                    className="absolute top-3 right-3 w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors disabled:opacity-50 touch-target"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 行程名称 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              行程名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：2025川渝七日游"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* 行程描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              行程描述
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述一下这次旅行..."
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-100"
            />
          </div>

          {/* 日期范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                结束日期 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* 预览天数 */}
          {startDate && endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                共 {daysCount} 天
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <Link href="/dashboard" className="flex-1">
              <Button type="button" variant="outline" className="w-full" disabled={loading}>
                取消
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={loading || uploadingCover || !name}>
              {loading || uploadingCover ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingCover ? '上传封面中...' : '创建中...'}
                </>
              ) : (
                '创建行程'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
