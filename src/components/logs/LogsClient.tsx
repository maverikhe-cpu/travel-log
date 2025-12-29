'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDaysRange, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface LogsClientProps {
  tripId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  initialDate: string;
  initialLogs: any[];
}

export default function LogsClient({
  tripId,
  tripName,
  startDate,
  endDate,
  initialDate,
  initialLogs,
}: LogsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);

  const days = getDaysRange(startDate, endDate);

  // 获取当前日期的所有记录
  const currentLogs = logs
    .filter((log) => log.day_date === selectedDate)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 刷新日志数据
  const refreshLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('travel_logs')
        .select('*, profiles(email, username, avatar_url)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const handleDelete = async (logId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const { error } = await supabase
        .from('travel_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      // 刷新数据
      await refreshLogs();
    } catch (err) {
      console.error('Failed to delete log:', err);
      alert('删除失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">旅行记录</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 日期选择器 */}
        <div className="flex overflow-x-auto gap-2 pb-4 -mx-4 px-4">
          {days.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const dayLogs = logs.filter((log) => log.day_date === dateStr);
            const hasLogs = dayLogs.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  flex-shrink-0 w-16 p-2 rounded-lg text-center transition-all relative
                  ${isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                  }
                `}
              >
                <div className="text-xs opacity-80">
                  {day.getMonth() + 1}/{day.getDate()}
                </div>
                {hasLogs && (
                  <div className={`
                    w-1.5 h-1.5 rounded-full mx-auto mt-1
                    ${isSelected ? 'bg-white' : 'bg-primary-500'}
                  `} />
                )}
              </button>
            );
          })}
        </div>

        {/* 当前日期信息 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {formatDate(selectedDate, 'long')}
          </h2>
          <p className="text-sm text-gray-500">
            {currentLogs.length} 条记录
          </p>
        </div>

        {/* 新建记录按钮 */}
        <Link href={`/trips/${tripId}/logs/new?date=${selectedDate}`} className="block mb-6">
          <Button className="w-full" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            新建记录
          </Button>
        </Link>

        {/* 记录列表 */}
        {currentLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              这一天还没有记录
            </h3>
            <p className="text-gray-500 mb-6">
              点击上方按钮创建第一条记录吧
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                {/* 记录头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {log.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {log.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>
                        {log.profiles?.username || log.profiles?.email?.split('@')[0] || '我'}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(log.created_at).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/trips/${tripId}/logs/${log.id}/edit?date=${selectedDate}`}>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors touch-target"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* 内容 */}
                {log.content && (
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {log.content}
                    </p>
                  </div>
                )}

                {/* 图片 */}
                {log.images && log.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {log.images.map((imageUrl: string, index: number) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                        <Image
                          src={imageUrl}
                          alt={`记录图片 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
