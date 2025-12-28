import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Calendar as CalendarIcon, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDaysRange } from '@/lib/utils';

export default async function LogsPage({
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

  // 获取旅行记录（RLS 会自动过滤私密记录）
  const { data: logs } = await supabase
    .from('travel_logs')
    .select('*')
    .eq('trip_id', id)
    .order('day_date', { ascending: true });

  // 按日期索引记录
  const logsByDate: Record<string, any> = {};
  logs?.forEach((log) => {
    logsByDate[log.day_date] = log;
  });

  // 获取日期范围
  const days = getDaysRange(trip.start_date, trip.end_date);

  // 选中的日期
  const selectedDate = date || trip.start_date;
  const selectedLog = logsByDate[selectedDate];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${id}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">旅行记录</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 日期选择器 */}
        <div className="flex overflow-x-auto gap-2 pb-4 -mx-4 px-4">
          {days.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const log = logsByDate[dateStr];
            const hasLog = !!log;
            const isPrivate = log?.is_private;

            return (
              <Link
                key={dateStr}
                href={`/trips/${id}/logs?date=${dateStr}`}
                className={`
                  flex-shrink-0 w-16 p-2 rounded-lg text-center transition-all relative
                  ${isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                  }
                `}
              >
                <div className="text-xs opacity-80">
                  {day.getMonth() + 1}/{day.getDate()}
                </div>
                {hasLog && (
                  <div className={`
                    w-1.5 h-1.5 rounded-full mx-auto mt-1
                    ${isPrivate ? 'bg-purple-400' : 'bg-primary-500'}
                  `} />
                )}
                {isPrivate && (
                  <div className="absolute top-1 right-1">
                    <Lock className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* 记录显示 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarIcon className="w-5 h-5" />
              <span className="font-medium">{selectedDate}</span>
            </div>
            {selectedLog?.is_private && (
              <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                <Lock className="w-3 h-3" />
                <span>私密</span>
              </div>
            )}
          </div>

          <div className="p-4">
            {selectedLog?.content ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedLog.content }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>这一天还没有记录</p>
                <p className="text-sm mt-2">记录下当天的所见所闻吧</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            {/* 只有创建者可以编辑自己的记录 */}
            {selectedLog?.created_by === user.id ? (
              <Link href={`/trips/${id}/logs/edit?date=${selectedDate}`}>
                <Button className="w-full">
                  {selectedLog?.content ? '编辑记录' : '添加记录'}
                </Button>
              </Link>
            ) : (
              <div className="text-center text-sm text-gray-500">
                {selectedLog?.content
                  ? '这是其他成员的私密记录'
                  : '添加你的旅行记录'
                }
              </div>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 旅行记录支持文字和图片，帮助你记录旅途中的点点滴滴。你可以将记录设置为私密，仅自己可见。
          </p>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href={`/trips/${id}/calendar`} className="flex flex-col items-center py-2 px-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">日历</span>
          </Link>
          <Link href={`/trips/${id}/logs`} className="flex flex-col items-center py-2 px-3 text-primary-600">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">记录</span>
          </Link>
          <Link href={`/trips/${id}/gallery`} className="flex flex-col items-center py-2 px-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">照片</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
