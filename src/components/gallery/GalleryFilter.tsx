'use client';

import { useState, useEffect, useRef } from 'react';
import { Filter, X, User, ChevronDown } from 'lucide-react';

interface GalleryFilterProps {
  members: Array<{ user_id: string; profile: any }>;
  userStats: Record<string, { count: number }>;
  currentUserId: string;
  selectedUser?: string;
  onUserChange: (userId: string | null) => void;
}

export default function GalleryFilter({
  members,
  userStats,
  currentUserId,
  selectedUser,
  onUserChange,
}: GalleryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getUserName = (userId: string, profile: any) => {
    if (userId === currentUserId) return '我';
    return profile?.full_name || profile?.username || '用户';
  };

  const getUserAvatar = (profile: any) => {
    return profile?.avatar_url;
  };

  const hasFilter = selectedUser && selectedUser !== 'all';

  return (
    <div className="relative" ref={filterRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          hasFilter
            ? 'bg-primary-500 text-white'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
      >
        <Filter className="w-4 h-4" />
        筛选
        {hasFilter && (
          <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
            1
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[220px] z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">按成员筛选</h3>
            {hasFilter && (
              <button
                onClick={() => onUserChange(null)}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                清空
              </button>
            )}
          </div>

          <div className="space-y-1">
            {/* All Members */}
            <button
              onClick={() => {
                onUserChange(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                !hasFilter
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium">全部成员</span>
            </button>

            {/* Individual Members */}
            {members.map((member) => {
              const userId = member.user_id;
              const profile = member.profile;
              const isSelected = selectedUser === userId;
              const count = userStats[userId]?.count || 0;
              const displayName = getUserName(userId, profile);
              const avatarUrl = getUserAvatar(profile);

              return (
                <button
                  key={userId}
                  onClick={() => {
                    onUserChange(userId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{displayName}</div>
                    <div className="text-xs text-gray-400">{count} 张照片</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
