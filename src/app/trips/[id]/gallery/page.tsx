import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDaysRange } from '@/lib/utils';
import GalleryClient from '@/components/gallery/GalleryClient';

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; user?: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { date, user: userFilter } = await searchParams;

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

  // 获取图片（包含上传者信息）
  const imagesQuery = supabase
    .from('trip_images')
    .select(`
      *,
      profile:profiles(username, avatar_url)
    `)
    .eq('trip_id', id);

  // 如果有用户筛选，添加过滤条件
  if (userFilter && userFilter !== 'all') {
    imagesQuery.eq('user_id', userFilter);
  }

  const { data: images, error } = await imagesQuery.order('created_at', { ascending: false });


  // 按日期分组图片
  const imagesByDate: Record<string, any[]> = {};
  images?.forEach((img) => {
    if (!imagesByDate[img.day_date]) {
      imagesByDate[img.day_date] = [];
    }
    imagesByDate[img.day_date].push(img);
  });


  // 计算每个用户的上传统计
  const userStats: Record<string, { count: number; user: any }> = {};
  images?.forEach((img) => {
    if (!userStats[img.user_id]) {
      userStats[img.user_id] = {
        count: 0,
        user: img.profile,
      };
    }
    userStats[img.user_id].count++;
  });

  // 获取行程成员
  const { data: members } = await supabase
    .from('trip_members')
    .select(`
      user_id,
      profile:profiles(username, avatar_url)
    `)
    .eq('trip_id', id);

  // 获取日期范围
  const days = getDaysRange(trip.start_date, trip.end_date);

  return (
    <GalleryClient
      trip={trip}
      tripId={id}
      images={images || []}
      imagesByDate={imagesByDate}
      userStats={userStats}
      members={members || []}
      days={days}
      currentUserId={user.id}
      initialDate={date}
      initialUserFilter={userFilter}
    />
  );
}
