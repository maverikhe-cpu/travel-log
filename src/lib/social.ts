'use client';

import { createClient } from '@/lib/supabase/client';
import type { Comment, Like, Report, CommentTargetType, LikeTargetType, ReportStatus } from '@/types/models';

// ============================================
// 评论服务
// ============================================

/**
 * 获取评论列表
 */
export async function getComments(
  tripId: string,
  targetType: CommentTargetType,
  targetId: string,
  currentUserId?: string
): Promise<Comment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      profile:profiles(id, username, avatar_url)
      `
    )
    .eq('trip_id', tripId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // 如果有当前用户，获取点赞状态
  let comments = data || [];
  if (currentUserId && comments.length > 0) {
    const commentIds = comments.map((c) => c.id);
    const { data: likeData } = await supabase
      .from('likes')
      .select('target_id')
      .eq('user_id', currentUserId)
      .eq('target_type', 'comment')
      .in('target_id', commentIds);

    const likedCommentIds = new Set(likeData?.map((l) => l.target_id) || []);

    // 获取每条评论的点赞数
    const { data: countData } = await supabase
      .from('likes')
      .select('target_id')
      .eq('target_type', 'comment')
      .in('target_id', commentIds);

    const likeCounts: Record<string, number> = {};
    countData?.forEach((l) => {
      likeCounts[l.target_id] = (likeCounts[l.target_id] || 0) + 1;
    });

    comments = comments.map((comment) => ({
      ...comment,
      is_liked: likedCommentIds.has(comment.id),
      like_count: likeCounts[comment.id] || 0,
    }));
  }

  return comments;
}

/**
 * 创建评论
 */
export async function createComment(
  tripId: string,
  targetType: CommentTargetType,
  targetId: string,
  content: string
): Promise<Comment> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('请先登录');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      trip_id: tripId,
      target_type: targetType,
      target_id: targetId,
      content: content.trim(),
      user_id: user.id,
    })
    .select(
      `
      *,
      profile:profiles(id, username, avatar_url)
      `
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * 更新评论
 */
export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(
      `
      *,
      profile:profiles(id, username, avatar_url)
      `
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * 删除评论
 */
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('comments').delete().eq('id', commentId);

  if (error) throw error;
}

// ============================================
// 点赞服务
// ============================================

/**
 * 切换点赞状态
 */
export async function toggleLike(
  tripId: string,
  targetType: LikeTargetType,
  targetId: string
): Promise<{ liked: boolean; count: number }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('请先登录');

  // 检查是否已点赞
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle();

  if (existing) {
    // 取消点赞
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    // 获取新的点赞数
    const { count } = await getLikeCount(targetType, targetId);
    return { liked: false, count: count || 0 };
  } else {
    // 添加点赞
    await supabase.from('likes').insert({
      trip_id: tripId,
      target_type: targetType,
      target_id: targetId,
      user_id: user.id,
    });

    // 获取新的点赞数
    const { count } = await getLikeCount(targetType, targetId);
    return { liked: true, count: count || 0 };
  }
}

/**
 * 获取点赞数
 */
export async function getLikeCount(
  targetType: LikeTargetType,
  targetId: string
): Promise<{ count: number | null }> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  if (error) return { count: 0 };
  return { count };
}

/**
 * 批量获取点赞状态
 */
export async function getLikeStatus(
  targetType: LikeTargetType,
  targetIds: string[],
  userId: string
): Promise<Record<string, boolean>> {
  const supabase = createClient();

  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .in('target_id', targetIds);

  const status: Record<string, boolean> = {};
  targetIds.forEach((id) => {
    status[id] = false;
  });
  data?.forEach((like) => {
    status[like.target_id] = true;
  });

  return status;
}

/**
 * 批量获取点赞数
 */
export async function getLikeCounts(
  targetType: LikeTargetType,
  targetIds: string[]
): Promise<Record<string, number>> {
  const supabase = createClient();

  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .eq('target_type', targetType)
    .in('target_id', targetIds);

  const counts: Record<string, number> = {};
  targetIds.forEach((id) => {
    counts[id] = 0;
  });
  data?.forEach((like) => {
    counts[like.target_id] = (counts[like.target_id] || 0) + 1;
  });

  return counts;
}

// ============================================
// 举报服务
// ============================================

/**
 * 创建举报
 */
export async function createReport(
  tripId: string,
  targetType: 'comment',
  targetId: string,
  reason?: string
): Promise<Report> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('请先登录');

  const { data, error } = await supabase
    .from('reports')
    .insert({
      trip_id: tripId,
      target_type: targetType,
      target_id: targetId,
      reason,
      reporter_id: user.id,
    })
    .select(
      `
      *,
      reporter_profile:profiles(id, username, avatar_url)
      `
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * 获取行程的举报列表（仅 owner/editor）
 */
export async function getReports(tripId: string): Promise<Report[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      reporter_profile:profiles(id, username, avatar_url),
      reviewer_profile:profiles(id, username, avatar_url)
      `
    )
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 更新举报状态（仅 owner/editor）
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<Report> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('请先登录');

  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select(
      `
      *,
      reporter_profile:profiles(id, username, avatar_url),
      reviewer_profile:profiles(id, username, avatar_url)
      `
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * 删除举报（仅 owner/editor）
 */
export async function deleteReport(reportId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('reports').delete().eq('id', reportId);

  if (error) throw error;
}
