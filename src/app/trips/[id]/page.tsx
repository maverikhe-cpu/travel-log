import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MapPin, ArrowLeft, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDaysRange } from '@/lib/utils';
import ShareButton from '@/components/trip/share-button';

export default async function TripDetailPage({
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
    .select(`
      *,
      trip_members(
        role,
        user_id,
        profiles(*)
      )
    `)
    .eq('id', id)
    .single();

  if (!trip) {
    redirect('/dashboard');
  }

  // 检查用户是否有权限访问
  const isMember = trip.trip_members?.some((m: any) => m.user_id === user.id);
  if (!isMember) {
    redirect('/dashboard');
  }

  const currentUserMember = trip.trip_members?.find((m: any) => m.user_id === user.id);
  const userRole = currentUserMember?.role || 'viewer';

  // 找到创建者（从成员列表中查找）
  const creatorMember = trip.trip_members?.find((m: any) => m.user_id === trip.created_by);
  const creatorName = creatorMember?.profiles?.full_name || creatorMember?.profiles?.email?.split('@')[0] || '朋友';

  // 获取日期范围
  const days = getDaysRange(trip.start_date, trip.end_date);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">{trip.name}</h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {trip.start_date} ~ {trip.end_date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton tripId={id} shareCode={trip.share_code} tripName={trip.name} creatorName={creatorName} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 行程信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              <span>
                {trip.start_date} 至 {trip.end_date}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span>{trip.trip_members?.length || 0} 位成员</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span>{days.length} 天行程</span>
            </div>
          </div>
          {trip.description && (
            <p className="mt-4 text-gray-700">{trip.description}</p>
          )}
        </div>

        {/* 日程概览 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">日程概览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {days.map((day, index) => {
              const dateStr = day.toISOString().split('T')[0];
              return (
                <Link
                  key={dateStr}
                  href={`/trips/${id}/calendar?date=${dateStr}`}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary-500 hover:shadow-sm transition-all text-center"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {index === 0 ? '出发' : index === days.length - 1 ? '返程' : `第${index + 1}天`}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {day.getMonth() + 1}/{day.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href={`/trips/${id}/calendar`} className="group">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">行程日历</h3>
              <p className="text-sm text-gray-500">查看每日活动安排</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/logs`} className="group">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">旅行记录</h3>
              <p className="text-sm text-gray-500">记录每日旅行笔记</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/gallery`} className="group">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">照片库</h3>
              <p className="text-sm text-gray-500">查看和上传旅行照片</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/members`} className="group">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">成员管理</h3>
              <p className="text-sm text-gray-500">管理行程成员</p>
            </div>
          </Link>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href={`/trips/${id}/calendar`} className="flex flex-col items-center py-2 px-3">
            <Calendar className="w-5 h-5" />
            <span className="text-xs mt-1">日历</span>
          </Link>
          <Link href={`/trips/${id}/logs`} className="flex flex-col items-center py-2 px-3">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">记录</span>
          </Link>
          <Link href={`/trips/${id}/gallery`} className="flex flex-col items-center py-2 px-3">
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">照片</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
