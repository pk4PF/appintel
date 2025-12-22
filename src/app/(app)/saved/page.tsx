'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getSavedApps,
  unsaveApp,
  SavedApp,
  exportSavedApps,
} from '@/lib/savedApps';


function SavedAppCard({ app, onRemove }: {
  app: SavedApp;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-[#1d1d1f] rounded-xl p-3 hover:bg-[#252527] transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        {app.iconUrl ? (
          <Image
            src={app.iconUrl}
            alt={app.name}
            width={48}
            height={48}
            className="rounded-[12px] flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-[#2d2d2d] rounded-[12px] flex items-center justify-center text-xl flex-shrink-0">
            📱
          </div>
        )}

        {/* Name */}
        <Link
          href={`/app/${app.id}`}
          className="flex-1 font-medium text-white hover:text-[#007AFF] transition-colors truncate"
        >
          {app.name}
        </Link>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(app.id)}
          className="p-2 text-[#6e6e73] hover:text-[#ff453a] transition-colors"
          title="Remove from saved"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function SavedAppsPage() {
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSavedApps(getSavedApps());
    setLoading(false);
  }, []);

  const handleRemove = (id: string) => {
    unsaveApp(id);
    setSavedApps(getSavedApps());
  };

  const handleExport = () => {
    const data = exportSavedApps();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-apps-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#1d1d1f] rounded w-48 mb-4"></div>
          <div className="h-4 bg-[#1d1d1f] rounded w-72 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#1d1d1f] rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Saved Apps</h1>
              <p className="text-[#86868b] mt-1">
                Track performance over time for {savedApps.length} app{savedApps.length !== 1 ? 's' : ''}
              </p>
            </div>

            {savedApps.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-[#1d1d1f] hover:bg-[#2d2d2d] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {savedApps.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#1d1d1f] rounded-2xl flex items-center justify-center text-3xl">
              📌
            </div>
            <h2 className="text-xl font-semibold mb-2">No saved apps yet</h2>
            <p className="text-[#86868b] mb-6 max-w-md mx-auto">
              Save apps from the discover page or app detail pages to track their performance over time.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#007AFF] hover:bg-[#0A84FF] text-white text-sm font-medium rounded-full transition-colors"
            >
              Discover Apps
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedApps.map((app) => (
              <SavedAppCard
                key={app.id}
                app={app}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
