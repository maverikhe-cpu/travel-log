'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Crown, Shield, Eye, Cloud, Loader2, UserPlus, Ban, Check, MoreVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/trip/share-button';
import ShareDialog from '@/components/trip/share-dialog';
import { changeMemberRole, blockCompanion, unblockCompanion, removeMember } from '@/lib/companions';
import type { MemberRole } from '@/types/models';

interface Member {
  id: string;
  user_id: string;
  role: MemberRole;
  is_blocked?: boolean;
  profiles: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    username?: string | null;
  } | null;
}

const ROLE_CONFIG = {
  owner: { label: '漫游长', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' },
  editor: { label: '漫行客', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
  viewer: { label: '查看者', icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100' },
  companion: { label: '云伴游', icon: Cloud, color: 'text-sky-600', bg: 'bg-sky-100' },
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
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

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
    const { data: membersData, error: membersError } = await supabase
      .from('trip_members')
      .select('*, profiles(*)')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });
    
    if (membersError) {
      console.error('获取成员列表失败:', membersError);
    }

    if (membersData) {
      setMembers(membersData as Member[]);

      // 获取当前用户的角色
      const currentMember = membersData.find((m: any) => m.user_id === user.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    }
    setLoading(false);
  };

  // 角色切换处理
  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await changeMemberRole(tripId, memberId.split('_')[0], newRole);
      await fetchData();
      setEditingRole(null);
    } catch (error: any) {
      alert('修改角色失败：' + error.message);
    }
  };

  // 屏蔽云伴游
  const handleToggleBlock = async (memberId: string, userId: string, currentlyBlocked: boolean) => {
    try {
      if (currentlyBlocked) {
        await unblockCompanion(tripId, userId);
      } else {
        if (!confirm('确定要屏蔽这位云伴游吗？屏蔽后将无法点赞和评论。')) return;
        await blockCompanion(tripId, userId);
      }
      await fetchData();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定要移除这位成员吗？')) return;

    setRemoving(memberId);
    try {
      const member = members.find(m => m.id === memberId);
      if (member) {
        await removeMember(tripId, member.user_id);
        await fetchData();
      }
    } catch (error: any) {
      alert('移除失败：' + error.message);
    }
    setRemoving(null);
  };

  // 权限检查
  const canManage = currentUserRole === 'owner' || currentUserRole === 'editor';
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
            const isCompanion = member.role === 'companion';
            const showRoleSelector = editingRole === member.id && canManage && !isCurrentUser && member.role !== 'owner';

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-b-0"
              >
                {/* 头像 */}
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
                  {member.profiles?.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt={member.profiles.full_name || member.profiles.username || '用户'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-semibold">
                      {(member.profiles?.username || member.profiles?.full_name || member.profiles?.email)?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                  {member.is_blocked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <Ban className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {member.profiles?.username || member.profiles?.full_name || '未设置昵称'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(你)</span>
                    )}
                    {member.is_blocked && (
                      <span className="text-xs text-red-500">(已屏蔽)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {member.profiles?.email || member.profiles?.username || '未设置邮箱'}
                  </p>
                </div>

                {/* 角色选择器或角色标签 */}
                {showRoleSelector ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onBlur={() => setEditingRole(null)}
                    autoFocus
                  >
                    <option value="viewer">查看者</option>
                    <option value="companion">云伴游</option>
                    <option value="editor">漫行客</option>
                  </select>
                ) : (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${roleConfig.bg} ${roleConfig.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleConfig.label}</span>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center gap-1">
                  {/* 角色切换按钮 - owner/editor 可用 */}
                  {canManage && !isCurrentUser && member.role !== 'owner' && !(member.is_blocked) && (
                    <button
                      onClick={() => setEditingRole(editingRole === member.id ? null : member.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                      title="修改角色"
                    >
                      {editingRole === member.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732a2.5 2.5 0 013.536 3.536z" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* 屏蔽按钮 - 仅针对云伴游 */}
                  {isCompanion && !isCurrentUser && (
                    <button
                      onClick={() => handleToggleBlock(member.id, member.user_id, member.is_blocked || false)}
                      className={`p-2 rounded-lg transition-colors touch-target ${
                        member.is_blocked
                          ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                          : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                      title={member.is_blocked ? '解除屏蔽' : '屏蔽'}
                    >
                      {member.is_blocked ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                    </button>
                  )}

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
          <p className="text-sm text-blue-800 font-medium mb-2">💡 角色说明</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <span className="font-medium">漫游长</span> - 所有权限，可移除成员</p>
            <p>• <span className="font-medium">漫行客</span> - 可添加/编辑活动，可修改成员角色</p>
            <p>• <span className="font-medium">查看者</span> - 仅查看内容</p>
            <p>• <span className="font-medium">云伴游</span> - 可点赞评论，不可见费用</p>
            <p className="mt-2 text-blue-600">分享邀请码给朋友，他们即可加入此行程。</p>
          </div>
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
