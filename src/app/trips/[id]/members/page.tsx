'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Crown, Shield, Eye, Loader2, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/trip/share-button';
import ShareDialog from '@/components/trip/share-dialog';

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ROLE_CONFIG = {
  owner: { label: '创建者', icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  editor: { label: '编辑者', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
  viewer: { label: '查看者', icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function MembersPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const supabase = createClient();

  const [trip, setTrip] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // 获取行程信息
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (!tripData) {
      router.push('/dashboard');
      return;
    }
    setTrip(tripData);

    // 获取成员列表
    const { data: membersData } = await supabase
      .from('trip_members')
      .select('*, profiles(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (membersData) {
      setMembers(membersData as Member[]);
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定要移除这位成员吗？')) return;

    setRemoving(memberId);
    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert('移除失败：' + error.message);
    } else {
      fetchData();
    }
    setRemoving(null);
  };

  const isOwner = trip?.created_by === currentUserId;

  // 找到创建者名称
  const creatorMember = members.find(m => m.user_id === trip?.created_by);
  const creatorName = creatorMember?.profiles?.full_name || creatorMember?.profiles?.email?.split('@')[0] || '朋友';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">成员管理</h1>
          <ShareButton tripId={tripId} shareCode={trip?.share_code} tripName={trip?.name || ''} creatorName={creatorName} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 行程信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <h2 className="font-semibold text-gray-900">{trip?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {members.length} 位成员 · {trip?.start_date} 至 {trip?.end_date}
          </p>
        </div>

        {/* 邀请入口 */}
        {isOwner && (
          <button
            onClick={() => setShareDialogOpen(true)}
            className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 p-4 flex items-center justify-center gap-2 text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors mb-6 touch-target"
          >
            <UserPlus className="w-5 h-5" />
            <span>邀请新成员</span>
          </button>
        )}

        {/* 成员列表 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {members.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role];
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = member.user_id === currentUserId;

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-b-0"
              >
                {/* 头像 */}
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {member.profiles.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt={member.profiles.full_name || '用户'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-semibold">
                      {member.profiles.full_name?.[0] || member.profiles.email[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {member.profiles.full_name || '未设置昵称'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(你)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.profiles.email}</p>
                </div>

                {/* 角色标签 */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${roleConfig.bg} ${roleConfig.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleConfig.label}</span>
                </div>

                {/* 删除按钮 */}
                {isOwner && !isCurrentUser && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removing === member.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                  >
                    {removing === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>还没有成员</p>
              <p className="text-sm mt-1">邀请朋友一起加入吧</p>
            </div>
          )}
        </div>

        {/* 提示 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            💡 只有创建者可以移除成员。分享邀请码给朋友，他们即可加入此行程。
          </p>
        </div>
      </main>

      {/* 分享弹窗 */}
      {trip && (
        <ShareDialog
          tripId={tripId}
          shareCode={trip.share_code}
          tripName={trip.name}
          creatorName={creatorName}
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
        />
      )}
    </div>
  );
}
