'use client';

import { User } from 'lucide-react';

interface GalleryStatsProps {
  userStats: Record<string, { count: number; user: any }>;
  members: Array<{ user_id: string; profile: any }>;
  currentUserId: string;
  totalCount: number;
  selectedUser?: string;
  onUserChange?: (userId: string | null) => void;
}

export default function GalleryStats({
  userStats,
  members,
  currentUserId,
  totalCount,
  selectedUser,
  onUserChange,
}: GalleryStatsProps) {
  // Calculate max count for progress bars
  const maxCount = Math.max(...Object.values(userStats).map(s => s.count), 1);

  const handleUserClick = (userId: string | null) => {
    if (onUserChange) {
      onUserChange(userId);
    }
  };

  // Sort members by upload count (descending)
  const sortedUsers = Object.entries(userStats)
    .sort(([, a], [, b]) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">成员贡献</span>
        </div>
        <span className="text-sm text-gray-500">共 {totalCount} 张</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* All Members Option */}
        <button
          onClick={() => handleUserClick(null)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            !selectedUser
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">全部</span>
          <span className="text-xs opacity-80">{totalCount}张</span>
        </button>

        {/* Individual Members */}
        {sortedUsers.map(([userId, { count, user }]) => {
          const isSelected = selectedUser === userId;
          const isCurrentUser = userId === currentUserId;
          const displayName = isCurrentUser
            ? '我'
            : user?.full_name || user?.username || '用户';
          const avatarUrl = user?.avatar_url;

          return (
            <button
              key={userId}
              onClick={() => handleUserClick(userId)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs opacity-80">{count}张</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
