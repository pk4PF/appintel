'use client';

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-xl font-black tracking-tighter">AppGap</span>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm text-[#86868b] hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="px-4 py-2 bg-[#007AFF] hover:bg-[#0A84FF] text-white text-sm font-medium rounded-full transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero - with Dark Horizon Glow pattern */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#34c759]/10 border border-[#34c759]/20 rounded-full mb-8">
                        <span className="text-sm text-[#34c759]">🍎 Find iOS apps making real money</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                        Launch Your Next
                        <span className="block bg-gradient-to-r from-[#5856d6] to-[#007AFF] bg-clip-text text-transparent">
                            iOS App Store Hit
                        </span>
                    </h1>

                    <p className="text-xl text-[#86868b] max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                        Find profitable app gaps in the App Store and get a full blueprint to build your next spinoff.
                        Tech stacks, builder prompts, and marketing playbooks—included.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="px-8 py-4 bg-[#34c759] hover:bg-[#30d158] text-black text-lg font-bold rounded-full transition-all hover:scale-105"
                        >
                            Get Lifetime Access - $29 →
                        </Link>
                        <p className="text-sm text-[#6e6e73]">One-time payment. No subscriptions.</p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 border-y border-white/10">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-[#34c759]">$$$</p>
                            <p className="text-sm text-[#86868b] mt-1">Revenue Data</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold text-[#007AFF]">💡</p>
                            <p className="text-sm text-[#86868b] mt-1">Spinoff Ideas</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold text-[#ff9f0a]">📊</p>
                            <p className="text-sm text-[#86868b] mt-1">Review Insights</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16">Everything You Need</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 bg-[#1d1d1f] rounded-2xl border border-white/5">
                            <div className="w-12 h-12 bg-[#007AFF]/20 rounded-xl flex items-center justify-center text-2xl mb-4">
                                📊
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Revenue Estimates</h3>
                            <p className="text-sm text-[#86868b]">
                                See estimated monthly revenue for any app. Know what&apos;s actually making money.
                            </p>
                        </div>

                        <div className="p-6 bg-[#1d1d1f] rounded-2xl border border-white/5">
                            <div className="w-12 h-12 bg-[#34c759]/20 rounded-xl flex items-center justify-center text-2xl mb-4">
                                💡
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Spinoff Ideas</h3>
                            <p className="text-sm text-[#86868b]">
                                AI-generated app ideas based on real user complaints and market gaps.
                            </p>
                        </div>

                        <div className="p-6 bg-[#1d1d1f] rounded-2xl border border-white/5">
                            <div className="w-12 h-12 bg-[#ff9f0a]/20 rounded-xl flex items-center justify-center text-2xl mb-4">
                                🔍
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Deep Analysis</h3>
                            <p className="text-sm text-[#86868b]">
                                Read real reviews, find pain points, and discover what users actually want.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-24 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 rounded-full mb-5">
                        <span className="text-xs font-medium text-[#ff9f0a]">🔥 Limited Launch Offer</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-3 tracking-tight">Lifetime Access</h2>
                    <p className="text-[#86868b] text-lg">One payment. Forever yours.</p>

                    <div className="max-w-[340px] mx-auto mt-10 p-[1px] rounded-[28px] bg-gradient-to-b from-[#34c759]/40 to-[#34c759]/10">
                        <div className="p-7 bg-[#111] rounded-[27px]">
                            {/* Price */}
                            <div className="text-center mb-6">
                                <span className="text-sm text-[#48484a] line-through block mb-1">$149</span>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-[52px] font-bold text-[#34c759] tracking-tight">$29</span>
                                    <span className="text-[#6e6e73] text-sm">USD</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/5 mb-5" />

                            {/* Features */}
                            <ul className="space-y-2.5 mb-6">
                                <li className="flex items-center gap-2.5 text-[13px] text-white/90">
                                    <span className="text-[#34c759] text-xs">✓</span>
                                    <span><strong>Lifetime access</strong> — no recurring fees</span>
                                </li>
                                <li className="flex items-center gap-2.5 text-[13px] text-white/90">
                                    <span className="text-[#34c759] text-xs">✓</span>
                                    <span><strong>All future updates</strong> included</span>
                                </li>
                                <li className="flex items-center gap-2.5 text-[13px] text-white/70">
                                    <span className="text-[#34c759] text-xs">✓</span>
                                    Real revenue & download estimates
                                </li>
                                <li className="flex items-center gap-2.5 text-[13px] text-white/70">
                                    <span className="text-[#34c759] text-xs">✓</span>
                                    AI-powered spinoff ideas
                                </li>
                                <li className="flex items-center gap-2.5 text-[13px] text-white/70">
                                    <span className="text-[#34c759] text-xs">✓</span>
                                    Review sentiment analysis
                                </li>
                            </ul>

                            {/* CTA */}
                            <Link
                                href="/signup"
                                className="block w-full py-3.5 bg-[#34c759] hover:bg-[#30d158] text-black font-semibold rounded-xl transition-all text-[15px] shadow-lg shadow-[#34c759]/20"
                            >
                                Get Lifetime Access →
                            </Link>

                            {/* Urgency */}
                            <p className="text-[11px] text-[#ff9f0a] mt-4 font-medium">
                                ⚠️ Switching to monthly subscription soon — lock in lifetime now
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to find your next app idea?</h2>
                    <p className="text-[#86868b] mb-8">Join indie developers building profitable apps.</p>
                    <Link
                        href="/signup"
                        className="inline-block px-8 py-4 bg-[#34c759] hover:bg-[#30d158] text-black text-lg font-bold rounded-full transition-all hover:scale-105"
                    >
                        Get Lifetime Access - $29 →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/10">
                <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[#6e6e73]">
                    <span>© 2025 AppGap</span>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
