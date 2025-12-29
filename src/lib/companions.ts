'use client';

import { createClient } from '@/lib/supabase/client';
import type { MemberRole } from '@/types/models';

// ============================================
// 云伴游/成员管理服务
// ============================================

/**
 * 修改成员角色
 */
export async function changeMemberRole(
  tripId: string,
  userId: string,
  newRole: MemberRole
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trip_members')
    .update({ role: newRole })
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * 屏蔽云伴游（禁止点赞/评论）
 */
export async function blockCompanion(tripId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trip_members')
    .update({ is_blocked: true })
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * 解除屏蔽云伴游
 */
export async function unblockCompanion(tripId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trip_members')
    .update({ is_blocked: false })
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * 移除成员（包括云伴游）
 */
export async function removeMember(tripId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * 获取行程成员列表
 */
export async function getTripMembers(tripId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trip_members')
    .select(
      `
      *,
      profile:profiles(id, username, avatar_url)
      `
    )
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * 获取当前用户在行程中的角色
 */
export async function getCurrentUserRole(tripId: string): Promise<MemberRole | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('trip_members')
    .select('role, is_blocked')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return null;
  return data?.role || null;
}

/**
 * 检查当前用户是否被屏蔽
 */
export async function isCurrentUserBlocked(tripId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('trip_members')
    .select('is_blocked')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return false;
  return data?.is_blocked || false;
}
