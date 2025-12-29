'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, RotateCw, RotateCcw, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { Photo } from './PhotoCard';

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  currentUserId: string;
  onClose: () => void;
}

export default function PhotoLightbox({
  photos,
  initialIndex,
  currentUserId,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const currentPhoto = photos[currentIndex];
  const userName = currentPhoto?.profile
    ? (currentPhoto.user_id === currentUserId
        ? '我'
        : currentPhoto.profile.full_name || currentPhoto.profile.username || '用户')
    : '未知用户';

  // Reset rotation when changing photo
  useEffect(() => {
    setRotation(0);
    setScale(1);
  }, [currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleRotateCw = () => {
    setRotation((prev) => prev + 90);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => prev - 90);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'r' || e.key === 'R') handleRotateCw();
    if (e.key === 'e' || e.key === 'E') handleRotateCcw();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle background click to close
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the background itself, not child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.public_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentPhoto.original_filename || `photo-${currentPhoto.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div 
        className="relative w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar - Photo Info */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
          <div className="flex items-center justify-between text-white max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-80">
                {currentIndex + 1} / {photos.length}
              </span>
              {currentPhoto.caption && (
                <span className="font-medium truncate max-w-md">
                  {currentPhoto.caption}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div
            className="relative max-w-full max-h-full transition-transform duration-300"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.3s ease-out',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleResetZoom();
            }}
          >
            <Image
              src={currentPhoto.public_url}
              alt={currentPhoto.caption || '照片'}
              width={1920}
              height={1080}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>

        {/* Bottom Bar - Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
          <div className="max-w-4xl mx-auto">
            {/* Uploader Info */}
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <span>上传者: {userName}</span>
              <span>·</span>
              <span>{new Date(currentPhoto.created_at).toLocaleString('zh-CN')}</span>
              {rotation !== 0 && (
                <>
                  <span>·</span>
                  <span>旋转 {rotation > 0 ? '+' : ''}{rotation % 360}°</span>
                </>
              )}
              {scale !== 1 && (
                <>
                  <span>·</span>
                  <span>缩放 {Math.round(scale * 100)}%</span>
                </>
              )}
            </div>

            {/* Navigation & Controls */}
            <div className="flex items-center justify-between gap-4">
              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-30"
                disabled={photos.length <= 1}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-30"
                  disabled={scale <= 0.5}
                  title="缩小"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-30"
                  disabled={scale >= 3}
                  title="放大"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotateCcw}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="逆时针旋转 (E)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotateCw}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="顺时针旋转 (R)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="下载"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* Next Button */}
              <button
                onClick={goToNext}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-30"
                disabled={photos.length <= 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
