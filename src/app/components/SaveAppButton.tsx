'use client';

import { useState } from 'react';
import { saveApp, unsaveApp, isAppSaved } from '@/lib/savedApps';
import { CookieManager } from '@/lib/cookies';

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
      CookieManager.trackEvent('app_unsaved', { app_id: app.id, app_name: app.name });
    } else {
      saveApp(app);
      setSaved(true);
      CookieManager.trackEvent('app_saved', { app_id: app.id, app_name: app.name });
    }
  };


  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 transition-all duration-300 ${saved
          ? 'text-[#8b5cf6] scale-110'
          : 'text-[#6e6e73] hover:text-[#8b5cf6]'
          } ${className}`}
        title={saved ? 'Remove from saved' : 'Save opportunity'}
      >
        <svg
          className="w-5 h-5 transition-transform"
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
      className={`px-6 py-2.5 text-[11px] font-black tracking-[0.2em] rounded-xl transition-all uppercase border ${saved
        ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20'
        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
        } ${className}`}
    >
      {saved ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#8b5cf6] animate-pulse" />
          Saved
        </span>
      ) : (
        'Save'
      )}
    </button>
  );
}






