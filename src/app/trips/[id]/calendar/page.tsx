import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Plus, MapPin, Utensils, Car, Home, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDaysRange } from '@/lib/utils';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';

const categoryIcons: Record<string, any> = {
  attraction: MapPin,
  food: Utensils,
  transport: Car,
  accommodation: Home,
  other: Circle,
};

export default async function CalendarPage({
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

  // 获取活动
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', id)
    .order('day_date', { ascending: true })
    .order('order_index', { ascending: true });

  // 获取日期范围
  const days = getDaysRange(trip.start_date, trip.end_date);

  // 按日期分组活动
  const activitiesByDate: Record<string, any[]> = {};
  activities?.forEach((activity) => {
    if (!activitiesByDate[activity.day_date]) {
      activitiesByDate[activity.day_date] = [];
    }
    activitiesByDate[activity.day_date].push(activity);
  });

  // 选中的日期，默认为第一天
  const selectedDate = date || trip.start_date;
  const selectedDayIndex = days.findIndex(
    (d) => d.toISOString().split('T')[0] === selectedDate
  );
  const selectedDayActivities = activitiesByDate[selectedDate] || [];

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
          <h1 className="text-lg font-semibold">行程日历</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 日期选择器 (移动端：横向滚动，桌面端：网格) */}
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7 md:overflow-visible">
            {days.map((day) => {
              const dateStr = day.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const hasActivities = activitiesByDate[dateStr]?.length > 0;

              return (
                <Link
                  key={dateStr}
                  href={`/trips/${id}/calendar?date=${dateStr}`}
                  className={`
                    flex-shrink-0 w-20 p-3 rounded-xl border text-center transition-all
                    ${isSelected
                      ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                    }
                  `}
                >
                  <div className="text-xs opacity-80 mb-1">
                    {day.getMonth() + 1}/{day.getDate()}
                  </div>
                  <div className="font-semibold">
                    {['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}
                  </div>
                  {hasActivities && (
                    <div className="flex justify-center mt-2 gap-0.5">
                      {activitiesByDate[dateStr].slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-primary-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 当日活动列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedDayIndex === 0 ? '出发日' : selectedDayIndex === days.length - 1 ? '返程日' : `第${selectedDayIndex + 1}天`}
              </h2>
              <p className="text-sm text-gray-500">{selectedDate}</p>
            </div>
            <Link href={`/trips/${id}/activities/new?date=${selectedDate}`}>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </Link>
          </div>

          <div className="p-4">
            {selectedDayActivities.length > 0 ? (
              <div className="space-y-3">
                {selectedDayActivities.map((activity) => {
                  const Icon = categoryIcons[activity.category as string] || Circle;
                  const categoryConfig = ACTIVITY_CATEGORIES[activity.category as keyof typeof ACTIVITY_CATEGORIES];

                  return (
                    <Link
                      key={activity.id}
                      href={`/trips/${id}/activities/${activity.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg ${categoryConfig.bgColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${categoryConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                        {activity.location && (
                          <p className="text-sm text-gray-500 truncate">{activity.location}</p>
                        )}
                        {activity.start_time && (
                          <p className="text-sm text-gray-500">
                            {activity.start_time}
                            {activity.end_time && ` - ${activity.end_time}`}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>这一天还没有安排活动</p>
                <Link href={`/trips/${id}/activities/new?date=${selectedDate}`}>
                  <Button variant="ghost" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    添加活动
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href={`/trips/${id}/calendar`} className="flex flex-col items-center py-2 px-3 text-primary-600">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">日历</span>
          </Link>
          <Link href={`/trips/${id}/logs`} className="flex flex-col items-center py-2 px-3">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">记录</span>
          </Link>
          <Link href={`/trips/${id}/gallery`} className="flex flex-col items-center py-2 px-3">
            <Circle className="w-5 h-5" />
            <span className="text-xs mt-1">照片</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
