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

interface MarketingStrategy {
  platform: string;
  content_style: string;
  strategy: string;
}

interface Blueprint {
  tech_stack: string[];
  builder_prompts: {
    architecture: string;
    ui_ux: string;
    core_logic: string;
  };
  marketing_playbook: MarketingStrategy[];
}

interface ReviewInsight {
  id: string;
  insight_type: string;
  summary: string;
  evidence: string[] | null;
  frequency: number;
  blueprint?: Blueprint;
}

interface ReviewsAnalysisProps {
  reviews: Review[];
  insights: ReviewInsight[];
  appName?: string;
  isAuthenticated?: boolean;
  isPremium?: boolean;
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
type BlueprintTab = 'stack' | 'prompts' | 'marketing';

export default function ReviewsAnalysis({
  reviews,
  insights,
  appName,
  isAuthenticated = false,
  isPremium = false
}: ReviewsAnalysisProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [activeBlueprintTabs, setActiveBlueprintTabs] = useState<Record<string, BlueprintTab>>({});

  // Show blueprints if:
  // 1. User is premium
  // OR 2. App is special (maybe we have some free examples? for now let's just stick to isPremium)
  const canSeeBlueprints = isPremium;

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

  const toggleBlueprintTab = (insightId: string, tab: BlueprintTab) => {
    setActiveBlueprintTabs((prev: Record<string, BlueprintTab>) => ({ ...prev, [insightId]: tab }));
  };

  if (reviews.length === 0 && insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16">
      {/* SPINOFF ANALYSIS - Show teaser for non-authenticated, full for authenticated */}
      <div className="bg-[#1c1c1e] rounded-[32px] p-8 border border-white/5 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#007AFF]/5 blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Blueprint Engine</h2>
            <p className="text-xs text-[#86868b] font-bold uppercase tracking-widest">
              From {appName} reviews to a full business roadmap
            </p>
          </div>
          <div className="px-3 py-1 bg-[#32ade6]/10 text-[#32ade6] text-[10px] font-black rounded-full border border-[#32ade6]/20">
            AI POWERED
          </div>
        </div>

        {canSeeBlueprints ? (
          // Full insights for premium users
          insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {insights.map((insight) => {
                const isMLP = insight.insight_type === '1-Star Review MLP';
                const cleanSummary = insight.summary.replace(/\*\*/g, '');
                const blueprint = insight.blueprint as Blueprint;
                const currentBlueprintTab = activeBlueprintTabs[insight.id] || 'stack';

                return (
                  <div
                    key={insight.id}
                    className="flex flex-col h-full bg-black/40 rounded-[28px] border border-white/5 p-6 hover:border-white/10 transition-colors"
                  >
                    {/* Header */}
                    <div className="mb-6">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full inline-block mb-4 tracking-wider uppercase ${isMLP ? 'text-[#ff9500] bg-[#ff9500]/10 border border-[#ff9500]/20' :
                        'text-[#32ade6] bg-[#32ade6]/10 border border-[#32ade6]/20'
                        }`}>
                        {isMLP ? 'Better Alternative' : 'Spinoff Feature'}
                      </span>
                      <p className="text-md font-bold text-white leading-snug">
                        {cleanSummary}
                      </p>
                    </div>

                    {/* Blueprint Tabs */}
                    {blueprint && (
                      <div className="flex-1 flex flex-col">
                        <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-6">
                          {(['stack', 'prompts', 'marketing'] as BlueprintTab[]).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => toggleBlueprintTab(insight.id, tab)}
                              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 uppercase tracking-tighter ${currentBlueprintTab === tab
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-[#48484a] hover:text-[#86868b]'
                                }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 min-h-[140px]">
                          {currentBlueprintTab === 'stack' && (
                            <div className="space-y-2">
                              {blueprint.tech_stack?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#34c759] group-hover:scale-125 transition-transform" />
                                  <span className="text-[13px] text-[#86868b] font-medium">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {currentBlueprintTab === 'prompts' && (
                            <div className="space-y-4">
                              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-[#5856d6] uppercase tracking-widest mb-2 block">1. Architecture</span>
                                <p className="text-[11px] text-[#86868b] leading-relaxed italic line-clamp-3">"{blueprint.builder_prompts?.architecture}"</p>
                              </div>
                              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-[#ff9500] uppercase tracking-widest mb-2 block">2. UI & UX</span>
                                <p className="text-[11px] text-[#86868b] leading-relaxed italic line-clamp-3">"{blueprint.builder_prompts?.ui_ux}"</p>
                              </div>
                              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-[#34c759] uppercase tracking-widest mb-2 block">3. Core Logic</span>
                                <p className="text-[11px] text-[#86868b] leading-relaxed italic line-clamp-3">"{blueprint.builder_prompts?.core_logic}"</p>
                              </div>
                            </div>
                          )}
                          {currentBlueprintTab === 'marketing' && (
                            <div className="space-y-4">
                              {blueprint.marketing_playbook?.map((item: any, i: number) => (
                                <div key={i} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded bg-[#5856d6]/20 flex items-center justify-center text-[10px] flex-shrink-0">🚀</div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.platform}</span>
                                  </div>
                                  <p className="text-[10px] text-[#5856d6] font-bold mb-1 ml-7">{item.content_style}</p>
                                  <p className="text-[11px] text-[#86868b] leading-relaxed ml-7">{item.strategy}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        <button className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black rounded-2xl border border-white/5 transition-all uppercase tracking-widest">
                          Export Full Blueprint
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-[#48484a] font-black uppercase tracking-widest text-sm">No Blueprints Generated yet</p>
            </div>
          )
        ) : (
          // Locked state for non-authenticated users
          <div className="relative">
            {/* Blurred preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 blur-lg pointer-events-none select-none">
              {[1, 2].map((idx) => (
                <div key={idx} className="bg-black/40 rounded-[28px] border border-white/5 p-6">
                  <span className="text-[9px] font-black px-2.5 py-1 rounded-full inline-block mb-4 text-[#ff9500] bg-[#ff9500]/10 border border-[#ff9500]/20 uppercase tracking-widest">
                    Spinoff Blueprint
                  </span>
                  <div className="h-4 bg-white/5 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-white/5 rounded w-1/2 mb-8" />
                  <div className="flex gap-2 mb-6">
                    <div className="h-8 bg-white/5 rounded flex-1" />
                    <div className="h-8 bg-white/5 rounded flex-1" />
                    <div className="h-8 bg-white/5 rounded flex-1" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-black/60 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm text-center">
                <div className="w-16 h-16 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-[#007AFF]/20">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">Unlock the Blueprint Engine</h3>
                <p className="text-sm text-[#86868b] mb-8 leading-relaxed">
                  Get full tech stacks, builder prompts, and marketing plans for every market gap focused on {appName}.
                </p>
                <a
                  href={isAuthenticated ? "/upgrade" : "/signup"}
                  className="w-full py-4 bg-[#007AFF] text-white font-black rounded-2xl hover:bg-[#0051D4] hover:scale-[1.02] transition-all text-xs uppercase tracking-[0.2em]"
                >
                  {isAuthenticated ? "Unlock Now" : "Start Building Now"}
                </a>
              </div>
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

