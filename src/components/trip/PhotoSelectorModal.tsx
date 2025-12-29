'use client';

import { useState, useEffect } from 'react';
import { X, Check, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

interface Photo {
  id: string;
  public_url: string;
  day_date: string;
  caption?: string;
}

interface PhotoSelectorModalProps {
  tripId: string;
  onClose: () => void;
  onSelect: (photoUrl: string) => void;
}

export default function PhotoSelectorModal({
  tripId,
  onClose,
  onSelect,
}: PhotoSelectorModalProps) {
  const supabase = createClient();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [photosByDate, setPhotosByDate] = useState<Record<string, Photo[]>>({});
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('trip_images')
          .select('id, public_url, day_date, caption')
          .eq('trip_id', tripId)
          .order('day_date', { ascending: false });

        if (error) throw error;

        const photoList = data || [];

        // 按日期分组
        const grouped: Record<string, Photo[]> = {};
        photoList.forEach((photo) => {
          if (!grouped[photo.day_date]) {
            grouped[photo.day_date] = [];
          }
          grouped[photo.day_date].push(photo);
        });

        setPhotos(photoList);
        setPhotosByDate(grouped);
        setDates(Object.keys(grouped).sort((a, b) => b.localeCompare(a)));
      } catch (err) {
        console.error('Failed to fetch photos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [tripId, supabase]);

  const handleSelectPhoto = () => {
    if (selectedPhotoId) {
      const photo = photos.find((p) => p.id === selectedPhotoId);
      if (photo) {
        onSelect(photo.public_url);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">从照片库选择封面</h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {photos.length} 张照片
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <span className="ml-3 text-gray-600">加载照片中...</span>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">照片库为空</h3>
              <p className="text-gray-500 mb-6">先上传一些照片，再回来选择封面吧</p>
            </div>
          ) : (
            <div className="space-y-8">
              {dates.map((date) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">
                      {formatDate(date, 'long')}
                    </h3>
                    <span className="text-xs text-gray-400">
                      ({photosByDate[date].length} 张)
                    </span>
                  </div>

                  {/* Photos Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {photosByDate[date].map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhotoId(photo.id)}
                        className={`
                          relative aspect-square rounded-lg overflow-hidden transition-all
                          ${selectedPhotoId === photo.id
                            ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-lg'
                            : 'ring-2 ring-transparent hover:ring-gray-300'
                          }
                        `}
                      >
                        <Image
                          src={photo.public_url}
                          alt={photo.caption || '照片'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                        />
                        {/* Selected Badge */}
                        {selectedPhotoId === photo.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSelectPhoto}
            disabled={!selectedPhotoId}
            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
