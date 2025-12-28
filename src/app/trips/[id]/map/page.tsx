import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import TripMap from '@/components/map/trip-map';

export default async function MapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

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

  // 验证用户权限
  const { data: member } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    redirect('/dashboard');
  }

  // 获取活动
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', id)
    .order('day_date', { ascending: true })
    .order('order_index', { ascending: true });

  // 转换为地图组件需要的格式
  const activitiesWithLocation = (activities || []).map((activity) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description || undefined,
    day_date: activity.day_date,
    longitude: activity.longitude,
    latitude: activity.latitude,
    location: activity.location || undefined,
    category: activity.category || undefined,
    start_time: activity.start_time || undefined,
    end_time: activity.end_time || undefined,
  }));

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
          <h1 className="text-lg font-semibold">地图视图</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 行程信息 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{trip.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {trip.start_date} ~ {trip.end_date}
          </p>
        </div>

        {/* 地图 */}
        <TripMap
          activities={activitiesWithLocation}
          startDate={trip.start_date}
          endDate={trip.end_date}
          height="calc(100vh - 200px)"
          onActivityClick={(activity) => {
            // 跳转到活动详情
            redirect(`/trips/${id}/activities/${activity.id}`);
          }}
        />

        {/* 提示信息 */}
        {activitiesWithLocation.filter((a) => a.longitude && a.latitude).length === 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">添加地点信息</h3>
                <p className="text-sm text-blue-700 mt-1">
                  在活动详情中添加地点后，即可在地图上查看所有活动的位置。
                </p>
                <Link
                  href={`/trips/${id}/activities/new`}
                  className="inline-block mt-2 text-sm text-blue-800 hover:text-blue-900 font-medium"
                >
                  添加活动 →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href={`/trips/${id}/calendar`} className="flex flex-col items-center py-2 px-3">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">日历</span>
          </Link>
          <Link href={`/trips/${id}/map`} className="flex flex-col items-center py-2 px-3 text-primary-600">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">地图</span>
          </Link>
          <Link href={`/trips/${id}/logs`} className="flex flex-col items-center py-2 px-3">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">记录</span>
          </Link>
          <Link href={`/trips/${id}/gallery`} className="flex flex-col items-center py-2 px-3">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">照片</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
