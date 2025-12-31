'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CookieManager, CookiePrefs, DEFAULT_PREFS } from '@/lib/cookies';

const COOKIE_CONSENT_KEY = 'cookie-consent-set';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);

    useEffect(() => {
        const hasSetConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!hasSetConsent) {
            setShowBanner(true);
        }
        setPrefs(CookieManager.getPrefs());
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

    const handleSaveSettings = () => {
        CookieManager.setPrefs(prefs);
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
        setShowBanner(false);
        setShowSettings(false);
    };

    const togglePref = (key: keyof CookiePrefs) => {
        if (key === 'stability') return; // Cannot toggle essential
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 lg:p-8">
            <div className="max-w-xl mx-auto bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {!showSettings ? (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Cookie Preferences</h3>
                        <p className="text-sm text-[#a1a1a1] mb-6 leading-relaxed">
                            We use cookies to improve your experience. Some are essential for the site to work, while others help us understand how you use the platform.
                            See our <Link href="/privacy-policy" className="text-[#8b5cf6] hover:underline">Privacy Policy</Link> for details.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="flex-1 px-4 py-2.5 text-sm text-[#a1a1a1] hover:text-white border border-white/10 rounded-xl transition-colors font-medium"
                            >
                                Customize
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="flex-1 px-4 py-2.5 text-sm text-white bg-[#8b5cf6] hover:bg-[#a78bfa] rounded-xl transition-colors font-bold"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Customize Tracking</h3>
                        <div className="space-y-4 mb-6">
                            {Object.entries({
                                stability: { label: 'Performance & Stability', desc: 'Essential for the site' },
                                experience: { label: 'Product Experience', desc: 'Saves your UI preferences' },
                                funnel: { label: 'Funnel Intelligence', desc: 'Helps us optimize onboarding' },
                                personalization: { label: 'Personalization', desc: 'Tailors content to your role' },
                                analytics: { label: 'Analytics', desc: 'Helps us grow App Intel' },
                            }).map(([key, { label, desc }]) => (
                                <div key={key} className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">{label}</div>
                                        <div className="text-[11px] text-[#6e6e73]">{desc}</div>
                                    </div>
                                    <button
                                        onClick={() => togglePref(key as keyof CookiePrefs)}
                                        disabled={key === 'stability'}
                                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs[key as keyof CookiePrefs] ? 'bg-[#8b5cf6]' : 'bg-[#3a3a3c]'} ${key === 'stability' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs[key as keyof CookiePrefs] ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 px-4 py-2.5 text-sm text-[#a1a1a1] hover:text-white border border-white/10 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex-1 px-4 py-2.5 text-sm text-white bg-[#8b5cf6] hover:bg-[#a78bfa] rounded-xl transition-colors font-bold"
                            >
                                Save Selection
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
