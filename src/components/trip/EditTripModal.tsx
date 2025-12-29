'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, Image as ImageIcon, Loader2, Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils';
import Image from 'next/image';
import PhotoSelectorModal from './PhotoSelectorModal';

interface EditTripModalProps {
  tripId: string;
  initialName: string;
  initialDescription: string | null;
  initialStartDate: string;
  initialEndDate: string;
  initialCoverUrl?: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditTripModal({
  tripId,
  initialName,
  initialDescription,
  initialStartDate,
  initialEndDate,
  initialCoverUrl,
  onClose,
  onUpdate,
}: EditTripModalProps) {
  const supabase = createClient();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialCoverUrl || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  // 计算天数
  const daysCount =
    startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

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

  // 处理从照片库选择照片
  const handlePhotoFromGallery = (photoUrl: string) => {
    setCoverPreview(photoUrl);
    setCoverFile(null); // 清除文件上传，因为我们使用的是现有照片的URL
    setShowPhotoSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证
    if (!name.trim()) {
      setError('请输入行程名称');
      setLoading(false);
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('结束日期不能早于开始日期');
      setLoading(false);
      return;
    }

    try {
      // 先上传封面（如果有新选择的文件）
      let newCoverUrl = initialCoverUrl;

      // 如果有新上传的文件
      if (coverFile) {
        setUploadingCover(true);
        try {
          const { blob } = await compressImage(coverFile, 2000, 0.92);

          // 生成文件路径
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const ext = coverFile.name.split('.').pop();
          const filename = `cover-${timestamp}-${randomStr}.${ext}`;
          const storagePath = `${tripId}/covers/${filename}`;

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

          newCoverUrl = publicUrl;
        } catch (err) {
          console.error('Cover upload error:', err);
          setError('封面上传失败');
          setLoading(false);
          setUploadingCover(false);
          return;
        } finally {
          setUploadingCover(false);
        }
      } else if (coverPreview && coverPreview !== initialCoverUrl) {
        // 如果从照片库选择了照片（coverPreview改变了但coverFile为空）
        newCoverUrl = coverPreview;
      }

      // 更新行程信息
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate,
          end_date: endDate,
          cover_image_url: newCoverUrl,
        })
        .eq('id', tripId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // 成功更新，关闭模态框并触发刷新
      onUpdate();
      onClose();
    } catch {
      setError('更新失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">编辑行程信息</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 行程封面 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                行程封面
              </label>
              {!coverPreview ? (
                <div className="space-y-3">
                  {/* 上传区域 */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => e.target.files && handleCoverSelect(e.target.files[0])}
                      disabled={loading}
                      className="hidden"
                      id="cover-upload-edit"
                    />
                    <label
                      htmlFor="cover-upload-edit"
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer ${loading || uploadingCover ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'}`}
                    >
                      {uploadingCover ? (
                        <>
                          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-2" />
                          <p className="text-sm text-gray-600">上传中...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">点击上传封面</p>
                          <p className="text-xs text-gray-500">建议 16:9，最大 5MB</p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* 从照片库选择按钮 */}
                  <button
                    type="button"
                    onClick={() => setShowPhotoSelector(true)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Images className="w-4 h-4" />
                    从照片库选择
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <div className="aspect-video w-full relative bg-gray-100">
                    <Image
                      src={coverPreview}
                      alt="封面预览"
                      fill
                      className="object-cover"
                    />
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2">
                          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                          <span className="text-sm font-medium">上传中...</span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setCoverFile(null);
                      }}
                      disabled={loading || uploadingCover}
                      className="absolute top-3 right-3 w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors disabled:opacity-50 touch-target"
                    >
                      <X className="w-5 h-5 text-white" />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || uploadingCover || !name.trim()}>
                {loading || uploadingCover ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadingCover ? '上传中...' : '保存中...'}
                  </>
                ) : (
                  '保存更改'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 照片选择器模态框 */}
      {showPhotoSelector && (
        <PhotoSelectorModal
          tripId={tripId}
          onClose={() => setShowPhotoSelector(false)}
          onSelect={handlePhotoFromGallery}
        />
      )}
    </>
  );
}
