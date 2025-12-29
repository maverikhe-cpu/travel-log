import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TripDetailClient from '@/components/trip/TripDetailClient';

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

  return <TripDetailClient trip={trip} userId={user.id} />;
}
