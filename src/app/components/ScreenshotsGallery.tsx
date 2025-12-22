'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ScreenshotsGalleryProps {
  screenshots: string[];
  ipadScreenshots?: string[];
  appName: string;
}

export default function ScreenshotsGallery({ 
  screenshots, 
  ipadScreenshots = [], 
  appName 
}: ScreenshotsGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIpad, setShowIpad] = useState(false);
  
  const currentScreenshots = showIpad ? ipadScreenshots : screenshots;
  const hasIpadScreenshots = ipadScreenshots.length > 0;
  
  if (screenshots.length === 0 && ipadScreenshots.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? currentScreenshots.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === currentScreenshots.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="bg-[#1d1d1f] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Screenshots</h2>
        
        {/* Device Toggle */}
        {hasIpadScreenshots && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIpad(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !showIpad 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-[#2d2d2d] text-[#86868b] hover:text-white'
              }`}
            >
              iPhone
            </button>
            <button
              onClick={() => setShowIpad(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showIpad 
                  ? 'bg-[#007AFF] text-white' 
                  : 'bg-[#2d2d2d] text-[#86868b] hover:text-white'
              }`}
            >
              iPad
            </button>
          </div>
        )}
      </div>
      
      {/* Scrollable Gallery */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {currentScreenshots.map((url, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="relative flex-shrink-0 rounded-xl overflow-hidden hover:ring-2 hover:ring-[#007AFF] transition-all focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <Image
                src={url}
                alt={`${appName} screenshot ${index + 1}`}
                width={showIpad ? 280 : 150}
                height={showIpad ? 210 : 324}
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>
      
      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Previous button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Image */}
          <div 
            className="max-w-[90vw] max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentScreenshots[currentIndex]}
              alt={`${appName} screenshot ${currentIndex + 1}`}
              width={showIpad ? 800 : 400}
              height={showIpad ? 600 : 866}
              className="object-contain max-h-[90vh] rounded-lg"
              unoptimized
            />
          </div>
          
          {/* Next button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {currentIndex + 1} / {currentScreenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}






