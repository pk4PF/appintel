'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CookieManager } from '@/lib/cookies';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
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
        <div className="min-h-screen bg-black text-white selection:bg-[#5856d6]/30 font-sans">
            {/* Background patterns */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 2px 2px, #222 1px, transparent 0)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight">App Intel</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <Link href="/login" className="text-[#86868b] hover:text-white transition-colors font-medium">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-48 pb-20 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
                            Find Your Next<br />
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#5c7cff] drop-shadow-[0_0_30px_rgba(92,124,255,0.5)]">
                                    $10k/mo App Idea
                                </span>
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-[#86868b] max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                            We analyze thousands of high-revenue apps so you can find validated ideas that are already making money.
                        </p>

                        {/* Dashboard Teaser with Blur Overlay */}
                        <div className="relative max-w-4xl mx-auto mb-16 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#5856d6] to-[#007AFF] rounded-[24px] blur opacity-15 group-hover:opacity-25 transition duration-500"></div>
                            <div className="relative bg-black rounded-[20px] border border-white/10 overflow-hidden shadow-2xl">
                                {/* The actual image */}
                                <Image
                                    src="/dashboard-teaser.png"
                                    alt="App Intel Dashboard"
                                    width={1024}
                                    height={600}
                                    className="w-full"
                                />

                                {/* Blur overlay for the data section - covers the cards area */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: `
                                            linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)
                                        `,
                                        backdropFilter: 'blur(0px)',
                                    }}
                                />

                                {/* Targeted blur for the data values */}
                                <div
                                    className="absolute left-0 right-0 bottom-0 pointer-events-none"
                                    style={{
                                        top: '45%',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        mask: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                                        WebkitMask: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                                    }}
                                />

                                {/* Call to action overlay */}
                                <div className="absolute bottom-8 left-0 right-0 z-30 text-center">
                                    <button
                                        onClick={() => document.getElementById('email-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        className="inline-flex items-center gap-3 px-6 py-3 bg-black/70 backdrop-blur-xl border border-white/20 rounded-full hover:bg-black/90 hover:border-white/40 transition-all cursor-pointer"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-sm font-bold text-white">See Revenue & Download Data of 1000+ iOS Apps</span>
                                        <span className="text-white/50">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-full mb-8">
                            <span className="text-sm font-bold text-[#ff3b30] flex items-center gap-2">
                                🔥 Limited Launch Offer
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Lifetime Access</h2>
                        <p className="text-lg text-[#86868b] mb-10 font-medium">One payment. Forever yours.</p>

                        {/* Pricing Card */}
                        <div className="max-w-sm mx-auto">
                            <div className="p-8 rounded-3xl bg-[#111] border border-white/10 text-left relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#5856d6]/10 blur-[40px]" />

                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-5xl font-black tracking-tighter text-[#5c7cff]">$19</span>
                                    <span className="text-[#86868b] font-bold text-base uppercase tracking-widest">USD</span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5c7cff]/20 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-[#5c7cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-white/90">Full Database Access <span className="text-white/40 font-normal text-sm">- Search thousands of iOS apps</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5c7cff]/20 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-[#5c7cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-white/90">Revenue & Downloads <span className="text-white/40 font-normal text-sm">- See monthly earnings</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5c7cff]/20 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-[#5c7cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-white/90">Lifetime License <span className="text-white/40 font-normal text-sm">- Pay once, own forever</span></span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">🚀 Coming Soon</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white/80">AI Review Analysis</h4>
                                        <p className="text-xs text-[#86868b] font-medium leading-normal mt-0.5">
                                            Turn reviewer complaints into new app opportunities.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCheckout} className="w-full mt-12 space-y-4">
                                {error && <p className="text-xs text-[#ff453a] mb-2">{error}</p>}
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#5c7cff] transition-colors text-center font-bold text-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 bg-[#5c7cff] hover:bg-[#4a6cf0] disabled:opacity-50 text-white font-black rounded-2xl transition-all text-xl shadow-2xl shadow-[#5c7cff]/30 transform hover:-translate-y-1"
                                >
                                    {isLoading ? 'Processing...' : 'Get Lifetime Access →'}
                                </button>
                                <p className="text-[10px] text-[#6e6e73] font-bold uppercase tracking-widest pt-4 text-center">
                                    Secure payment via Stripe • Instant Dashboard Access
                                </p>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-20 px-6 border-t border-white/5 mt-auto bg-[#050505]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#6e6e71] font-bold">
                    <div className="flex items-center gap-2">
                        <span>© 2026 App Intel. Built for Builders.</span>
                    </div>
                    <div className="flex gap-8 uppercase tracking-widest text-[10px]">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
