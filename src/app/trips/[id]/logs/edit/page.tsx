'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/editor/rich-text-editor';

export default function LogEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tripId = params.id as string;
  const date = searchParams.get('date') || '';
  const supabase = createClient();

  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLog();
  }, [date, tripId]);

  const fetchLog = async () => {
    if (!date) return;

    setInitialLoading(true);
    const { data, error } = await supabase
      .from('travel_logs')
      .select('*')
      .eq('trip_id', tripId)
      .eq('day_date', date)
      .maybeSingle();

    if (data) {
      setContent(data.content || '');
      setIsPrivate(data.is_private || false);
      setLogId(data.id);
    }
    setInitialLoading(false);
  };

  const handleSave = async () => {
    if (!date) return;

    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      if (logId) {
        // 更新现有记录
        const { error } = await supabase
          .from('travel_logs')
          .update({
            content,
            is_private: isPrivate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logId);

        if (error) throw error;
      } else {
        // 创建新记录
        const { data, error } = await supabase
          .from('travel_logs')
          .insert({
            trip_id: tripId,
            day_date: date,
            content,
            is_private: isPrivate,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setLogId(data.id);
      }

      setHasUnsavedChanges(false);
      router.push(`/trips/${tripId}/logs?date=${date}`);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('有未保存的更改，确定要离开吗？')) {
        return;
      }
    }
    router.push(`/trips/${tripId}/logs?date=${date}`);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">编辑旅行记录</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 日期显示 */}
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-sm text-gray-500">日期</span>
              <span className="font-medium">{date}</span>
            </div>

            {/* 隐私设置 */}
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors touch-target
                ${isPrivate
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-green-100 text-green-700'
                }
              `}
            >
              {isPrivate ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>私密</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>公开</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isPrivate
              ? '只有你自己可以看到这条记录'
              : '所有旅行成员都可以看到这条记录'
            }
          </p>
        </div>

        {/* 编辑器 */}
        <div className="mb-6">
          <RichTextEditor
            key={`${date}-${logId || 'new'}`}
            initialContent={content}
            onChange={handleContentChange}
            placeholder="记录下今天的旅行经历、见闻和感受..."
            minHeight="300px"
          />
        </div>

        {/* 提示信息 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">编辑技巧</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 选中文本后点击工具栏按钮添加格式</li>
            <li>• 支持加粗、斜体、列表、链接等格式</li>
            <li>• 随时点击保存按钮保存更改</li>
          </ul>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
          >
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
