import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Plus, User, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 获取用户资料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 获取用户参与的行程
  // 先查询用户参与的行程ID列表
  const { data: userTrips } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id);

  const tripIds = userTrips?.map(t => t.trip_id) || [];

  // 然后查询这些行程及其所有成员
  const { data: trips } = tripIds.length > 0
    ? await supabase
        .from('trips')
        .select(`
          *,
          trip_members(
            role,
            user_id
          )
        `)
        .in('id', tripIds)
        .order('created_at', { ascending: false })
    : { data: null };

  return (
    <div className="min-h-screen bg-background text-ink-800">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white shadow-md transform group-hover:rotate-6 transition-transform">
              <span className="font-serif italic font-bold">W</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold text-ink-900 leading-none">漫行记</span>
              <span className="text-[10px] text-primary-500 font-medium tracking-wider uppercase mt-0.5">WanderLog</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-2 pl-1 pr-3 py-1 hover:bg-white/50 rounded-full transition-all border border-transparent hover:border-white/60">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || '用户'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100/50 rounded-full flex items-center justify-center ring-2 ring-white text-primary-600 font-serif font-bold">
                  {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-ink-700 hidden sm:block">
                {profile?.username || '旅行者'}
              </span>
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="p-2 text-ink-400 hover:text-primary-600 hover:bg-white/50 rounded-full transition-all"
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 mb-2">我的行程</h1>
            <p className="text-ink-500 font-sans">
              整理你的每一个精彩瞬间
            </p>
          </div>
          <Link href="/trips/new">
            <Button size="lg" className="rounded-full shadow-float bg-primary-500 hover:bg-primary-600">
              <Plus className="w-5 h-5 mr-1" />
              创建新旅程
            </Button>
          </Link>
        </div>

        {/* Trips Grid */}
        {trips && trips.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip: any) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group glass-card rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-float transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-secondary-50 relative overflow-hidden">
                  {trip.cover_image_url ? (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <MapPin className="w-24 h-24 text-primary-300" />
                    </div>
                  )}
                  {/* Date Badge */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-ink-600 shadow-sm flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    {trip.start_date}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-serif font-bold text-ink-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {trip.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-ink-500">
                    <span>{trip.days || 3} 天</span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {trip.trip_members?.length || 1} 人
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Add New Card Stub (Visual Cue) */}
            <Link href="/trips/new" className="group border-2 border-dashed border-primary-200/50 rounded-2xl flex flex-col items-center justify-center text-primary-300 hover:text-primary-500 hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-300 aspect-[4/3] sm:aspect-auto">
              <div className="w-16 h-16 rounded-full bg-primary-100/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-serif font-medium">开启下一段旅程</span>
            </Link>
          </div>
        ) : (
          <div className="text-center py-24 glass-card rounded-3xl">
            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <MapPin className="w-12 h-12 text-primary-300" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink-900 mb-3">还没有行程</h2>
            <p className="text-ink-500 mb-8 max-w-sm mx-auto">
              生活不止眼前的苟且，还有诗和远方的田野。去创建一个新的行程吧。
            </p>
            <Link href="/trips/new">
              <Button size="lg" className="rounded-full shadow-lg bg-ink-900 hover:bg-black text-white px-8">
                <Plus className="w-5 h-5 mr-2" />
                创建我的第一个行程
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-nav rounded-2xl shadow-float flex justify-around items-center px-2 z-40 border border-white/50">
        <Link href="/dashboard" className="flex flex-col items-center p-2 text-primary-500">
          <MapPin className="w-6 h-6 fill-current" />
          <span className="text-[10px] font-medium mt-1">行程</span>
        </Link>

        <div className="relative -top-6">
          <Link href="/trips/new" className="w-14 h-14 bg-primary-500 rounded-full shadow-float flex items-center justify-center text-white hover:scale-105 transition-transform">
            <Plus className="w-7 h-7" />
          </Link>
        </div>

        <Link href="/profile" className="flex flex-col items-center p-2 text-ink-400 hover:text-ink-900 transition-colors">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">我的</span>
        </Link>
      </nav>
    </div>
  );
}
