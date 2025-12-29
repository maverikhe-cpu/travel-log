'use client';

import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { createReport } from '@/lib/social';

interface ReportButtonProps {
  tripId: string;
  targetType: 'comment';
  targetId: string;
  onSuccess?: () => void;
  variant?: 'icon' | 'text' | 'both';
}

export default function ReportButton({
  tripId,
  targetType,
  targetId,
  onSuccess,
  variant = 'icon',
}: ReportButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createReport(tripId, targetType, targetId, reason || undefined);
      setShowReasonInput(false);
      setReason('');
      onSuccess?.();
      // 可以显示成功提示
    } catch (error) {
      console.error('Report submission error:', error);
      alert('举报提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowReasonInput(false);
    setReason('');
  };

  if (showReasonInput) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-sm text-orange-800 mb-2">请输入举报原因（可选）</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="例如：不当内容、垃圾信息..."
          rows={2}
          maxLength={500}
          className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交举报'}
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowReasonInput(true)}
      className="inline-flex items-center gap-1.5 text-gray-400 hover:text-orange-500 transition-colors touch-target py-2"
      title="举报"
    >
      {variant === 'icon' || variant === 'both' ? (
        <Flag className="w-4 h-4" />
      ) : null}
      {variant === 'text' || variant === 'both' ? (
        <span className="text-sm">举报</span>
      ) : null}
    </button>
  );
}

// 举报状态徽章（用于管理员）
interface ReportStatusBadgeProps {
  status: 'pending' | 'resolved' | 'dismissed';
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const statusConfig = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
    resolved: { label: '已处理', color: 'bg-green-100 text-green-700', icon: Flag },
    dismissed: { label: '已驳回', color: 'bg-gray-100 text-gray-700', icon: Flag },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
