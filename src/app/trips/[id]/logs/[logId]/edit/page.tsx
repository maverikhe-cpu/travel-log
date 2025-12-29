import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TravelLogForm from '@/components/logs/TravelLogForm';

export default async function EditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; logId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const { id: tripId, logId } = await params;
  const { date } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 获取记录信息
  const { data: log } = await supabase
    .from('travel_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (!log) {
    redirect(`/trips/${tripId}/logs`);
  }

  // 检查权限：只有创建者可以编辑
  if (log.created_by !== user.id) {
    redirect(`/trips/${tripId}/logs`);
  }

  const selectedDate = date || log.day_date;

  return (
    <TravelLogForm
      tripId={tripId}
      date={selectedDate}
      initialData={{
        id: log.id,
        title: log.title,
        content: log.content,
        images: log.images || [],
        is_private: log.is_private,
      }}
      mode="edit"
    />
  );
}
