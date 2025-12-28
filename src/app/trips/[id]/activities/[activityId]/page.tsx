'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Edit, Trash2, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ACTIVITY_CATEGORIES, PRESET_LOCATIONS } from '@/lib/constants';
import type { ActivityCategory } from '@/types/models';
import { formatDate } from '@/lib/utils';
import { MapPin as MapPinIcon, Utensils, Car, Home, Circle } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  attraction: MapPinIcon,
  food: Utensils,
  transport: Car,
  accommodation: Home,
  other: Circle,
};

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const activityId = params.activityId as string;
  const supabase = createClient();

  const [activity, setActivity] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('attraction');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      setError('加载失败');
      return;
    }

    setActivity(data);
    setTitle(data.title);
    setLocation(data.location || '');
    setDescription(data.description || '');
    setCategory(data.category);
    setStartTime(data.start_time || '');
    setEndTime(data.end_time || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          title,
          location: location || null,
          description: description || null,
          category,
          start_time: startTime || null,
          end_time: endTime || null,
        })
        .eq('id', activityId);

      if (error) {
        setError(error.message);
      } else {
        setIsEditing(false);
        fetchActivity();
      }
    } catch {
      setError('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个活动吗？')) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        setError(error.message);
      } else {
        router.push(`/trips/${tripId}/calendar?date=${activity?.day_date}`);
      }
    } catch {
      setError('删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setTitle(preset.name);
    setLocation(preset.city ? `${preset.city} - ${preset.name}` : preset.name);
    if (preset.category) {
      setCategory(preset.category);
    }
  };

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const categoryConfig = ACTIVITY_CATEGORIES[category];
  const Icon = categoryIcons[category];

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">编辑活动</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                活动标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                活动类型
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACTIVITY_CATEGORIES).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key as ActivityCategory)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      category === key
                        ? `${config.bgColor} ${config.color} border-current`
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地点
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始时间
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束时间
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
              >
                取消
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}/calendar?date=${activity.day_date}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">活动详情</h1>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target text-primary-600"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 活动类型和标题 */}
          <div className={`p-6 ${categoryConfig.bgColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${categoryConfig.color}`} />
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryConfig.color} bg-white`}>
                {categoryConfig.label}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{activity.title}</h2>
          </div>

          {/* 详情信息 */}
          <div className="p-6 space-y-4">
            {activity.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">地点</p>
                  <p className="text-gray-900">{activity.location}</p>
                </div>
              </div>
            )}

            {activity.start_time && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">时间</p>
                  <p className="text-gray-900">
                    {activity.start_time}
                    {activity.end_time && ` - ${activity.end_time}`}
                  </p>
                </div>
              </div>
            )}

            {activity.description && (
              <div>
                <p className="text-sm text-gray-500 mb-2">描述</p>
                <p className="text-gray-700">{activity.description}</p>
              </div>
            )}
          </div>

          {/* 删除按钮 */}
          <div className="p-4 border-t border-gray-100">
            <Button
              variant="danger"
              className="w-full"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteLoading ? '删除中...' : '删除活动'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
