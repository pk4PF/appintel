'use client';

import { useState } from 'react';

interface Review {
  id: string;
  author: string | null;
  title: string | null;
  review_text: string | null;
  rating: number;
  review_date: string | null;
  version: string | null;
}

interface ReviewInsight {
  id: string;
  insight_type: string;
  summary: string;
  evidence: string[] | null;
  frequency: number;
}

interface ReviewsAnalysisProps {
  reviews: Review[];
  insights: ReviewInsight[];
  appName?: string;
  isAuthenticated?: boolean;
}

function formatDate(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-[#ff9f0a]' : 'text-[#3d3d3d]'}>
          ★
        </span>
      ))}
    </div>
  );
}

type TabType = 'all' | 'positive' | 'negative' | 'opportunities';

export default function ReviewsAnalysis({ reviews, insights, appName, isAuthenticated = false }: ReviewsAnalysisProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Categorize reviews
  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const negativeReviews = reviews.filter(r => r.rating <= 2);



  const tabs = [
    { id: 'all' as const, label: 'All Reviews', count: reviews.length },
    { id: 'positive' as const, label: 'Positive', count: positiveReviews.length },
    { id: 'negative' as const, label: 'Negative', count: negativeReviews.length },
  ];

  const getFilteredReviews = () => {
    switch (activeTab) {
      case 'positive':
        return positiveReviews;
      case 'negative':
        return negativeReviews;
      default:
        return reviews;
    }
  };

  const filteredReviews = getFilteredReviews();

  if (reviews.length === 0 && insights.length === 0) {
    return null;
  }


  return (
    <div className="space-y-16">
      {/* SPINOFF ANALYSIS - Show teaser for non-authenticated, full for authenticated */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 border border-white/5 relative">
        <h2 className="text-xl font-bold text-white mb-1">Spinoff Ideas</h2>
        <p className="text-sm text-[#86868b] mb-6">
          AI-powered opportunities based on {appName} reviews
        </p>

        {isAuthenticated ? (
          // Full insights for authenticated users
          insights.length > 0 ? (
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight, idx) => {
                const isMLP = insight.insight_type === '1-Star Review MLP';
                const cleanSummary = insight.summary.replace(/\*\*/g, '');

                return (
                  <div
                    key={insight.id}
                    className="p-4 bg-black/30 rounded-xl border border-white/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded inline-block mb-3 ${isMLP ? 'text-[#ff9500] bg-[#ff9500]/10' :
                          'text-[#32ade6] bg-[#32ade6]/10'
                          }`}>
                          {isMLP ? 'Better Alternative' : 'Spinoff Feature'}
                        </span>
                        <p className="text-sm text-white/90 leading-relaxed">
                          {cleanSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#48484a] text-center py-8">No insights generated yet</p>
          )
        ) : (
          // Locked state for non-authenticated users
          <div className="relative">
            {/* Blurred preview */}
            <div className="space-y-4 blur-md pointer-events-none select-none">
              {[1, 2].map((idx) => (
                <div key={idx} className="p-4 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded inline-block mb-2 text-[#ff9500] bg-[#ff9500]/10">
                        Better Alternative
                      </span>
                      <p className="text-sm text-white/90 leading-relaxed">
                        Build a focused app targeting specific user complaints about missing features...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
              <span className="text-3xl mb-3">🔒</span>
              <h3 className="text-lg font-bold mb-1">Spinoff Ideas Available</h3>
              <p className="text-[#86868b] text-center text-sm mb-4 max-w-xs">
                Unlock AI-powered app ideas based on user pain points
              </p>
              <a
                href="/signup"
                className="px-5 py-2.5 bg-[#007AFF] text-white font-semibold rounded-full hover:bg-[#0051D4] transition-colors text-sm"
              >
                Get Lifetime Access
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section - Supplemental */}
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Live Feedback Pool</h2>
            <p className="text-sm text-[#48484a] font-bold uppercase tracking-widest">Source data for our analysis</p>
          </div>
          <div className="flex items-center gap-2 bg-[#1c1c1e] p-1.5 rounded-2xl border border-white/5 self-start">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-xl translate-y-[-1px]'
                  : 'text-[#86868b] hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.label}
                <span className="ml-2 opacity-30">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.slice(0, 48).map((review) => (
            <div
              key={review.id}
              className="bg-[#1c1c1e] p-6 rounded-[24px] border border-white/5 flex flex-col hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-5">
                <StarRating rating={review.rating} />
                <span className="text-[10px] text-[#48484a] font-black ml-auto tabular-nums">{formatDate(review.review_date)}</span>
              </div>
              <h4 className="font-bold text-white mb-3 line-clamp-1 group-hover:text-[#0A84FF] transition-colors">{review.title || 'Untitled Feedback'}</h4>
              <p className="text-[13px] text-[#86868b] leading-relaxed line-clamp-4 mb-6 font-medium">
                {review.review_text}
              </p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/[0.03]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-[10px] font-black text-[#86868b]">
                  {review.author?.replace(/[^\w\s]/g, '').charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-[10px] text-[#48484a] font-black truncate">{review.author || 'Anonymous User'}</span>
                {review.version && (
                  <span className="ml-auto text-[9px] font-black text-[#3d3d3d] px-2 py-0.5 bg-white/5 rounded-md">v{review.version}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="py-32 text-center bg-[#1c1c1e] rounded-[32px] border border-dashed border-white/5">
            <p className="text-[#48484a] font-black uppercase tracking-[0.2em] text-sm">No Match in Feed</p>
          </div>
        )}
      </div>
    </div>
  );
}

