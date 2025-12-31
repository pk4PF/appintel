'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CookieManager, CookiePrefs, DEFAULT_PREFS } from '@/lib/cookies';

const COOKIE_CONSENT_KEY = 'cookie-consent-set';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const hasSetConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!hasSetConsent) {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        const allOn: CookiePrefs = {
            experience: true,
            funnel: true,
            personalization: true,
            stability: true,
            analytics: true,
        };
        CookieManager.setPrefs(allOn);
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
        setShowBanner(false);
    };

    const handleEssentialOnly = () => {
        const essentialOnly: CookiePrefs = {
            experience: false,
            funnel: false,
            personalization: false,
            stability: true,
            analytics: false,
        };
        CookieManager.setPrefs(essentialOnly);
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 lg:p-8">
            <div className="max-w-xl mx-auto bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">Cookie Preferences</h3>
                    <p className="text-sm text-[#a1a1a1] mb-6 leading-relaxed">
                        We use cookies to improve your experience. Some are essential for the site to work, while others help us understand how you use the platform.
                        See our <Link href="/privacy-policy" className="text-[#8b5cf6] hover:underline">Privacy Policy</Link> for details.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleEssentialOnly}
                            className="flex-1 px-4 py-2.5 text-sm text-[#a1a1a1] hover:text-white border border-white/10 rounded-xl transition-colors font-medium"
                        >
                            Essential Only
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 px-4 py-2.5 text-sm text-white bg-[#8b5cf6] hover:bg-[#a78bfa] rounded-xl transition-colors font-bold"
                        >
                            Accept All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
