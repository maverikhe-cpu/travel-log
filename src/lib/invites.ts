import { createClient } from '@/lib/supabase/client';

export type InviteType = 'member' | 'companion';

/**
 * 创建邀请令牌
 */
export async function createInviteToken(
  tripId: string,
  inviteType: InviteType,
  expiresInDays?: number,
  maxUses?: number
): Promise<{ token: string; error?: string }> {
  const supabase = createClient();
  
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { token: '', error: '请先登录' };
  }

  // 生成随机令牌（32字符）
  const token = generateToken();
  
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({
      trip_id: tripId,
      token,
      invite_type: inviteType,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: maxUses || null,
    })
    .select('token')
    .single();

  if (error) {
    // 如果表不存在，提供更友好的错误信息
    if (error.code === 'PGRST205' || error.message?.includes('invite_tokens')) {
      return { 
        token: '', 
        error: '邀请功能需要执行数据库迁移。请在 Supabase Dashboard 的 SQL Editor 中执行迁移文件：supabase/migrations/016_add_invite_tokens.sql' 
      };
    }
    return { token: '', error: error.message };
  }

  return { token: data.token };
}

/**
 * 验证邀请令牌
 */
export async function verifyInviteToken(
  token: string
): Promise<{
  tripId: string | null;
  inviteType: InviteType | null;
  isValid: boolean;
  error?: string;
}> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('verify_invite_token', {
    p_token: token,
  });

  if (error || !data || data.length === 0) {
    return {
      tripId: null,
      inviteType: null,
      isValid: false,
      error: '邀请链接无效',
    };
  }

  const result = data[0];

  if (!result.is_valid) {
    return {
      tripId: result.trip_id,
      inviteType: result.invite_type,
      isValid: false,
      error: result.error_message || '邀请链接无效',
    };
  }

  return {
    tripId: result.trip_id,
    inviteType: result.invite_type,
    isValid: true,
  };
}

/**
 * 使用邀请令牌（增加使用计数）
 */
export async function useInviteToken(token: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('use_invite_token', {
    p_token: token,
  });

  return !error && data === true;
}

/**
 * 生成随机令牌
 */
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * 获取行程的邀请令牌列表
 */
export async function getInviteTokens(tripId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 停用邀请令牌
 */
export async function deactivateInviteToken(tokenId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('invite_tokens')
    .update({ is_active: false })
    .eq('id', tokenId);

  if (error) throw error;
}

