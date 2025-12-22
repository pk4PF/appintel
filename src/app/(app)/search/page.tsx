'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResult {
  id: string;
  name: string;
  icon_url: string | null;
  short_description: string | null;
  developer_name: string | null;
  pricing_model: string;
  price: number;
  rating?: number | null;
  rating_count?: number | null;
  opportunity_score?: number | null;
}

function getScoreBadgeColor(score: number): string {
  if (score >= 75) return 'bg-[#34c759]';
  if (score >= 60) return 'bg-[#30d158]';
  if (score >= 45) return 'bg-[#ff9f0a]';
  if (score >= 30) return 'bg-[#ff6b6b]';
  return 'bg-[#ff453a]';
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

const QUICK_SEARCHES = [
  'productivity',
  'meditation',
  'fitness',
  'finance',
  'social',
  'games',
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Check for query param on load
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
      const data = await response.json();
      // API returns 'results' with different field names, map them
      const mapped = (data.results || []).map((r: { id: string; name: string; icon: string | null; description: string | null; developer: string | null; pricingModel: string; opportunityScore: number | null }) => ({
        id: r.id,
        name: r.name,
        icon_url: r.icon,
        short_description: r.description,
        developer_name: r.developer,
        pricing_model: r.pricingModel,
        price: 0,
        opportunity_score: r.opportunityScore
      }));
      setResults(mapped);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-8 py-6">
        <h1 className="text-3xl font-bold mb-6">Search Apps</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6e6e73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for apps..."
              className="w-full pl-12 pr-4 py-4 bg-[#1d1d1f] border border-white/10 rounded-xl text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#007AFF] transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6e6e73] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => { setQuery(term); performSearch(term); }}
              className="px-4 py-2 bg-[#1d1d1f] hover:bg-[#2d2d2d] text-sm text-[#86868b] hover:text-white rounded-full transition-colors capitalize"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-sm text-[#86868b] mb-6">{results.length} results for &quot;{query}&quot;</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
              {results.map((app, index) => (
                <div key={app.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  {/* Rank */}
                  <span className="text-lg font-semibold text-[#6e6e73] w-6 text-right tabular-nums">{index + 1}</span>

                  {/* Icon */}
                  {app.icon_url ? (
                    <Image
                      src={app.icon_url}
                      alt={app.name}
                      width={64}
                      height={64}
                      className="rounded-[14px] shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#2d2d2d] rounded-[14px] flex items-center justify-center text-2xl shadow-lg">
                      📱
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-medium text-white truncate">{app.name}</h3>
                    <p className="text-sm text-[#86868b] truncate">
                      {app.short_description || app.developer_name || 'App'}
                    </p>
                  </div>

                  {/* Score Badge */}
                  {app.opportunity_score !== null && app.opportunity_score !== undefined && (
                    <div className={`px-2.5 py-1 rounded-full text-white text-xs font-semibold ${getScoreBadgeColor(app.opportunity_score)}`}>
                      {app.opportunity_score.toFixed(0)}
                    </div>
                  )}

                  {/* View Button */}
                  <Link
                    href={`/app/${app.id}`}
                    className="px-5 py-1.5 bg-[#007AFF] hover:bg-[#0A84FF] text-white text-sm font-medium rounded-full transition-colors whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : hasSearched ? (
          <div className="text-center py-20">
            <p className="text-[#86868b] mb-3">No results found for &quot;{query}&quot;</p>
            <p className="text-sm text-[#6e6e73]">Try a different search term or browse categories</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#86868b] mb-3">Search for apps by name, category, or keyword</p>
            <p className="text-sm text-[#6e6e73]">Try one of the quick search suggestions above</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse">
          <div className="h-10 bg-[#1d1d1f] rounded w-48 mb-6"></div>
          <div className="h-14 bg-[#1d1d1f] rounded w-full max-w-2xl mb-4"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-[#1d1d1f] rounded-full w-24"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
