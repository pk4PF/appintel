/**
 * Cookie Management Utility
 * 
 * Implements the 5 High-Value Cookie Categories:
 * 1. Product Experience (UX)
 * 2. Conversion & Funnel Intelligence
 * 3. Personalization & Segmentation
 * 4. Performance & Stability
 * 5. Analytics & Marketing
 */

export type CookieCategory = 'experience' | 'funnel' | 'personalization' | 'stability' | 'analytics';

const COOKIE_CONSENT_KEY = 'cookie-consent-prefs';

export interface CookiePrefs {
    experience: boolean;
    funnel: boolean;
    personalization: boolean;
    stability: boolean; // Always true
    analytics: boolean;
}

export const DEFAULT_PREFS: CookiePrefs = {
    experience: true,
    funnel: true,
    personalization: true,
    stability: true,
    analytics: false,
};

import { track } from '@vercel/analytics';

/**
 * Basic cookie setter/getter
 */
export const CookieManager = {
    set(name: string, value: string, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    },

    get(name: string) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    },

    delete(name: string) {
        this.set(name, '', -1);
    },

    /**
     * Get user consent preferences
     */
    getPrefs(): CookiePrefs {
        if (typeof window === 'undefined') return DEFAULT_PREFS;
        const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!saved) return DEFAULT_PREFS;
        try {
            return JSON.parse(saved);
        } catch {
            return DEFAULT_PREFS;
        }
    },

    /**
     * Save user consent preferences
     */
    setPrefs(prefs: Partial<CookiePrefs>) {
        const current = this.getPrefs();
        const updated = { ...current, ...prefs, stability: true };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updated));
        return updated;
    },

    /**
     * Category-specific setters
     */

    // 1. Product Experience
    setUXPreference(key: string, value: string) {
        if (!this.getPrefs().experience) return;
        this.set(`ux_${key}`, value);
    },

    // 2. Conversion & Funnel Intelligence
    trackFunnelStage(stage: string) {
        if (!this.getPrefs().funnel) return;
        this.set('funnel_stage', stage);
        console.log(`(NO $) Funnel Stage tracked: ${stage}`);

        // Push to Vercel Analytics
        try {
            track('funnel_stage', { stage });
        } catch (e) {
            console.error('Failed to track funnel stage:', e);
        }
    },

    // 3. Personalization & Segmentation
    setVisitorType(type: 'founder' | 'marketer' | 'dev' | 'indie') {
        if (!this.getPrefs().personalization) return;
        this.set('visitor_type', type);
    },

    // 4. Performance & Stability (Always allowed)
    setSessionToken(token: string) {
        // Essential cookies don't check prefs but should be secure
        this.set('session_id', token, 7);
    },

    // 5. Analytics (Use sparingly)
    trackEvent(name: string, data: any) {
        if (!this.getPrefs().analytics) return;
        console.log(`(NO $) Analytics Event: ${name}`, data);

        // Push to Vercel Analytics
        try {
            track(name, data);
        } catch (e) {
            console.error('Failed to track event:', e);
        }
    }
};
