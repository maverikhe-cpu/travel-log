'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, FileText, Image as ImageIcon, Calendar, User, Mail, Loader2, Plus } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">个人中心</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 个人信息卡片 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* 头像 */}
            <AvatarUploader
              currentAvatar={profile?.avatar_url ?? null}
              username={profile?.username || profile?.email?.[0]?.toUpperCase() || '?'}
              onAvatarUpdate={handleAvatarUpdate}
            />

            {/* 信息 */}
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入昵称"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={20}
                  />
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    size="sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      setUsername(profile?.username || '');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile?.username || '未设置昵称'}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-500 mt-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    编辑昵称
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTrips}</div>
            <div className="text-xs text-gray-500">参与行程</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.createdTrips}</div>
            <div className="text-xs text-gray-500">创建行程</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalLogs}</div>
            <div className="text-xs text-gray-500">旅行记录</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <ImageIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</div>
            <div className="text-xs text-gray-500">上传照片</div>
          </div>
        </div>

        {/* 我的行程 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">我的行程</h3>
          {trips.length > 0 ? (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {trip.cover_image_url ? (
                        <img
                          src={trip.cover_image_url}
                          alt={trip.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-primary-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{trip.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {trip.start_date} ~ {trip.end_date}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">还没有参与任何行程</p>
              <Link href="/trips/new" className="inline-block mt-4">
                <Button size="sm">创建行程</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/dashboard" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span className="text-xs mt-1">行程</span>
          </Link>
          <Link href="/trips/new" className="flex flex-col items-center py-2 px-3 text-gray-600">
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1">创建</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center py-2 px-3 text-primary-600">
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
