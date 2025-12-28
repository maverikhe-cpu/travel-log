import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MapPin, ArrowLeft, Users, Calendar, Navigation, Wallet } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-ink-800 pb-24 md:pb-12">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-white/50 rounded-full transition-colors text-ink-600 hover:text-ink-900 touch-target">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-serif font-bold text-ink-900">{trip.name}</h1>
              <p className="text-xs text-ink-500 hidden sm:block font-sans">
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
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* 行程信息卡片 */}
        <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-6 text-sm text-ink-600 mb-4">
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span>
                  {trip.start_date} 至 {trip.end_date}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4 text-primary-500" />
                <span>{trip.trip_members?.length || 0} 位旅行家</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span>{days.length} 天旅程</span>
              </div>
            </div>
            {trip.description && (
              <p className="text-ink-700 leading-relaxed max-w-2xl">{trip.description}</p>
            )}
          </div>
        </div>

        {/* 日程概览 */}
        <div className="mb-10">
          <h2 className="text-xl font-serif font-bold text-ink-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            日程概览
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {days.map((day, index) => {
              const dateStr = day.toISOString().split('T')[0];
              return (
                <Link
                  key={dateStr}
                  href={`/trips/${id}/calendar?date=${dateStr}`}
                  className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 p-4 hover:border-primary-300 hover:shadow-float hover:-translate-y-0.5 transition-all text-center group cursor-pointer"
                >
                  <div className="text-xs text-ink-400 mb-2 uppercase tracking-wide font-medium">
                    {index === 0 ? '出发' : index === days.length - 1 ? '返程' : `Day ${index + 1}`}
                  </div>
                  <div className="font-serif font-bold text-xl text-ink-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {day.getMonth() + 1}/{day.getDate()}
                  </div>
                  <div className="text-xs text-ink-500">
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day.getDay()]}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href={`/trips/${id}/calendar`} className="group">
            <div className="glass-card rounded-2xl p-6 hover:shadow-float hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Calendar className="w-7 h-7 text-red-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">行程日历</h3>
              <p className="text-sm text-ink-500 leading-relaxed">查看每日活动安排，不错过每一个精彩瞬间</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/map`} className="group">
            <div className="glass-card rounded-2xl p-6 hover:shadow-float hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Navigation className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">地图视图</h3>
              <p className="text-sm text-ink-500 leading-relaxed">在地图上查看所有活动地点，一目了然</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/expenses`} className="group">
            <div className="glass-card rounded-2xl p-6 hover:shadow-float hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Wallet className="w-7 h-7 text-emerald-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">费用账本</h3>
              <p className="text-sm text-ink-500 leading-relaxed">记录每一笔花销，自动计算分摊结余</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/logs`} className="group">
            <div className="glass-card rounded-2xl p-6 hover:shadow-float hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <MapPin className="w-7 h-7 text-green-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">旅行记录</h3>
              <p className="text-sm text-ink-500 leading-relaxed">用文字记录心情，珍藏旅途中的点点滴滴</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/gallery`} className="group">
            <div className="glass-card rounded-2xl p-6 hover:shadow-float hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Users className="w-7 h-7 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">照片库</h3>
              <p className="text-sm text-ink-500 leading-relaxed">创建共享相册，留住大家共同的美好回忆</p>
            </div>
          </Link>

          <Link href={`/trips/${id}/members`} className="group">
            <div className="glass-card rounded-2xl p-6 hover:shadow-float hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Users className="w-7 h-7 text-purple-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">成员管理</h3>
              <p className="text-sm text-ink-500 leading-relaxed">邀请好友加入，管理团队成员权限</p>
            </div>
          </Link>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-nav rounded-2xl shadow-float flex justify-around items-center px-2 z-40 border border-white/50">
        <div className="flex justify-around w-full">
          <Link href={`/trips/${id}/calendar`} className="flex flex-col items-center p-2 text-ink-500 hover:text-primary-500 transition-colors">
            <Calendar className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">日历</span>
          </Link>
          <Link href={`/trips/${id}/map`} className="flex flex-col items-center p-2 text-ink-500 hover:text-primary-500 transition-colors">
            <Navigation className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">地图</span>
          </Link>
          <Link href={`/trips/${id}/logs`} className="flex flex-col items-center p-2 text-ink-500 hover:text-primary-500 transition-colors">
            <MapPin className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">记录</span>
          </Link>
          <Link href={`/trips/${id}/gallery`} className="flex flex-col items-center p-2 text-ink-500 hover:text-primary-500 transition-colors">
            <Users className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">照片</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
