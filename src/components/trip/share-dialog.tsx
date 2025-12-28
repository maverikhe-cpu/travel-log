'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Users } from 'lucide-react';

interface ShareDialogProps {
  tripId: string;
  shareCode: string;
  tripName: string;
  creatorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({ tripId, shareCode, tripName, creatorName, isOpen, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  // 生成分享链接
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${shareCode}`
    : '';

  const handleCopy = async () => {
    const shareText = `【${creatorName}】邀请你加入行程「${tripName}」\n\n邀请码：${shareCode}\n链接：${shareUrl}`;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">邀请成员</h2>
              <p className="text-sm text-gray-500">分享邀请码让伙伴加入行程</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 邀请码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邀请码
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 text-center">
              <span className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                {shareCode}
              </span>
            </div>
          </div>

          {/* 分享链接 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分享链接
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 break-all">
              {shareUrl}
            </div>
          </div>

          {/* 提示 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 点击下方复制按钮，即可同时复制邀请码和链接，发送给朋友即可加入。
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
