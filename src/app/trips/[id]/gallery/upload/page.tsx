'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { compressImage, formatFileSize } from '@/lib/utils';

interface UploadFile {
  file: File;
  preview: string;
  compressed: Blob | null;
  width: number;
  height: number;
  uploading: boolean;
  error: string;
}

export default function ImageUploadPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const supabase = createClient();

  const [date, setDate] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingAll, setUploadingAll] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
      setDate(dateParam);
    }
  }, []);

  // 处理文件选择
  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    // 验证文件类型和大小
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    // 限制最多10张
    const availableSlots = 10 - files.length;
    const filesToProcess = validFiles.slice(0, availableSlots);

    const processedFiles: UploadFile[] = [];

    for (const file of filesToProcess) {
      // 创建预览
      const preview = URL.createObjectURL(file);

      // 压缩图片 - 使用高质量设置
      try {
        const { blob, width, height } = await compressImage(file, 2000, 0.92);
        processedFiles.push({
          file,
          preview,
          compressed: blob,
          width,
          height,
          uploading: false,
          error: '',
        });
      } catch {
        processedFiles.push({
          file,
          preview,
          compressed: null,
          width: 0,
          height: 0,
          uploading: false,
          error: '压缩失败',
        });
      }
    }

    setFiles(prev => [...prev, ...processedFiles]);
  }, [files.length]);

  // 拖拽处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 上传单个文件
  const uploadFile = async (uploadFile: UploadFile, index: number) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, uploading: true, error: '' } : f));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('请先登录');
      }

      // 生成文件路径
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = uploadFile.file.name.split('.').pop();
      const filename = `${timestamp}-${randomStr}.${ext}`;
      const storagePath = `${tripId}/${date}/${filename}`;

      // 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('trip-images')
        .upload(storagePath, uploadFile.compressed || uploadFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('trip-images')
        .getPublicUrl(storagePath);

      // 生成缩略图URL (使用 Supabase 图片转换)
      const thumbnailUrl = `${publicUrl}?width=400&quality=80`;

      // 保存到数据库
      const { data: insertData, error: dbError } = await supabase.from('trip_images').insert({
        trip_id: tripId,
        day_date: date,
        user_id: user.id,
        storage_path: storagePath,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        original_filename: uploadFile.file.name,
        file_size: uploadFile.compressed?.size || uploadFile.file.size,
        width: uploadFile.width,
        height: uploadFile.height,
      }).select();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      console.log('Image saved to database:', insertData);

      // 标记上传成功
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, uploading: false } : f));
    } catch (error: any) {
      setFiles(prev => prev.map((f, i) => i === index ? {
        ...f,
        uploading: false,
        error: error.message || '上传失败',
      } : f));
    }
  };

  // 上传所有文件
  const uploadAll = async () => {
    setUploadingAll(true);

    for (let i = 0; i < files.length; i++) {
      if (!files[i].error && !files[i].uploading) {
        await uploadFile(files[i], i);
      }
    }

    setUploadingAll(false);

    // 检查是否全部成功
    const allSuccess = files.every(f => !f.error && !f.uploading);
    if (allSuccess) {
      setTimeout(() => {
        router.push(`/trips/${tripId}/gallery?date=${date}`);
      }, 500);
    }
  };

  // 移除文件
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}/gallery${date ? `?date=${date}` : ''}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">上传照片</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 日期选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 上传区域 */}
        {files.length < 10 && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">点击或拖拽上传照片</p>
              <p className="text-sm text-gray-500">
                支持 JPG、PNG 格式，单张最大 5MB，最多 10 张
              </p>
            </label>
          </div>
        )}

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                已选择 {files.length} 张照片
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiles([])}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  清空
                </button>
                <Button
                  onClick={uploadAll}
                  disabled={!date || uploadingAll || files.length === 0}
                  className="touch-target"
                >
                  {uploadingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      上传全部
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* 预览图 */}
                  <div className="aspect-square relative">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />

                    {/* 上传进度 */}
                    {file.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}

                    {/* 成功标记 */}
                    {!file.uploading && !file.error && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}

                    {/* 错误标记 */}
                    {file.error && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}

                    {/* 删除按钮 */}
                    <button
                      onClick={() => removeFile(index)}
                      disabled={file.uploading}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* 文件信息 */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {file.width > 0 ? `${file.width}×${file.height}` : formatFileSize(file.file.size)}
                      </p>
                      {file.error && (
                        <p className="text-xs text-red-500 truncate">{file.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 大图会自动压缩（最大尺寸≤2000px），小图保持原样。使用高质量压缩算法，最大程度保留照片质量。上传后按日期分组展示在照片库中。
          </p>
        </div>
      </main>
    </div>
  );
}
