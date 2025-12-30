'use client';

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setShowBanner(false);
    };

    const handleReject = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#1a1a1a] border-t border-white/10">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-[#a1a1a1] text-center sm:text-left">
                    We use cookies to enhance your experience. By continuing to use this site, you agree to our use of cookies.{' '}
                    <a href="/privacy-policy" className="text-[#8b5cf6] hover:underline">
                        Privacy Policy
                    </a>
                </p>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={handleReject}
                        className="px-4 py-2 text-sm text-[#a1a1a1] hover:text-white border border-white/20 rounded-lg transition-colors"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 text-sm text-white bg-[#8b5cf6] hover:bg-[#a78bfa] rounded-lg transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
