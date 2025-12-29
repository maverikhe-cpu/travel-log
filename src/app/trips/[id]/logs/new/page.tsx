import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TravelLogForm from '@/components/logs/TravelLogForm';

export default async function NewLogPage({
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
    .select('start_date')
    .eq('id', id)
    .single();

  if (!trip) {
    redirect('/dashboard');
  }

  const selectedDate = date || trip.start_date;

  return <TravelLogForm tripId={id} date={selectedDate} mode="create" />;
}
