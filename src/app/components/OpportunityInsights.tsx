'use client';

import { useState } from 'react';

interface Blueprint {
    tech_stack?: string[];
    builder_prompts?: {
        ui_ux?: string;
        core_logic?: string;
        architecture?: string;
    };
    marketing_playbook?: Array<{
        platform: string;
        strategy: string;
        content_style: string;
    }>;
}

interface Insight {
    id: string;
    insight_type: string;
    summary: string;
    evidence: string[];
    frequency: number;
    blueprint: Blueprint | null;
}

export default function OpportunityInsights({ insights }: { insights: Insight[] }) {
    const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

    if (!insights || insights.length === 0) {
        return (
            <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 text-center">
                <p className="text-[#6e6e73] font-bold uppercase tracking-widest text-xs">No specific opportunities analyzed yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#34c759]/10 text-[#34c759] text-[10px] font-black rounded-full border border-[#34c759]/20 uppercase tracking-widest">
                    AI Opportunity Analysis
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className="group relative bg-white/5 rounded-[32px] border border-white/5 hover:border-[#8b5cf6]/30 transition-all duration-300 overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-[#6e6e73] uppercase tracking-[0.2em]">
                                        {insight.insight_type}
                                    </span>
                                    <p className="text-sm text-[#86868b] leading-relaxed">
                                        Based on {insight.frequency} frequency signal
                                    </p>
                                </div>
                                <button
                                    onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                                    className="px-4 py-2 bg-[#8b5cf6]/10 text-[#a78bfa] text-[10px] font-black rounded-full border border-[#8b5cf6]/20 uppercase tracking-widest hover:bg-[#8b5cf6]/20 transition-colors"
                                >
                                    {expandedInsight === insight.id ? 'Close Details' : 'View Blueprint'}
                                </button>
                            </div>

                            <div className="prose prose-invert max-w-none mb-6">
                                <p className="text-xl font-medium leading-relaxed text-white/90">
                                    {insight.summary.replace(/\*\*(.*?)\*\*/g, '$1')}
                                </p>
                            </div>

                            {insight.evidence && insight.evidence.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {insight.evidence.map((ev, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 text-[10px] font-bold text-[#6e6e73] rounded-full border border-white/5">
                                            {ev}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Expanded Content: Blueprint */}
                            {expandedInsight === insight.id && insight.blueprint && (
                                <div className="mt-8 pt-8 border-t border-white/10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">

                                    {/* Tech Stack */}
                                    {insight.blueprint.tech_stack && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-[#6e6e73] uppercase tracking-[0.2em]">Recommended Tech Stack</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {insight.blueprint.tech_stack.map((tech, i) => (
                                                    <span key={i} className="px-3 py-1 bg-[#8b5cf6]/5 text-[#a78bfa] text-[10px] font-black rounded-lg border border-[#8b5cf6]/10 uppercase tracking-widest">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Builder Prompts */}
                                    {insight.blueprint.builder_prompts && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {Object.entries(insight.blueprint.builder_prompts).map(([key, value]) => (
                                                <div key={key} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                    <h5 className="text-[10px] font-black text-[#6e6e73] uppercase tracking-[0.2em] mb-3">{key.replace('_', ' ')} Prompt</h5>
                                                    <p className="text-sm text-[#86868b] leading-loose italic">"{value}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Marketing Playbook */}
                                    {insight.blueprint.marketing_playbook && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-[#6e6e73] uppercase tracking-[0.2em]">Marketing Playbook</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {insight.blueprint.marketing_playbook.map((play, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-black text-[#A78BFA] uppercase tracking-widest">{play.platform}</span>
                                                                <span className="text-[10px] font-medium text-[#6e6e73] px-2 py-0.5 bg-white/5 rounded-full border border-white/5 uppercase tracking-widest">{play.content_style}</span>
                                                            </div>
                                                            <p className="text-sm text-white/80 leading-relaxed font-medium">{play.strategy}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
