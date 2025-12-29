'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Cloud, Loader2 } from 'lucide-react';

type InviteType = 'member' | 'companion';

interface ShareDialogProps {
  tripId: string;
  shareCode: string;
  tripName: string;
  creatorName: string;
  isOpen: boolean;
  onClose: () => void;
}

const INVITE_TYPE_CONFIG = {
  member: {
    label: '正式成员',
    icon: Users,
    color: 'bg-purple-100 text-purple-700',
    description: '可查看全部内容，参与协作',
  },
  companion: {
    label: '云伴游',
    icon: Cloud,
    color: 'bg-sky-100 text-sky-700',
    description: '可点赞评论，不可见费用',
  },
};

export default function ShareDialog({ tripId, shareCode, tripName, creatorName, isOpen, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [inviteType, setInviteType] = useState<InviteType>('member');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // 生成邀请令牌
  useEffect(() => {
    if (isOpen) {
      generateToken();
    } else {
      // 关闭时重置
      setInviteToken(null);
    }
  }, [isOpen, inviteType, tripId]);

  const generateToken = async () => {
    setLoadingToken(true);
    try {
      const { createInviteToken } = await import('@/lib/invites');
      const result = await createInviteToken(tripId, inviteType, 30); // 30天有效期
      if (result.token) {
        setInviteToken(result.token);
      }
    } catch (error) {
      console.error('生成邀请令牌失败:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  // 生成分享链接（使用令牌）
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = inviteToken 
    ? `${origin}/join/${inviteToken}`
    : `${origin}/join/${shareCode}`; // 降级方案：使用旧的 share_code

  const handleCopy = async () => {
    const config = INVITE_TYPE_CONFIG[inviteType];
    const shareText = inviteToken
      ? `【${creatorName}】邀请你以${config.label}身份加入行程「${tripName}」\n\n${config.description}\n\n邀请链接：${shareUrl}`
      : `【${creatorName}】邀请你以${config.label}身份加入行程「${tripName}」\n\n${config.description}\n\n邀请码：${shareCode}\n链接：${shareUrl}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 pt-16 md:pt-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto my-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">邀请伙伴</h2>
              <p className="text-sm text-gray-500">选择邀请方式并分享给好友</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 邀请类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择邀请身份
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(INVITE_TYPE_CONFIG) as [InviteType, typeof INVITE_TYPE_CONFIG[InviteType]][]).map(([type, config]) => {
              const Icon = config.icon;
              const isSelected = inviteType === type;
              return (
                <button
                  key={type}
                  onClick={() => setInviteType(type as InviteType)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all touch-target
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {INVITE_TYPE_CONFIG[inviteType].description}
            </p>
          </div>

          {/* 邀请码/令牌 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {inviteToken ? '邀请链接' : '邀请码'}
            </label>
            {loadingToken ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : inviteToken ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 break-all">
                {shareUrl}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 text-center">
                <span className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                  {shareCode}
                </span>
              </div>
            )}
          </div>

          {/* 分享链接（如果使用令牌，则只显示一次） */}
          {!inviteToken && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分享链接
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 break-all">
                {shareUrl}
              </div>
            </div>
          )}

          {/* 提示 */}
          <div className={`rounded-lg p-4 ${inviteType === 'companion' ? 'bg-sky-50' : 'bg-purple-50'}`}>
            <p className="text-sm text-gray-700">
              {inviteType === 'companion' ? (
                <>
                  ☁️ <span className="font-medium">云伴游</span> 可以查看行程、点赞评论，但无法查看费用信息
                </>
              ) : (
                <>
                  👥 <span className="font-medium">正式成员</span> 可以查看全部内容，参与行程协作
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors touch-target"
          >
            关闭
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors flex items-center justify-center gap-2 touch-target"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
