'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CookieManager } from '@/lib/cookies';
import { FeatureBlock, SuccessStep } from '@/app/components/MarketingBlocks';

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
        <div className="min-h-screen bg-black text-white selection:bg-[#8b5cf6]/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] rounded-lg flex items-center justify-center font-black text-white text-xl">A</div>
                        <span className="text-xl font-black tracking-tighter">App Intel</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="#features" className="text-sm font-medium text-[#86868b] hover:text-white transition-colors">Features</Link>
                        <Link href="#how-it-works" className="text-sm font-medium text-[#86868b] hover:text-white transition-colors">How it Works</Link>
                        <Link href="/login" className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                {/* Background Atmosphere */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#8b5cf6]/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full mb-8 animate-fade-in">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                        <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-[0.2em]">48,648 Apps Analyzed & Counting</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                        Find Your Next <br />
                        <span className="bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#8b5cf6] bg-clip-text text-transparent">
                            $10k/mo App Idea
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-[#86868b] max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                        Stop guessing what to build. We analyze thousands of high-revenue apps with terrible ratings so you can launch a better version and dominate.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href="#pricing"
                            className="px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-lg font-black rounded-2xl transition-all shadow-xl shadow-[#8b5cf6]/20 flex items-center gap-2 group hover:scale-105"
                        >
                            Get Lifetime Access
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <p className="text-[10px] font-black text-[#ff9500] uppercase tracking-widest">
                            Early Access Special: $19 (Save 90%)
                        </p>
                    </div>
                </div>
            </section>

            {/* Feature Grid - "The Intelligence Suite" */}
            <section id="features" className="py-32 px-6 border-t border-white/5 bg-[#050505]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                            The Only Intelligence Suite <br />
                            Trained on <span className="text-[#8b5cf6]">Real Revenue</span>
                        </h2>
                        <p className="text-[#86868b] text-lg font-medium max-w-2xl mx-auto">
                            We don't just show you "ideas." We show you valid market gaps where developers are making bank with poor products.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FeatureBlock
                            icon="🎯"
                            title="Market Gap Radar"
                            description="Find apps with high revenue but terrible ratings. Your perfect launch target."
                        />
                        <FeatureBlock
                            icon="💰"
                            title="Revenue Decoder"
                            description="See the actual monthly earnings of any app in our 48k+ database."
                        />
                        <FeatureBlock
                            icon="📈"
                            title="Momentum Tracker"
                            description="Identify apps that are exploding in rankings BEFORE they get crowded."
                        />
                        <FeatureBlock
                            icon="🧠"
                            title="AI Spinoff Blueprints"
                            description="Generate a complete development plan to build a better version of any app."
                        />
                        <FeatureBlock
                            icon="🔍"
                            title="Category Scanner"
                            description="Spot underserved niches in Finance, Health, and 20+ other categories."
                            accentColor="#34c759"
                        />
                        <FeatureBlock
                            icon="🌍"
                            title="Global Trends"
                            description="See what's trending in Japan, China, and UK to bring it to the US market."
                            accentColor="#007aff"
                        />
                        <FeatureBlock
                            icon="🗣️"
                            title="Sentiment Analysis"
                            description="AI summarizes reviewer complaints so you know exactly what to fix."
                            accentColor="#ff9500"
                        />
                        <FeatureBlock
                            icon="⚡"
                            title="Quick Launch Kit"
                            description="Download competitor tech specs to jumpstart your development."
                            accentColor="#ff2d55"
                        />
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-32 px-6">
                <div className="max-w-5xl mx-auto bg-[#1c1c1e]/40 border border-white/5 rounded-[48px] p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/5 blur-[80px] rounded-full" />

                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 uppercase">How App Intel Works</h2>
                        <p className="text-[#86868b] font-medium">From curiosity to profitable app in 3 simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Decorative Connectors (Desktop Only) */}
                        <div className="hidden md:block absolute top-5 left-[33%] right-[33%] h-px bg-white/10" />

                        <SuccessStep
                            number="01"
                            title="Scan the Radar"
                            description="Use the explorer to find apps with high 'Intel Scores' (High Momentum + High Revenue)."
                        />
                        <SuccessStep
                            number="02"
                            title="Analyze the Gap"
                            description="Look at user complaints to see why people hate the current top apps."
                        />
                        <SuccessStep
                            number="03"
                            title="Build the Spinoff"
                            description="Launch a version that fixes those problems and capture the market share."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing / Final CTA */}
            <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ff9500]/10 border border-[#ff9500]/20 rounded-full mb-8">
                        <span className="text-xs font-black text-[#ff9500] uppercase tracking-widest">Founder Special: 90% Off</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight">
                        Own the Market. <br />
                        Pay <span className="text-[#8b5cf6]">Once</span>.
                    </h2>

                    <div className="max-w-sm mx-auto p-1 rounded-[40px] bg-gradient-to-br from-[#8b5cf6] via-[#a78bfa] to-[#6366f1] shadow-2xl shadow-[#8b5cf6]/20">
                        <div className="bg-[#111] p-10 rounded-[38px] text-left">
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-6xl font-black text-white">$19</span>
                                <span className="text-[#6e6e73] font-bold">LIFETIME</span>
                                <span className="ml-auto text-[#6e6e73] line-through text-sm font-bold">$149</span>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {[
                                    'Full Database Access (48k+ Apps)',
                                    'Revenue & Download Estimates',
                                    'AI Market Spinoff Blueprints',
                                    'Country-specific Trend Radar',
                                    'Future Updates Included (Free)',
                                    'Priority Support'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/90 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <form onSubmit={handleCheckout} className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your-email@example.com"
                                    required
                                    className="w-full px-6 py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-white placeholder-[#48484a] focus:outline-none focus:border-[#8b5cf6] transition-all font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-[#8b5cf6]/20 uppercase tracking-widest"
                                >
                                    {isLoading ? 'Loading...' : 'Get Instant Access →'}
                                </button>
                                {error && <p className="text-xs text-[#ff453a] text-center font-bold uppercase">{error}</p>}
                            </form>

                            <p className="mt-6 text-center text-[10px] text-[#48484a] font-bold uppercase tracking-widest">
                                Limited to the first 100 users.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center font-black text-xs">AI</div>
                        <span className="font-black tracking-tighter uppercase">App Intel</span>
                    </div>

                    <div className="flex gap-12 font-bold text-xs uppercase tracking-widest text-[#48484a]">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
                        <a href="mailto:paolosoftware13@gmail.com" className="hover:text-white transition-colors">Support</a>
                    </div>

                    <div className="text-[10px] text-[#48484a] font-bold uppercase tracking-widest">
                        © 2025 – Built for Indie Hackers
                    </div>
                </div>
            </footer>
        </div>
    );
}
