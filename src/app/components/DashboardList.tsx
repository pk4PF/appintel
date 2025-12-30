'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface DashboardApp {
    id: string;
    name: string;
    icon_url: string | null;
    developer_name: string | null;
    release_date: string | null;
    price: number | null;
    pricing_model: string | null;
    category: string;
    rating: number;
    rating_count: number;
    downloads_estimate: number;
    revenue_estimate: number;
    opportunity_score: number;
    momentum: number;
}

interface DashboardListProps {
    apps: DashboardApp[];
}

export default function DashboardList({ apps }: DashboardListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const ITEMS_PER_PAGE = 48;

    const filteredAndSortedApps = useMemo(() => {
        if (!apps) return [];

        let result = [...apps];

        // Filter by Search Query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(app =>
                app.name.toLowerCase().includes(query) ||
                app.developer_name?.toLowerCase().includes(query) ||
                app.category.toLowerCase().includes(query)
            );
        }

        // Sort by Opportunity Score
        return result.sort((a, b) => b.opportunity_score - a.opportunity_score);
    }, [apps, searchQuery]);

    const totalPages = Math.ceil(filteredAndSortedApps.length / ITEMS_PER_PAGE);

    // Get current page apps
    const currentApps = filteredAndSortedApps.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatPrice = (price: number | null) => {
        if (price === null || price === 0) return 'Free';
        return `$${price.toFixed(2)}`;
    };

    // Helper app card component
    const AppCard = ({ app, rank }: { app: DashboardApp, rank: number }) => {
        return (
            <Link
                href={`/app/${app.id}`}
                className="flex flex-col p-5 bg-[#1c1c1e]/40 hover:bg-[#1c1c1e] border border-white/5 hover:border-[#8b5cf6]/30 rounded-2xl transition-all group h-full relative overflow-hidden"
            >
                <div className="flex items-start justify-between mb-4">
                    {/* Icon */}
                    <div className="relative w-16 h-16 shrink-0">
                        {app.icon_url ? (
                            <Image
                                src={app.icon_url}
                                alt={app.name}
                                fill
                                className="object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center text-2xl">📱</div>
                        )}
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#1c1c1e] rounded-full flex items-center justify-center border border-white/10 text-[10px] font-bold text-[#6e6e73]">
                            {rank}
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end">
                        <span className={app.opportunity_score > 80 ? 'text-[#34c759] font-black text-xl' : 'text-[#86868b] font-bold text-xl'}>
                            {Math.round(app.opportunity_score)}
                        </span>
                        <span className="text-[10px] text-[#6e6e73] uppercase tracking-wider font-medium">Gap Score</span>
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="font-bold text-lg text-white truncate group-hover:text-[#a78bfa] transition-colors leading-tight mb-1">
                        {app.name}
                    </h3>
                    <p className="text-sm text-[#86868b] truncate mb-3">{app.developer_name}</p>

                    <div className="mt-auto flex items-center flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                            {/* Stars */}
                            <div className="flex text-xs text-[#ff9f0a]">
                                <span>★</span>
                            </div>
                            <span className="text-xs font-medium text-[#c0c0c0]">{app.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-[#6e6e73]">({formatNumber(app.rating_count)})</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                            <span className="text-xs text-white">{formatPrice(app.price)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md max-w-[120px]">
                            <span className="text-xs text-[#86868b] truncate">{app.category}</span>
                        </div>

                        {/* Gap Analysis Indicators */}
                        <div className="flex items-center gap-3 mt-1 pt-3 border-t border-white/[0.03] w-full">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#6e6e73] uppercase tracking-tighter">MONTHLY DOWNLOADS</span>
                                <span className="text-xs font-bold text-white bg-white/5 px-1.5 py-0.5 rounded leading-none mt-1 inline-block w-fit">
                                    {formatNumber(app.downloads_estimate)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#6e6e73] uppercase tracking-tighter">MONTHLY REVENUE</span>
                                <span className="text-xs font-bold text-[#34c759] bg-[#34c759]/10 px-1.5 py-0.5 rounded leading-none mt-1 inline-block w-fit">
                                    ${formatNumber(app.revenue_estimate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="w-full pb-10">
            {/* Headers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 bg-[#171717] z-20 py-4 border-b border-white/5 backdrop-blur-xl bg-[#171717]/80">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">Active Market Gaps</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-[#6e6e73] group-focus-within:text-[#8b5cf6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search apps, developers..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            className="bg-[#1c1c1e] border border-white/5 text-sm rounded-xl block w-full md:w-64 pl-10 pr-4 py-2 text-white placeholder-[#6e6e73] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]/50 focus:border-[#8b5cf6]/50 transition-all"
                        />
                    </div>

                    <div className="hidden sm:block text-sm text-[#6e6e73] font-medium border-l border-white/10 pl-4">
                        Sorted by Gap Score
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[500px]">
                {currentApps.map((app, i) => (
                    <AppCard
                        key={app.id}
                        app={app}
                        rank={(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    />
                ))}

                {filteredAndSortedApps.length === 0 && (
                    <div className="text-center py-20 text-[#86868b] col-span-full">
                        {searchQuery ? `No apps found matching "${searchQuery}"` : 'No apps found for this period.'}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                    <button
                        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#1c1c1e] border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <div className="text-sm font-medium text-[#86868b]">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#1c1c1e] border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
