import { getServerClient } from '../lib/supabase';
import type { ReviewInsightInsert } from '../types/database';

/**
 * THE SPINOFF GOLDMINE ENGINE - APP STORE EDITION
 * 
 * All spinoff ideas are iOS App Store apps, NOT B2B SaaS or web products.
 * Target audience: Solo developers looking to build App Store apps.
 * 
 * Focusing on 2 archetypes:
 * 1. Better Alternative (1-Star Review MLP)
 * 2. Spinoff Feature (Feature Independence)
 */

interface SpinoffIdea {
    type: 'feature' | 'pain';
    title: string;
    story: string;
    evidence: string;
}

/**
 * Generates story-driven spinoff ideas - ALL ARE APP STORE APPS
 */
export async function generateAndStoreInsights(appId: string) {
    const supabase = getServerClient();

    console.log(`  🔬 Analyzing reviews for app ${appId}...`);

    try {
        // 1. Fetch the app details
        const { data: appData } = await supabase
            .from('apps')
            .select('name, description, pricing_model')
            .eq('id', appId)
            .single();

        const appName = appData?.name?.split(/[-–:]/)[0]?.trim() || 'this app';

        // 2. Fetch negative/neutral reviews
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating, title, review_text')
            .eq('app_id', appId)
            .lte('rating', 3)
            .order('rating', { ascending: true })
            .limit(50);

        // 3. Clear old insights
        await supabase.from('review_insights').delete().eq('app_id', appId);

        // 4. Generate spinoff ideas
        const spinoffIdeas: SpinoffIdea[] = [];

        // FALLBACK IDEAS (If no reviews or patterns match)
        const fallbackPain: SpinoffIdea = {
            type: 'pain',
            title: `${appName} Clone - Universal Purchase`,
            story: `Subscription fatigue is at an all-time high. Build a high-quality clone of ${appName} with a one-time "Universal Purchase" ($4.99-$9.99). Market it as "One payment. Forever yours." to win users who are tired of monthly bills.`,
            evidence: 'General market trend: Subscription fatigue'
        };

        const fallbackFeature: SpinoffIdea = {
            type: 'feature',
            title: `${appName} Widgets - Home Screen Core`,
            story: `Apps with complex data often fail to provide good widgets. Build a dedicated Widget-only version of ${appName} that puts the most important data directly on the home screen. Micro-utility for $1.99.`,
            evidence: 'General iOS 18 demand for deep widget integration'
        };

        // Process reviews if available
        if (reviews && reviews.length > 0) {
            const allText = reviews.map(r => `${r.title || ''} ${r.review_text || ''}`).join(' ').toLowerCase();

            // --- PATTERN: Better Alternative (Pain Points) ---
            if (allText.includes('subscription') || allText.includes('too expensive') || allText.includes('just want to pay once')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} One - Lifetime Access`,
                    story: `Users are vocal about hating the subscription model. Build a native, lightweight alternative with no recurring fees. A one-time purchase of $7.99 will convert frustrated users from the incumbent.`,
                    evidence: 'Subscription complaints detected in reviews'
                });
            } else if (allText.includes('complicated') || allText.includes('bloated') || allText.includes('too many features')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} Pure - Minimalist Edition`,
                    story: `Users feel overwhelmed by current features. Build a "Pure" version with 80% less bloat and 100% focus on the core value. No accounts, no distractions.`,
                    evidence: 'Complexity/bloat complaints detected'
                });
            } else if (allText.includes('sync') || allText.includes('lost data') || allText.includes('icloud')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} Safe - Robust Sync`,
                    story: `Users are losing critical data. Build a competitor where bulletproof iCloud sync and local-first data are the top features. Market as "The app that never forgets."`,
                    evidence: 'Data loss/sync complaints detected'
                });
            }

            // --- PATTERN: Spinoff Feature (Gaps/Companions) ---
            if (allText.includes('widget') || allText.includes('home screen')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} Widgets & Icons`,
                    story: `Users want specialized home screen access. Build a companion app that focuses entirely on beautiful, interactive widgets for ${appName}'s data categories.`,
                    evidence: 'Widget requests detected'
                });
            } else if (allText.includes('watch') || allText.includes('apple watch')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} for Apple Watch`,
                    story: `The incumbent's Watch app is missing or poorly made. Build a Watch-first version for quick interactions on the wrist. High visibility in the Watch App Store.`,
                    evidence: 'Watch support requests detected'
                });
            } else if (allText.includes('apple health') || allText.includes('healthkit')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} Health Sync`,
                    story: `Users want better integration with Apple Health. Build a specialized utility that bridges ${appName}'s data with the Health app for automated tracking.`,
                    evidence: 'HealthKit integration requests detected'
                });
            }
        }

        // 5. Select exactly 2 ideas (One Pain, One Feature)
        const selectedIdeas: SpinoffIdea[] = [];

        const painIdea = spinoffIdeas.find(i => i.type === 'pain') || fallbackPain;
        const featureIdea = spinoffIdeas.find(i => i.type === 'feature') || fallbackFeature;

        selectedIdeas.push(painIdea);
        selectedIdeas.push(featureIdea);

        const FinalInsights: ReviewInsightInsert[] = selectedIdeas.map(idea => ({
            app_id: appId,
            insight_type: idea.type === 'feature' ? 'Feature Independence' : '1-Star Review MLP',
            summary: `**${idea.title}** — ${idea.story}`,
            evidence: [idea.evidence],
            frequency: 1,
            sentiment_score: idea.type === 'pain' ? -0.5 : 0.5
        }));

        if (FinalInsights.length > 0) {
            const { error } = await supabase.from('review_insights').insert(FinalInsights);
            if (error) throw error;
            console.log(`    ✅ Stored ${FinalInsights.length} App Store spinoff ideas for ${appName}`);
        }

    } catch (error) {
        console.error(`    ❌ Failed to generate insights:`, error);
        throw error;
    }
}
