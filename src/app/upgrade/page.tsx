'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function UpgradePage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(`Failed to create checkout session: ${data.details || data.error || 'Unknown error'}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            alert('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-[#8b5cf6]/10 rounded-2xl flex items-center justify-center text-4xl mb-8 border border-[#8b5cf6]/20 mx-auto shadow-2xl shadow-[#8b5cf6]/5">
                    🚀
                </div>
                <h1 className="text-4xl font-black mb-4 tracking-tight">Upgrade Your Account</h1>
                <p className="text-[#86868b] mb-8">
                    Get full access to market insights, revenue data, and AI-powered blueprints to build your next successful app.
                </p>

                {/* Pricing Card */}
                <div className="p-[1px] rounded-[32px] bg-gradient-to-b from-[#8b5cf6]/40 to-transparent mb-8 shadow-2xl shadow-[#8b5cf6]/5">
                    <div className="p-8 bg-[#1f1f1f] rounded-[31px] border border-white/5">
                        <div className="text-center mb-8">
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-6xl font-black text-white">$19</span>
                                <span className="text-sm font-bold text-[#86868b]">USD</span>
                            </div>
                            <p className="text-xs text-[#86868b] mt-2 font-bold uppercase tracking-widest">Lifetime access · Pay Once</p>
                        </div>

                        <ul className="text-left space-y-4 mb-6">
                            {[
                                ['Full Database Access', 'Search thousands of iOS apps'],
                                ['Revenue & Downloads', 'See monthly earnings and downloads'],
                                ['Lifetime License', 'Pay once, own forever']
                            ].map(([title, desc], i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-white/90">
                                    <div className="w-5 h-5 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6] text-[10px] flex-shrink-0 mt-0.5">✓</div>
                                    <span className="leading-tight">
                                        <strong className="font-bold">{title}</strong>{desc && ` - ${desc}`}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* Coming Soon */}
                        <div className="mb-8">
                            <p className="text-[10px] uppercase tracking-widest text-[#86868b] mb-4 font-bold">🚀 Coming Soon</p>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-white/80">AI Review Analysis</p>
                                    <p className="text-xs text-white/40">Turn reviewer complaints into new app opportunities.</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/80">Search Demand</p>
                                    <p className="text-xs text-white/40">See what apps people are looking for but can't find.</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/80">Country Trends</p>
                                    <p className="text-xs text-white/40">Discover top apps from other countries to build in your desired country.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            className={`group relative block w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black rounded-2xl transition-all shadow-xl shadow-[#8b5cf6]/20 active:scale-[0.98] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isLoading ? 'Processing...' : 'GET LIFETIME ACCESS'}
                            </span>
                        </button>

                        <div className="mt-6 text-center text-[10px] font-black text-[#ff9500] uppercase tracking-widest bg-[#ff9500]/5 py-2 px-3 rounded-xl border border-[#ff9500]/10">
                            Early Access Only – Switching to $29/mo soon
                        </div>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-center mt-8">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-[#86868b] hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all hover:bg-white/5"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
