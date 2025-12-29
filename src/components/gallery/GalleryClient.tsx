'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhotoCard, { Photo } from './PhotoCard';
import GalleryStats from './GalleryStats';
import GalleryFilter from './GalleryFilter';
import PhotoLightbox from './PhotoLightbox';
import { createClient } from '@/lib/supabase/client';

interface GalleryClientProps {
  trip: any;
  tripId: string;
  images: any[];
  imagesByDate: Record<string, any[]>;
  userStats: Record<string, { count: number; user: any }>;
  members: Array<{ user_id: string; profile: any }>;
  days: Date[];
  currentUserId: string;
  initialDate?: string;
  initialUserFilter?: string;
}

export default function GalleryClient({
  trip,
  tripId,
  images,
  imagesByDate,
  userStats,
  members,
  days,
  currentUserId,
  initialDate,
  initialUserFilter,
}: GalleryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const userParam = searchParams.get('user');

  const [viewAll, setViewAll] = useState(!dateParam);
  const [selectedDate, setSelectedDate] = useState(dateParam || trip.start_date);
  const [selectedUser, setSelectedUser] = useState(userParam || null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [localImages, setLocalImages] = useState<Photo[]>(images);

  const supabase = createClient();

  // Filter images by selected user
  const filteredImages = useMemo(() => {
    if (!selectedUser || selectedUser === 'all') return localImages;
    return localImages.filter(img => img.user_id === selectedUser);
  }, [localImages, selectedUser]);

  // Group filtered images by date
  const filteredImagesByDate = useMemo(() => {
    const result: Record<string, any[]> = {};
    filteredImages.forEach((img) => {
      if (!result[img.day_date]) {
        result[img.day_date] = [];
      }
      result[img.day_date].push(img);
    });
    return result;
  }, [filteredImages]);

  // Get dates that have photos
  const datesWithPhotos = Object.keys(filteredImagesByDate).sort().reverse();


  // Handle date selection
  const handleDateSelect = (dateStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', dateStr);
    setViewAll(false);
    setSelectedDate(dateStr);
    router.push(`?${params.toString()}`);
  };

  // Handle "view all" toggle
  const handleViewAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('date');
    setViewAll(true);
    router.push(`?${params.toString()}`);
  };

  // Toggle date group expansion
  const toggleDateExpansion = (dateStr: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  // Handle user filter change
  const handleUserChange = (userId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId === null) {
      params.delete('user');
    } else {
      params.set('user', userId);
    }
    setSelectedUser(userId);
    router.push(`?${params.toString()}`);
  };

  // Open lightbox with selected photo
  const handlePhotoClick = (photoId: string) => {
    const index = filteredImages.findIndex(img => img.id === photoId);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Close lightbox
  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    try {
      // Find the photo to get storage path
      const photo = localImages.find(img => img.id === photoId);
      if (!photo) return;

      // Delete from storage
      if (photo.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('trip-images')
          .remove([photo.storage_path]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('trip_images')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        return;
      }

      // Remove from local state
      setLocalImages(prev => prev.filter(img => img.id !== photoId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // When viewing all, expand all dates by default
  const shouldExpandAll = expandedDates.size === 0 || viewAll;

  // Get images to display
  let displayImages: any[] = [];
  let displayDates: string[] = [];

  if (viewAll) {
    displayDates = datesWithPhotos;
    // In "all dates" view, use expanded state to determine which dates to show
    displayDates = shouldExpandAll ? datesWithPhotos : datesWithPhotos.filter(d => expandedDates.has(d));
  } else {
    displayDates = [selectedDate];
  }


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">照片库</h1>
          <Link href={`/trips/${tripId}/gallery/upload`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target text-primary-600">
              <Upload className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Panel */}
        <GalleryStats
          userStats={userStats}
          members={members}
          currentUserId={currentUserId}
          totalCount={filteredImages.length}
          selectedUser={selectedUser || undefined}
          onUserChange={handleUserChange}
        />

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* View All Toggle */}
            <button
              onClick={handleViewAll}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewAll
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              全部日期
            </button>

            {/* Filter */}
            <GalleryFilter
              members={members}
              userStats={userStats}
              currentUserId={currentUserId}
              selectedUser={selectedUser || undefined}
              onUserChange={handleUserChange}
            />
          </div>

          {/* Upload Button */}
          <Link href={`/trips/${tripId}/gallery/upload?date=${selectedDate}`}>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              上传
            </Button>
          </Link>
        </div>

        {/* Date Selector (hide when viewing all) */}
        {!viewAll && (
          <div className="flex overflow-x-auto gap-2 pb-4 -mx-4 px-4">
            {days.map((day) => {
              const dateStr = day.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const count = filteredImagesByDate[dateStr]?.length || 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateSelect(dateStr)}
                  className={`
                    flex-shrink-0 w-16 p-2 rounded-lg text-center transition-all
                    ${isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                    }
                  `}
                >
                  <div className="text-xs opacity-80">
                    {day.getMonth() + 1}/{day.getDate()}
                  </div>
                  {count > 0 && (
                    <div className="text-xs mt-1 font-medium">{count}张</div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Images Grid */}
        {displayDates.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedUser ? '该成员暂无上传照片' : '还没有照片'}
            </h3>
            <p className="text-gray-500 mb-6">上传第一张照片记录这一天吧</p>
            <Link href={`/trips/${tripId}/gallery/upload?date=${selectedDate}`}>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                上传照片
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {displayDates.map((dateStr, dateIndex) => {
              const dateImages = filteredImagesByDate[dateStr] || [];
              const isExpanded = shouldExpandAll || expandedDates.has(dateStr);
              const dateObj = new Date(dateStr);
              // Only mark first date group's first 8 images as priority for LCP
              const isFirstDateGroup = dateIndex === 0;

              return (
                <div key={dateStr} className="bg-white rounded-xl border border-gray-100 p-4">
                  {/* Date Header */}
                  <button
                    onClick={() => toggleDateExpansion(dateStr)}
                    className="w-full flex items-center justify-between mb-4 text-left"
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      <CalendarIcon className="w-5 h-5" />
                      <span className="font-medium">
                        {dateObj.getMonth() + 1}月{dateObj.getDate()}日
                      </span>
                      <span className="text-sm text-gray-400">
                        {dateImages.length} 张照片
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Photos Grid */}
                  {isExpanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {dateImages.map((img, index) => {
                        // Mark first 8 images of first date group as priority for LCP optimization
                        const isPriority = isFirstDateGroup && index < 8;
                        return (
                          <PhotoCard
                            key={img.id}
                            photo={img}
                            currentUserId={currentUserId}
                            onSelect={() => handlePhotoClick(img.id)}
                            onDelete={handleDeletePhoto}
                            priority={isPriority}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href={`/trips/${tripId}/calendar`} className="flex flex-col items-center py-2 px-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">日历</span>
          </Link>
          <Link href={`/trips/${tripId}/logs`} className="flex flex-col items-center py-2 px-3">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">记录</span>
          </Link>
          <Link href={`/trips/${tripId}/gallery`} className="flex flex-col items-center py-2 px-3 text-primary-600">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">照片</span>
          </Link>
        </div>
      </nav>

      {/* Photo Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={filteredImages}
          initialIndex={lightboxIndex}
          currentUserId={currentUserId}
          onClose={handleLightboxClose}
        />
      )}
    </div>
  );
}
