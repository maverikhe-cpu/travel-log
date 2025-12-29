'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDaysRange, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { LikeButton, CommentTeaser } from '@/components/social';
import Image from 'next/image';
import type { MemberRole } from '@/types/models';
import { MEMBER_ROLES } from '@/lib/constants';
import { MessageCircle } from 'lucide-react';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<MemberRole | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // 获取当前用户ID和角色信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        // 获取用户在行程中的角色
        const { data: memberData } = await supabase
          .from('trip_members')
          .select('role, is_blocked')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          setUserRole(memberData.role);
          setIsBlocked(memberData.is_blocked || false);
        }
      }
    };
    fetchUserInfo();
  }, [tripId]);

  const days = getDaysRange(startDate, endDate);

  // 过滤日志：云伴游看不到私密日志
  const visibleLogs = logs.filter((log) => {
    // 如果不是云伴游，可以看到所有日志
    if (userRole !== 'companion') return true;
    // 云伴游只能看公开日志
    return !log.is_private;
  });

  // 获取当前日期的所有记录
  const currentLogs = visibleLogs
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

  // 切换评论区展开状态
  const toggleComments = (logId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // 检查用户是否可以互动（未屏蔽的成员或云伴游）
  const canInteract = currentUserId && !isBlocked;

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
                  {/* 只有日志创建者可以编辑和删除 */}
                  {currentUserId === log.created_by && (
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
                  )}
                </div>

                {/* 内容 */}
                {log.content && (
                  <div 
                    className="mb-4 prose-content"
                    style={{
                      wordBreak: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: log.content 
                    }}
                  />
                )}

                {/* 图片 */}
                {log.images && log.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
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

                {/* 互动区域：点赞和评论 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <LikeButton
                      tripId={tripId}
                      targetType="log"
                      targetId={log.id}
                      readonly={!canInteract}
                    />
                    <CommentTeaser
                      count={0} // TODO: 从后端获取实际评论数
                      onOpen={() => toggleComments(log.id)}
                    />
                  </div>
                </div>

                {/* 评论区（展开时显示） */}
                {expandedComments.has(log.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* TODO: 添加评论组件 */}
                    <div className="text-sm text-gray-400 text-center py-4">
                      评论区功能开发中...
                    </div>
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
