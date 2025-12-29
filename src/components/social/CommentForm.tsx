'use client';

import { useState, FormEvent } from 'react';
import { Loader2, Send } from 'lucide-react';
import { createComment } from '@/lib/social';
import type { CommentTargetType } from '@/types/models';

interface CommentFormProps {
  tripId: string;
  targetType: CommentTargetType;
  targetId: string;
  onSuccess?: (comment: any) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_LENGTH = 1000;

export default function CommentForm({
  tripId,
  targetType,
  targetId,
  onSuccess,
  placeholder = '写下你的评论...',
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const comment = await createComment(tripId, targetType, targetId, trimmed);
      setContent('');
      onSuccess?.(comment);
    } catch (error: any) {
      console.error('Comment creation error:', error);
      // 可以在这里显示错误提示
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_LENGTH - content.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={MAX_LENGTH}
          disabled={submitting}
          rows={3}
          className={`
            w-full px-4 py-3 border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            resize-none placeholder-gray-400
            ${submitting ? 'opacity-50 bg-gray-50' : ''}
          `}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {remaining} 字符
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            font-medium transition-all touch-target
            ${content.trim() && !submitting
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
            ${submitting ? 'opacity-75' : ''}
          `}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              发布中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              发布
            </>
          )}
        </button>
      </div>
    </form>
  );
}
