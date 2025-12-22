'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const DATE_RANGES = [
  { value: '1d', label: 'Today' },
  { value: '7d', label: 'This Week' },
  { value: '30d', label: 'This Month' },
  { value: '90d', label: '3 Months' },
];

interface DiscoverFiltersProps {
  categories: Category[];
}

export default function DiscoverFilters({ categories }: DiscoverFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const dateRange = searchParams.get('range') || '30d';
  const categorySlug = searchParams.get('category') || '';

  const buildUrl = (newParams: Record<string, string>) => {
    const urlParams = new URLSearchParams(searchParams.toString());
    
    // Always reset to page 1 when changing filters
    urlParams.delete('page');
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== '' && !(key === 'range' && value === '30d')) {
        urlParams.set(key, value);
      } else {
        urlParams.delete(key);
      }
    });
    
    const qs = urlParams.toString();
    return qs ? `/?${qs}` : '/';
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ category: e.target.value }));
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Date Range */}
      <div className="flex items-center bg-[#1d1d1f] rounded-lg p-1">
        {DATE_RANGES.map((range) => (
          <Link
            key={range.value}
            href={buildUrl({ range: range.value })}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              dateRange === range.value
                ? 'bg-[#007AFF] text-white'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            {range.label}
          </Link>
        ))}
      </div>
      
      {/* Category Filter */}
      <div className="relative">
        <select
          value={categorySlug}
          onChange={handleCategoryChange}
          className="appearance-none bg-[#1d1d1f] text-white text-sm font-medium pl-4 pr-10 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#007AFF] cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
