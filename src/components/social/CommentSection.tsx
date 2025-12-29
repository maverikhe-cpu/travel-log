'use client';

import { useState, useEffect, useTransition } from 'react';
import { MessageCircle, Loader2, Trash2, Edit2, X, ChevronDown } from 'lucide-react';
import { getComments, deleteComment, updateComment, createReport } from '@/lib/social';
import { formatDate } from '@/lib/utils';
import type { Comment, CommentTargetType } from '@/types/models';
import CommentForm from './CommentForm';
import LikeButton from './LikeButton';

interface CommentSectionProps {
  tripId: string;
  targetType: CommentTargetType;
  targetId: string;
  currentUserId?: string;
}

export default function CommentSection({
  tripId,
  targetType,
  targetId,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(tripId, targetType, targetId, currentUserId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [tripId, targetType, targetId, currentUserId]);

  const handleCommentSuccess = (newComment: Comment) => {
    setComments((prev) => [...prev, newComment]);
    setShowForm(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const updated = await updateComment(commentId, editContent);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c))
      );
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleReport = async (commentId: string) => {
    const reason = prompt('请输入举报原因（可选）：');
    if (reason === null) return; // 用户取消

    try {
      await createReport(tripId, 'comment', commentId, reason || undefined);
      alert('举报已提交，感谢您的反馈');
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('举报提交失败，请稍后重试');
    }
  };

  return (
    <div className="space-y-4">
      {/* 评论列表 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">评论</span>
          {comments.length > 0 && (
            <span className="text-sm text-gray-400">({comments.length})</span>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium touch-target py-2"
          >
            写评论
          </button>
        )}
      </div>

      {/* 评论表单 */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4">
          <CommentForm
            tripId={tripId}
            targetType={targetType}
            targetId={targetId}
            onSuccess={handleCommentSuccess}
            placeholder="写下你的评论..."
            autoFocus
          />
          <button
            onClick={() => setShowForm(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            取消
          </button>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          还没有评论，来抢沙发吧~
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-lg border border-gray-100 p-4"
            >
              <div className="flex gap-3">
                {/* 头像 */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {comment.profile?.username?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* 内容区 */}
                <div className="flex-1 min-w-0">
                  {/* 用户名和时间 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.profile?.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.created_at, 'long')}
                    </span>
                  </div>

                  {/* 编辑模式 */}
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 评论内容 */}
                      <p className="text-gray-700 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>

                      {/* 操作栏 */}
                      <div className="flex items-center gap-4 mt-2">
                        <LikeButton
                          tripId={tripId}
                          targetType="comment"
                          targetId={comment.id}
                          initialLiked={comment.is_liked}
                          initialCount={comment.like_count}
                          size="sm"
                        />

                        {currentUserId && (
                          <div className="flex items-center gap-2 ml-auto">
                            {comment.user_id === currentUserId ? (
                              <>
                                <button
                                  onClick={() => handleEdit(comment)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded touch-target"
                                  title="编辑"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(comment.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded touch-target"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleReport(comment.id)}
                                className="p-1.5 text-gray-400 hover:text-orange-500 rounded touch-target text-xs"
                                title="举报"
                              >
                                举报
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 精简版评论组件（用于卡片内展示）
interface CommentTeaserProps {
  count: number;
  onOpen: () => void;
}

export function CommentTeaser({ count, onOpen }: CommentTeaserProps) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors touch-target py-2"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm">{count > 0 ? count : '评论'}</span>
    </button>
  );
}
