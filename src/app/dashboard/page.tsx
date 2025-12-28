import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Plus, User, Calendar } from 'lucide-react';
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
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      trip_members!inner(
        role,
        user_id
      )
    `)
    .eq('trip_members.user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-primary-500" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">漫行记</span>
              <span className="text-xs text-gray-500 -mt-0.5">WanderLog</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 pr-3 transition-colors">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || '用户'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-gray-700 hidden sm:block">
                {profile?.username || '用户'}
              </span>
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                退出
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">我的行程</h1>
            <p className="text-gray-600 mt-1">管理和查看你的旅行计划</p>
          </div>
          <Link href="/trips/new">
            <Button size="lg">
              <Plus className="w-5 h-5" />
              创建行程
            </Button>
          </Link>
        </div>

        {/* Trips Grid */}
        {trips && trips.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: any) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="aspect-video bg-gradient-to-br from-red-100 to-orange-100 relative">
                  {trip.cover_image_url ? (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {trip.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {trip.start_date} ~ {trip.end_date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">还没有行程</h2>
            <p className="text-gray-600 mb-6">创建你的第一个旅行计划吧</p>
            <Link href="/trips/new">
              <Button size="lg">
                <Plus className="w-5 h-5" />
                创建行程
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/dashboard" className="flex flex-col items-center py-2 px-3 text-primary-600">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">行程</span>
          </Link>
          <Link href="/trips/new" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1">创建</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center py-2 px-3 text-gray-600">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="用户"
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-xs mt-1">我的</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
