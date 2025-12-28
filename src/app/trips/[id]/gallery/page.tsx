import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDaysRange } from '@/lib/utils';
import Image from 'next/image';

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { date } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 获取行程信息
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (!trip) {
    redirect('/dashboard');
  }

  // 获取图片
  const { data: images } = await supabase
    .from('trip_images')
    .select('*')
    .eq('trip_id', id)
    .order('created_at', { ascending: false });

  // 按日期分组图片
  const imagesByDate: Record<string, any[]> = {};
  images?.forEach((img) => {
    if (!imagesByDate[img.day_date]) {
      imagesByDate[img.day_date] = [];
    }
    imagesByDate[img.day_date].push(img);
  });

  // 获取日期范围
  const days = getDaysRange(trip.start_date, trip.end_date);

  // 选中的日期
  const selectedDate = date || trip.start_date;
  const selectedImages = imagesByDate[selectedDate] || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${id}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">照片库</h1>
          <Link href={`/trips/${id}/gallery/upload`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target text-primary-600">
              <Upload className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 日期选择器 */}
        <div className="flex overflow-x-auto gap-2 pb-4 -mx-4 px-4">
          {days.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const count = imagesByDate[dateStr]?.length || 0;

            return (
              <Link
                key={dateStr}
                href={`/trips/${id}/gallery?date=${dateStr}`}
                className={`
                  flex-shrink-0 w-16 p-2 rounded-lg text-center transition-all
                  ${isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                  }
                `}
              >
                <div className="text-xs opacity-80">
                  {day.getMonth() + 1}/{day.getDate()}
                </div>
                {count > 0 && (
                  <div className="text-xs mt-1 font-medium">{count}张</div>
                )}
              </Link>
            );
          })}
        </div>

        {/* 图片网格 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarIcon className="w-5 h-5" />
              <span className="font-medium">{selectedDate}</span>
            </div>
            <Link href={`/trips/${id}/gallery/upload?date=${selectedDate}`}>
              <Button size="sm">
                <Upload className="w-4 h-4 mr-2" />
                上传
              </Button>
            </Link>
          </div>

          {selectedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedImages.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group"
                >
                  <Image
                    src={img.thumbnail_url || img.public_url}
                    alt={img.caption || '旅行照片'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有照片</h3>
              <p className="text-gray-500 mb-6">上传第一张照片记录这一天吧</p>
              <Link href={`/trips/${id}/gallery/upload?date=${selectedDate}`}>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  上传照片
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 统计 */}
        {images && images.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            共 {images.length} 张照片
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href={`/trips/${id}/calendar`} className="flex flex-col items-center py-2 px-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">日历</span>
          </Link>
          <Link href={`/trips/${id}/logs`} className="flex flex-col items-center py-2 px-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">记录</span>
          </Link>
          <Link href={`/trips/${id}/gallery`} className="flex flex-col items-center py-2 px-3 text-primary-600">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">照片</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
