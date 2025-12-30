import { getServerClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { calculateMRRFromMetrics, formatMRR } from '@/services/mrr-calculator';

export const dynamic = 'force-dynamic';

// Custom niches with search keywords
const NICHES: Record<string, { name: string; icon: string; keywords: string[] }> = {
    'habit-trackers': { name: 'Habit Trackers', icon: '✅', keywords: ['habit', 'routine', 'daily'] },
    'meditation': { name: 'Meditation & Mindfulness', icon: '🧘', keywords: ['meditation', 'mindful', 'calm', 'relax'] },
    'budget': { name: 'Budget & Money', icon: '💰', keywords: ['budget', 'expense', 'money', 'finance', 'spending'] },
    'fitness': { name: 'Workout & Fitness', icon: '💪', keywords: ['workout', 'fitness', 'gym', 'exercise'] },
    'journaling': { name: 'Journaling', icon: '📓', keywords: ['journal', 'diary', 'writing', 'note'] },
    'fasting': { name: 'Fasting & Diet', icon: '🍽️', keywords: ['fasting', 'diet', 'calorie', 'weight'] },
    'sleep': { name: 'Sleep & Rest', icon: '😴', keywords: ['sleep', 'rest', 'insomnia', 'dream'] },
    'productivity': { name: 'Productivity', icon: '⚡', keywords: ['productivity', 'task', 'todo', 'planner'] },
    'language': { name: 'Language Learning', icon: '🗣️', keywords: ['language', 'learn', 'vocab', 'speak'] },
    'reading': { name: 'Reading & Books', icon: '📚', keywords: ['read', 'book', 'kindle', 'audiobook'] },
    'focus': { name: 'Focus & Timer', icon: '🎯', keywords: ['focus', 'timer', 'pomodoro', 'concentration'] },
    'photo': { name: 'Photo Editing', icon: '📷', keywords: ['photo', 'edit', 'filter', 'camera'] },
    'music': { name: 'Music & Audio', icon: '🎵', keywords: ['music', 'audio', 'sound', 'beat'] },
    'travel': { name: 'Travel Planning', icon: '✈️', keywords: ['travel', 'trip', 'vacation', 'packing'] },
    'recipe': { name: 'Recipes & Cooking', icon: '🍳', keywords: ['recipe', 'cook', 'meal', 'food'] },
};

// Big company blocklist
const BIG_COMPANIES = [
    'google', 'microsoft', 'apple', 'meta', 'facebook', 'amazon', 'adobe',
    'anthropic', 'openai', 'netflix', 'spotify', 'uber', 'lyft', 'airbnb',
    'atlassian', 'shopify', 'salesforce', 'oracle', 'ibm',
];

interface App {
    id: string;
    name: string;
    icon_url: string | null;
    developer_name: string | null;
    pricing_model: string | null;
    price: number | null;
    app_metrics: Array<{
        rating: number | null;
        rating_count: number | null;
        downloads_estimate: number | null;
    }>;
    reviews: Array<{ id: string }>;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-3 h-3 ${star <= Math.floor(rating) ? 'text-[#FFD60A]' : 'text-[#2c2c2e]'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function formatRatingCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

function AppCard({ app }: { app: App }) {
    const latestMetrics = app.app_metrics?.[0];
    const rating = latestMetrics?.rating || 0;
    const ratingCount = latestMetrics?.rating_count || 0;
    const downloads = latestMetrics?.downloads_estimate || 0;
    const mrr = calculateMRRFromMetrics(app.pricing_model, app.price, downloads);

    return (
        <Link
            href={`/app/${app.id}`}
            className="group flex items-center gap-4 p-5 rounded-[24px] bg-white/5 border border-white/5 hover:border-[#8b5cf6]/20 hover:bg-white/[0.08] transition-all duration-300 active:scale-[0.98]"
        >
            {app.icon_url ? (
                <Image
                    src={app.icon_url}
                    alt={app.name}
                    width={56}
                    height={56}
                    className="rounded-[14px] shadow-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                />
            ) : (
                <div className="w-14 h-14 bg-white/10 rounded-[14px] flex items-center justify-center text-2xl shadow-xl flex-shrink-0">
                    📱
                </div>
            )}

            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-[15px] leading-snug mb-1 truncate group-hover:text-[#8b5cf6] transition-colors">
                    {app.name}
                </h3>
                <p className="text-[11px] font-medium text-[#6e6e73] mb-2 truncate uppercase tracking-widest">
                    {app.developer_name || 'Developer'}
                </p>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-md">
                        <StarRating rating={rating} />
                        <span className="text-[10px] text-[#86868b] font-black">
                            {formatRatingCount(ratingCount)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#8b5cf6] transition-all duration-500">
                <svg className="w-4 h-4 text-[#3a3a3c] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
}

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const niche = NICHES[slug];

    if (!niche) {
        notFound();
    }

    const supabase = getServerClient();
    const supabaseAuth = await createClient();

    // Check auth
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch apps that ALREADY have reviews
    const { data: appsData } = await supabase
        .from('apps')
        .select(`
            id,
            name,
            icon_url,
            developer_name,
            pricing_model,
            price,
            app_metrics (rating, rating_count, downloads_estimate),
            reviews!inner (id)
        `)
        .limit(500);

    // Filter to indie-friendly apps that match niche keywords
    const apps = (appsData || [])
        .filter(app => {
            const ratingCount = app.app_metrics?.[0]?.rating_count || 0;
            const devName = (app.developer_name || '').toLowerCase();
            const isBigCompany = BIG_COMPANIES.some(c => devName.includes(c));
            const name = (app.name || '').toLowerCase();
            const matchesNiche = niche.keywords.some(kw => name.includes(kw));
            return ratingCount > 50 && ratingCount < 10000 && !isBigCompany && matchesNiche;
        })
        .sort((a, b) => {
            const aRatings = a.app_metrics?.[0]?.rating_count || 0;
            const bRatings = b.app_metrics?.[0]?.rating_count || 0;
            return bRatings - aRatings;
        }) as App[];

    return (
        <div className="min-h-screen bg-[#171717] text-white">
            {/* Header */}
            <div className="px-8 py-10 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/5 blur-[100px] pointer-events-none" />
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black text-[#6e6e73] hover:text-[#8b5cf6] transition-all uppercase tracking-[0.2em] mb-8 group">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-2xl">
                        {niche.icon}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter">{niche.name}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-1 h-1 rounded-full bg-[#34c759]" />
                            <p className="text-[11px] font-black text-[#48484a] uppercase tracking-[0.2em]">Niche Opportunities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apps Grid */}
            <div className="px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {apps.map((app) => (
                            <AppCard key={app.id} app={app} />
                        ))}
                    </div>

                    {apps.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-[#86868b]">No apps found in this niche.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
