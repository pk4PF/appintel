'use client';

import { GapAnalysis } from '@/services/scoring/review-gap';


function IssueTag({ category, count }: { category: string; count: number }) {
  const colors = {
    technical: 'bg-[#ff453a]/20 text-[#ff453a]',
    ux: 'bg-[#ff9f0a]/20 text-[#ff9f0a]',
    feature: 'bg-[#007AFF]/20 text-[#007AFF]',
    pricing: 'bg-[#34c759]/20 text-[#34c759]',
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[category as keyof typeof colors] || 'bg-white/10 text-white'}`}>
      {category} ({count})
    </span>
  );
}

function OpportunityCard({ opportunity }: { opportunity: string }) {
  return (
    <div className="p-3 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl">
      <p className="text-sm text-[#007AFF]">💡 {opportunity}</p>
    </div>
  );
}

export default function GapAnalysisDisplay({ analysis }: { analysis: GapAnalysis }) {
  if (analysis.totalReviews === 0) {
    return (
      <div className="bg-[#1d1d1f] rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 App Intelligence</h2>
        <p className="text-[#86868b]">No reviews available for analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1d1d1f] rounded-2xl p-6">
      {/* Header with Gap Score */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">🎯 App Intelligence</h2>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[#86868b]">Intel Score</p>
            <p className="text-2xl font-bold text-white">{analysis.gapScore}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${analysis.improvementPotential === 'high'
            ? 'bg-[#34c759]/20 text-[#34c759]'
            : analysis.improvementPotential === 'medium'
              ? 'bg-[#ff9f0a]/20 text-[#ff9f0a]'
              : 'bg-white/10 text-[#86868b]'
            }`}>
            {analysis.improvementPotential === 'high' ? '🔥 High Potential' :
              analysis.improvementPotential === 'medium' ? '📊 Medium Potential' :
                '📉 Low Potential'}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{analysis.totalReviews}</p>
          <p className="text-xs text-[#86868b]">Total Reviews</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#ff453a]">{analysis.negativeReviews}</p>
          <p className="text-xs text-[#86868b]">Negative Reviews</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#ff9f0a]">{analysis.frustrationLevel}%</p>
          <p className="text-xs text-[#86868b]">Frustration Level</p>
        </div>
      </div>

      {/* Opportunities - THE MAIN VALUE */}
      {analysis.opportunities.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
            🚀 Build Opportunities
          </h3>
          <div className="space-y-2">
            {analysis.opportunities.map((opportunity, idx) => (
              <OpportunityCard key={idx} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}

      {/* Actionable Issues */}
      {analysis.actionableIssues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
            🔧 Fixable Issues
          </h3>
          <div className="space-y-3">
            {analysis.actionableIssues.slice(0, 8).map((issue, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <IssueTag category={issue.category} count={issue.count} />
                <div className="flex-1">
                  <p className="text-sm text-white capitalize">{issue.issue}</p>
                  {issue.examples[0] && (
                    <p className="text-xs text-[#86868b] mt-1 italic line-clamp-2">
                      &ldquo;{issue.examples[0]}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What Works */}
      {analysis.whatWorks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
            ✅ What Users Love (Keep These)
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.whatWorks.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-[#34c759]/20 text-[#34c759] rounded-full text-sm"
              >
                {item.feature} ({item.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gap Signals */}
      {analysis.gapSignals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
            🎯 Intelligence Signals Found
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {analysis.gapSignals.slice(0, 10).map((signal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-black/30 rounded-lg"
              >
                <span className="text-sm text-[#86868b]">&ldquo;{signal.keyword}&rdquo;</span>
                <span className="text-xs text-white bg-white/10 px-2 py-0.5 rounded-full">
                  {signal.count}x
                </span>
              </div>
            ))}
          </div>
          {analysis.gapSignals.length > 10 && (
            <p className="text-xs text-[#86868b] mt-2">
              +{analysis.gapSignals.length - 10} more signals found
            </p>
          )}
        </div>
      )}
    </div>
  );
}






