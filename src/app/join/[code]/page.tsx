'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Users, Loader2, Check, AlertCircle, Cloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { MemberRole } from '@/types/models';

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteType, setInviteType] = useState<'member' | 'companion'>('member');

  useEffect(() => {
    initAndJoin();
  }, [code]);

  const initAndJoin = async () => {
    setLoading(true);
    setError('');

    // 先获取用户信息
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 尝试验证邀请令牌（新系统）
    const { verifyInviteToken } = await import('@/lib/invites');
    const tokenResult = await verifyInviteToken(code);

    let tripId: string | null = null;
    let inviteType: 'member' | 'companion' = 'member';

    if (tokenResult.isValid && tokenResult.tripId) {
      // 使用新的邀请令牌系统
      tripId = tokenResult.tripId;
      const type = tokenResult.inviteType === 'companion' ? 'companion' : 'member';
      setInviteType(type);
      inviteType = type;
    } else {
      // 降级：尝试使用旧的 share_code 系统
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('share_code', code)
        .single();

      if (tripError || !tripData) {
        setError(tokenResult.error || '邀请链接无效或行程不存在');
        setLoading(false);
        return;
      }

      tripId = tripData.id;
      inviteType = 'member'; // 旧系统默认为 member (viewer)
      setInviteType('member');
    }

    // 如果未登录，跳转到登录页并带上邀请码
    if (!user) {
      sessionStorage.setItem('inviteCode', code);
      router.replace(`/login?invite=${code}`);
      return;
    }

    // 已登录，直接加入
    if (tripId) {
      await joinTrip(tripId, user.id, inviteType);
    }
  };

  const joinTrip = async (tripId: string, userId: string, role: 'member' | 'companion') => {
    try {
      // 检查是否已经是成员
      const { data: existingMember } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingMember) {
        // 已是成员，直接跳转
        router.replace(`/trips/${tripId}`);
        return;
      }

      // 确定最终角色：member -> viewer, companion -> companion
      const finalRole: MemberRole = role === 'companion' ? 'companion' : 'viewer';

      // 加入行程
      const { error: joinError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: tripId,
          user_id: userId,
          role: finalRole,
        });

      if (joinError) {
        throw joinError;
      }

      // 如果使用邀请令牌，增加使用计数
      const { useInviteToken } = await import('@/lib/invites');
      await useInviteToken(code);

      setSuccess(true);
      setTimeout(() => {
        router.replace(`/trips/${tripId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || '加入行程失败');
      setLoading(false);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600">正在处理邀请...</p>
      </div>
    );
  }

  // 成功状态
  if (success) {
    const isCompanion = inviteType === 'companion';
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className={`w-20 h-20 ${isCompanion ? 'bg-sky-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isCompanion ? (
              <Cloud className="w-10 h-10 text-sky-600" />
            ) : (
              <Check className="w-10 h-10 text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {isCompanion ? '成为云伴游！' : '加入成功！'}
          </h1>
          <p className="text-gray-600">
            {isCompanion
              ? '可以浏览行程、点赞评论，但无法查看费用信息'
              : '正在跳转到行程...'}
          </p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">邀请无效</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return null;
}
