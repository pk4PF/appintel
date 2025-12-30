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
    <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
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
          className="flex-1 font-bold text-white hover:text-[#8b5cf6] transition-colors truncate"
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
      <div className="min-h-screen bg-[#171717] text-white p-8">
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
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#171717]/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Saved</h1>
              <p className="text-sm text-[#86868b] font-bold uppercase tracking-widest mt-1">
                {savedApps.length} saved opportunit{savedApps.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>

            {savedApps.length > 0 && (
              <button
                onClick={handleExport}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-black rounded-xl border border-white/5 transition-all flex items-center gap-2 uppercase tracking-widest"
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
      <div className="px-8 py-10">
        <div className="max-w-4xl mx-auto">
          {savedApps.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[32px]">
              <div className="w-20 h-20 mx-auto mb-6 bg-[#8b5cf6]/10 rounded-3xl flex items-center justify-center text-4xl border border-[#8b5cf6]/20">
                📌
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">The list is empty</h2>
              <p className="text-[#86868b] mb-10 max-w-sm mx-auto text-sm font-medium">
                Save apps from the niche explorer to track their market gaps and revenue potential.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-black rounded-2xl transition-all shadow-xl shadow-[#8b5cf6]/20 uppercase tracking-[0.2em]"
              >
                Explore Niches
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
