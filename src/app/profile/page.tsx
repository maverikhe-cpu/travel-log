'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, FileText, Image as ImageIcon, Calendar, User, Mail, Loader2, Plus, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import AvatarUploader from '@/components/profile/avatar-uploader';
import Image from 'next/image';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
}

interface TripStats {
  totalTrips: number;
  createdTrips: number;
  totalLogs: number;
  totalPhotos: number;
}

interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<TripStats>({
    totalTrips: 0,
    createdTrips: 0,
    totalLogs: 0,
    totalPhotos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 获取用户资料
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setUsername(profileData.username || '');
    }

    // 获取参与的行程
    const { data: tripsData } = await supabase
      .from('trips')
      .select(`
        *,
        trip_members!inner(role, user_id)
      `)
      .eq('trip_members.user_id', user.id)
      .order('created_at', { ascending: false });

    if (tripsData) {
      setTrips(tripsData as Trip[]);

      // 统计创建的行程数
      const createdCount = tripsData.filter((t: any) => t.created_by === user.id).length;
      setStats(prev => ({ ...prev, totalTrips: tripsData.length, createdTrips: createdCount }));
    }

    // 获取日志数
    const { count: logsCount } = await supabase
      .from('travel_logs')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id);

    if (logsCount !== null) {
      setStats(prev => ({ ...prev, totalLogs: logsCount }));
    }

    // 获取照片数
    const { count: photosCount } = await supabase
      .from('trip_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (photosCount !== null) {
      setStats(prev => ({ ...prev, totalPhotos: photosCount }));
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username: username || null })
      .eq('id', user.id);

    if (error) {
      alert('保存失败：' + error.message);
    } else {
      setProfile(prev => prev ? { ...prev, username } : null);
      setEditing(false);
    }

    setSaving(false);
  };

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-ink-800 pb-24 md:pb-12">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-nav transition-all duration-300">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <button className="p-2 hover:bg-white/50 rounded-full transition-colors text-ink-600 hover:text-ink-900 touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-serif font-bold text-ink-900">个人中心</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        {/* 个人信息卡片 */}
        <div className="glass-card rounded-3xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* 头像 */}
            <div className="relative group">
              <div className="rounded-full ring-4 ring-white shadow-card">
                <AvatarUploader
                  currentAvatar={profile?.avatar_url ?? null}
                  username={profile?.username || profile?.email?.[0]?.toUpperCase() || '?'}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              </div>
            </div>

            {/* 信息 */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              {editing ? (
                <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入昵称"
                    className="flex-1 px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    maxLength={20}
                  />
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    size="sm"
                    className="rounded-full"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      setUsername(profile?.username || '');
                    }}
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-red-50 hover:text-red-500"
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h2 className="text-2xl font-serif font-bold text-ink-900">
                      {profile?.username || '未设置昵称'}
                    </h2>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 text-ink-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
                      title="编辑昵称"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-ink-500">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile?.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-4 text-center hover:shadow-float transition-all">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-red-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-2xl font-serif font-bold text-ink-900">{stats.totalTrips}</div>
            <div className="text-xs text-ink-500 font-medium mt-1">参与行程</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center hover:shadow-float transition-all">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-2xl font-serif font-bold text-ink-900">{stats.createdTrips}</div>
            <div className="text-xs text-ink-500 font-medium mt-1">创建行程</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center hover:shadow-float transition-all">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-green-500">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-2xl font-serif font-bold text-ink-900">{stats.totalLogs}</div>
            <div className="text-xs text-ink-500 font-medium mt-1">旅行记录</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center hover:shadow-float transition-all">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-orange-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-serif font-bold text-ink-900">{stats.totalPhotos}</div>
            <div className="text-xs text-ink-500 font-medium mt-1">美好瞬间</div>
          </div>
        </div>

        {/* 我的行程 */}
        <div className="mb-8">
          <h3 className="text-xl font-serif font-bold text-ink-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            我的行程
          </h3>
          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="block glass-card rounded-2xl p-4 hover:shadow-float hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-50 rounded-xl flex-shrink-0 overflow-hidden shadow-inner relative">
                      {trip.cover_image_url ? (
                        <img
                          src={trip.cover_image_url}
                          alt={trip.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-primary-300/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-serif font-bold text-ink-900 group-hover:text-primary-600 transition-colors truncate mb-2">
                        {trip.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-ink-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{trip.start_date} ~ {trip.end_date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center border-dashed border-2 border-primary-100/50">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary-300" />
              </div>
              <p className="text-ink-500 mb-6">还没有开始任何旅程</p>
              <Link href="/trips/new" className="inline-block">
                <Button className="rounded-full px-6 shadow-float hover:shadow-lg">创建我的第一个行程</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-nav rounded-2xl shadow-float flex justify-around items-center px-2 z-40 border border-white/50">
        <div className="flex justify-around w-full">
          <Link href="/dashboard" className="flex flex-col items-center p-2 text-ink-500 hover:text-primary-500 transition-colors">
            <MapPin className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">行程</span>
          </Link>
          <Link href="/trips/new" className="flex flex-col items-center p-2 text-ink-500 hover:text-primary-500 transition-colors">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center -mt-6 shadow-lg border-4 border-white/80">
              <Plus className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium mt-1">创建</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-primary-600">
            {profile?.avatar_url ? (
              <div className="relative">
                <Image
                  src={profile.avatar_url}
                  alt="用户"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-primary-100"
                />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            ) : (
              <User className="w-6 h-6" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-medium mt-1">我的</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
