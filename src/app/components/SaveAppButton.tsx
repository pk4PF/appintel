'use client';

import { useState } from 'react';
import { saveApp, unsaveApp, isAppSaved } from '@/lib/savedApps';

interface SaveAppButtonProps {
  app: {
    id: string;
    appStoreId: string;
    name: string;
    iconUrl: string | null;
    developerName: string | null;
    category: string | null;
    metrics?: {
      rating: number | null;
      ratingCount: number | null;
      downloadsEstimate: number | null;
      revenueEstimate: number | null;
    };
    opportunityScore?: number | null;
    releaseDate?: string | null;
  };
  className?: string;
  variant?: 'button' | 'icon';
}

export default function SaveAppButton({
  app,
  className = '',
  variant = 'button',
}: SaveAppButtonProps) {
  const [saved, setSaved] = useState(() => isAppSaved(app.id));


  const handleToggle = () => {
    if (saved) {
      unsaveApp(app.id);
      setSaved(false);
    } else {
      saveApp(app);
      setSaved(true);
    }
  };


  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 transition-colors ${saved
          ? 'text-[#007AFF]'
          : 'text-[#6e6e73] hover:text-white'
          } ${className}`}
        title={saved ? 'Remove from saved' : 'Save to list'}
      >
        <svg
          className="w-5 h-5"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${saved
        ? 'bg-[#007AFF] hover:bg-[#0A84FF] text-white'
        : 'bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white'
        } ${className}`}
    >
      {saved ? (
        <span className="flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      ) : (
        'Save'
      )}
    </button>
  );
}






