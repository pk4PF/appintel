'use client';

import { useEffect } from 'react';
import { CookieManager } from '@/lib/cookies';

export default function SegmentationTracker() {
    useEffect(() => {
        // Set visitor type if not already set (personalization principle)
        if (!CookieManager.get('visitor_type')) {
            CookieManager.setVisitorType('indie');
        }
    }, []);

    return null;
}
