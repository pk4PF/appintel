'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CookieManager } from '@/lib/cookies';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Track first landing
        if (!CookieManager.get('first_landing')) {
            CookieManager.set('first_landing', new Date().toISOString());
            CookieManager.trackFunnelStage('landing_page_entered');
        }
    }, []);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        CookieManager.trackFunnelStage('pricing_viewed');
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (data.url) {
                CookieManager.trackFunnelStage('checkout_redirected');
                window.location.href = data.url;
            } else {
                setError(data.error || 'Failed to start checkout');
                setIsLoading(false);
            }
        } catch {
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-xl font-black tracking-tighter">App Intel</span>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm text-[#86868b] hover:text-white transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero - with Dark Horizon Glow pattern */}
            <section className="pt-32 pb-0 px-6 relative overflow-hidden">
                {/* Dark Horizon Glow Background */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: "radial-gradient(125% 125% at 50% 100%, #000000 40%, #0d1a36 100%)",
                    }}
                />
                {/* Subtle Dot Matrix Overlay */}
                <div
                    className="absolute inset-0 z-0 opacity-30"
                    style={{
                        backgroundColor: 'transparent',
                        backgroundImage: `
                            radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                            radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                        `,
                        backgroundSize: '12px 12px',
                    }}
                />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5856d6]/10 border border-[#5856d6]/20 rounded-full mb-8">
                        <span className="text-sm text-[#5856d6]">🍎 48,648 iOS Apps Analyzed</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                        Find Your Next
                        <span className="block bg-gradient-to-r from-[#5856d6] to-[#007AFF] bg-clip-text text-transparent">
                            $10k/mo App Idea
                        </span>
                    </h1>

                    <p className="text-xl text-[#86868b] max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                        We analyze thousands of high-revenue apps so you can find validated ideas that are already making money.
                    </p>


                </div>
            </section>



            {/* Pricing */}
            <section id="pricing" className="pt-12 pb-24 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5856d6]/10 border border-[#5856d6]/20 rounded-full mb-5">
                        <span className="text-xs font-medium text-[#5856d6]">🔥 Limited Launch Offer</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-3 tracking-tight">Lifetime Access</h2>
                    <p className="text-[#86868b] text-lg">One payment. Forever yours.</p>

                    <div className="max-w-[340px] mx-auto mt-10 p-[1px] rounded-[28px] bg-gradient-to-b from-[#5856d6]/40 to-[#5856d6]/10">
                        <div className="p-7 bg-[#111] rounded-[27px]">
                            {/* Price */}
                            <div className="text-center mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-[52px] font-bold text-[#5856d6] tracking-tight">$19</span>
                                    <span className="text-[#6e6e73] text-sm">USD</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/5 mb-5" />

                            {/* Features */}
                            <ul className="space-y-3 mb-5 text-left">
                                <li className="flex items-start gap-3 text-[14px] text-white/90">
                                    <span className="text-[#5856d6] text-sm shrink-0 mt-0.5">✓</span>
                                    <span className="leading-snug"><strong>Full Database Access</strong> - Search thousands of iOS apps</span>
                                </li>
                                <li className="flex items-start gap-3 text-[14px] text-white/90">
                                    <span className="text-[#5856d6] text-sm shrink-0 mt-0.5">✓</span>
                                    <span className="leading-snug"><strong>Revenue & Downloads</strong> - See monthly earnings and downloads</span>
                                </li>
                                <li className="flex items-start gap-3 text-[14px] text-white/80">
                                    <span className="text-[#5856d6] text-sm shrink-0 mt-0.5">✓</span>
                                    <span className="leading-snug"><strong>Lifetime License</strong> - Pay once, own forever</span>
                                </li>
                            </ul>

                            {/* Coming Soon */}
                            <div className="mb-6">
                                <p className="text-[10px] uppercase tracking-widest text-[#6e6e73] mb-3 font-bold">🚀 Coming Soon</p>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[13px] font-semibold text-white/70">AI Review Analysis</p>
                                        <p className="text-[11px] text-white/35">Turn reviewer complaints into new app opportunities.</p>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-white/70">Search Demand</p>
                                        <p className="text-[11px] text-white/35">See what apps people are looking for but can&apos;t find.</p>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-white/70">Country Trends</p>
                                        <p className="text-[11px] text-white/35">Discover top apps from other countries to build in your desired country.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Email + CTA Form */}
                            <form onSubmit={handleCheckout} className="space-y-3">
                                {error && (
                                    <p className="text-xs text-[#ff453a] text-center">{error}</p>
                                )}
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#5856d6] transition-colors text-[14px]"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="block w-full py-3.5 bg-[#5856d6] hover:bg-[#6967e0] disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-[15px] shadow-lg shadow-[#5856d6]/20"
                                >
                                    {isLoading ? 'Redirecting to checkout...' : 'Get Lifetime Access →'}
                                </button>
                            </form>

                            {/* Urgency */}
                            <div className="mt-4 text-center text-[10px] font-black text-[#ff9500] uppercase tracking-widest bg-[#ff9500]/5 py-2 px-3 rounded-xl border border-[#ff9500]/10">
                                Early Access Only – Switching to $29/mo soon
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/10">
                <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[#6e6e73]">
                    <span>© 2025 App Intel</span>
                    <div className="flex gap-6">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
