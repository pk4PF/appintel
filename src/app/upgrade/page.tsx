'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="max-w-md text-center">
                <div className="text-6xl mb-6">🔒</div>
                <h1 className="text-3xl font-bold mb-4">Premium Access Required</h1>
                <p className="text-[#86868b] mb-8">
                    You&apos;re signed in, but you need to upgrade to access the dashboard and app insights.
                </p>

                {/* Pricing Card */}
                <div className="p-[1px] rounded-[28px] bg-gradient-to-b from-[#34c759]/40 to-[#34c759]/10 mb-8">
                    <div className="p-6 bg-[#111] rounded-[27px]">
                        <div className="text-center mb-4">
                            <span className="text-sm text-[#48484a] line-through block">$149</span>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-bold text-[#34c759]">$29</span>
                                <span className="text-[#6e6e73] text-sm">USD</span>
                            </div>
                            <p className="text-xs text-[#86868b] mt-1">Lifetime access</p>
                        </div>

                        <ul className="text-left space-y-2 mb-6 text-sm">
                            <li className="flex items-center gap-2 text-white/80">
                                <span className="text-[#34c759]">✓</span>
                                Revenue & download estimates
                            </li>
                            <li className="flex items-center gap-2 text-white/80">
                                <span className="text-[#34c759]">✓</span>
                                AI-powered spinoff ideas
                            </li>
                            <li className="flex items-center gap-2 text-white/80">
                                <span className="text-[#34c759]">✓</span>
                                All future updates
                            </li>
                        </ul>

                        <button
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            className={`block w-full py-3 bg-[#34c759] hover:bg-[#30d158] text-black font-bold rounded-xl transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Loading...' : 'Get Lifetime Access →'}
                        </button>
                        <p className="text-[11px] text-[#ff9f0a] mt-3 font-medium">
                            ⚠️ Switching to monthly subscription soon
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/" className="text-sm text-[#86868b] hover:text-white transition-colors">
                        ← Back to home
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-[#86868b] hover:text-white transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
