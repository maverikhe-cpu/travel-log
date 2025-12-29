'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toggleLike, getLikeCount } from '@/lib/social';
import type { LikeTargetType } from '@/types/models';

interface LikeButtonProps {
  tripId: string;
  targetType: LikeTargetType;
  targetId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  readonly?: boolean;
}

export default function LikeButton({
  tripId,
  targetType,
  targetId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
  showCount = true,
  readonly = false,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // 尺寸样式
  const sizeStyles = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const handleToggle = async () => {
    if (readonly || loading) return;

    setLoading(true);
    try {
      const result = await toggleLike(tripId, targetType, targetId);
      setLiked(result.liked);
      setCount(result.count);
    } catch (error) {
      console.error('Like toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={readonly || loading}
      className={`
        flex items-center gap-1.5 transition-all touch-target
        ${readonly ? 'cursor-default' : 'hover:scale-105 active:scale-95'}
        ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}
        ${loading ? 'opacity-50' : ''}
      `}
      aria-label={liked ? '取消点赞' : '点赞'}
    >
      <Heart
        className={`${sizeStyles[size]} ${liked ? 'fill-current' : ''} ${
          loading ? 'animate-pulse' : ''
        }`}
      />
      {showCount && (
        <span className={`${textSizes[size]} font-medium`}>
          {count > 0 ? count : ''}
        </span>
      )}
    </button>
  );
}
