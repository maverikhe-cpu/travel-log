'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Trash2 } from 'lucide-react';

export interface Photo {
  id: string;
  public_url: string;
  thumbnail_url?: string;
  caption?: string;
  day_date: string;
  user_id: string;
  created_at: string;
  original_filename?: string;
  storage_path?: string;
  profile?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface PhotoCardProps {
  photo: Photo;
  currentUserId: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: (photoId: string) => void;
  priority?: boolean; // For LCP optimization
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getUserName(profile: Photo['profile'], userId: string, currentUserId: string): string {
  if (userId === currentUserId) return '我';
  return profile?.full_name || profile?.username || '用户';
}

function getUserAvatar(profile: Photo['profile']): string | null {
  return profile?.avatar_url || null;
}

export default function PhotoCard({ photo, currentUserId, isSelected, onSelect, onDelete, priority = false }: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = photo.user_id === currentUserId;
  const userName = getUserName(photo.profile, photo.user_id, currentUserId);
  const userAvatar = getUserAvatar(photo.profile);

  // Calculate relative time on client side only to avoid hydration mismatch
  useEffect(() => {
    setRelativeTime(formatRelativeTime(photo.created_at));
    // Update every minute for recent photos
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(photo.created_at));
    }, 60000);
    return () => clearInterval(interval);
  }, [photo.created_at]);

  return (
    <div
      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer ${
        isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
      }`}
      onClick={onSelect}
    >
      <Image
        src={imageError ? photo.public_url : (photo.thumbnail_url || photo.public_url)}
        alt={photo.caption || '旅行照片'}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImageError(true)}
      />

      {/* Delete Button (only for owner) */}
      {isOwner && onDelete && !showDeleteConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          title="删除照片"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-3 mx-2 shadow-xl">
            <p className="text-sm text-gray-800 mb-2 text-center">确认删除?</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(photo.id);
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 rounded text-white"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-8 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-white text-xs truncate">{photo.caption}</p>
        </div>
      )}

      {/* Uploader Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-2 py-1.5 flex items-center gap-2">
        {userAvatar && !avatarError ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-gray-400" />
          </div>
        )}
        <span className="text-xs text-gray-600 truncate flex-1">{userName}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{relativeTime}</span>
      </div>
    </div>
  );
}
