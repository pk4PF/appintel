import { getServerClient } from '../lib/supabase';
import type { ReviewInsightInsert } from '../types/database';

/**
 * THE SPINOFF GOLDMINE ENGINE - APPGAP EDITION
 * 
 * All spinoff ideas are iOS App Store apps, NOT B2B SaaS or web products.
 * Target audience: Solo developers looking to build App Store apps.
 */

interface MarketingStrategy {
    platform: string;
    content_style: string;
    strategy: string;
}

interface Blueprint {
    tech_stack: string[];
    builder_prompts: {
        architecture: string;
        ui_ux: string;
        core_logic: string;
    };
    marketing_playbook: MarketingStrategy[];
}

interface SpinoffIdea {
    type: 'feature' | 'pain';
    title: string;
    story: string;
    evidence: string;
    blueprint: Blueprint;
}

/**
 * Generates story-driven spinoff ideas - ALL ARE APP STORE APPS
 * High-depth blueprint generation.
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

        // --- BLUEPRINT GENERATOR HELPERS ---
        const generateMarketing = (appName: string, theme: string): MarketingStrategy[] => [
            {
                platform: 'Reddit',
                content_style: 'Show & Tell',
                strategy: `Post a video demo in r/iOSsetups. Title: "I built a simple ${theme} for ${appName}. Thoughts?"`
            },
            {
                platform: 'X (Twitter)',
                content_style: 'Build in Public',
                strategy: `Tweet thread: "I noticed ${appName} users wanted [thing]. So I'm building it. One-time $X. Who wants early access?"`
            },
            {
                platform: 'TikTok / Reels',
                content_style: 'Quick Demo',
                strategy: `15-second video of the app in action. Text: "The ${theme} you didn't know you needed."`
            }
        ];

        // FALLBACK IDEAS (If no reviews or patterns match)
        const fallbackPain: SpinoffIdea = {
            type: 'pain',
            title: `${appName} - Pay Once Edition`,
            story: `A simpler version of ${appName} you buy once for $4.99–$9.99. No subscriptions. Works forever.`,
            evidence: 'Many users prefer to pay once and own an app',
            blueprint: {
                tech_stack: ['SwiftUI', 'RevenueCat (for Lifetime IAP)', 'SwiftData', 'iCloud Sync'],
                builder_prompts: {
                    architecture: `Act as a Senior iOS Architect. Design a local-first SwiftUI architecture for a ${appName} alternative. Use SwiftData for storage and RevenueCat for Entitlement management. Explain the sync strategy between devices.`,
                    ui_ux: `Create a 'Dashboard' view in SwiftUI that follows Apple's Bento-box design system. Prioritize visibility of 'Entitlement Status' so users feel the value of their one-time purchase.`,
                    core_logic: `Write the SwiftData models for this app. Ensure they are lightweight. Then, write a manager class that wraps RevenueCat's 'purchase' method to handle 'Lifetime' entitlements specifically.`
                },
                marketing_playbook: generateMarketing(appName, 'Pay-Once Edition')
            }
        };

        const fallbackFeature: SpinoffIdea = {
            type: 'feature',
            title: `${appName} Widgets`,
            story: `A small app ($1.99) that adds beautiful widgets to your Home Screen. See your ${appName} data at a glance without opening the app.`,
            evidence: 'Widget apps are popular on iOS 18',
            blueprint: {
                tech_stack: ['WidgetKit', 'App Intents', 'SwiftUI', 'TimelineProvider'],
                builder_prompts: {
                    architecture: `Design an iOS Widget Extension that communicates with a main container app via App Groups. Explain how the User Defaults share data between the two targets.`,
                    ui_ux: `Create 3 Widget sizes (Small, Medium, Large) for a ${appName} companion. Each must provide 'interactive' buttons using App Intents (e.g. 'Log Data' directly from Home Screen).`,
                    core_logic: `Write the 'TimelineProvider' implementation for this widget. It should refresh every 15 minutes or when an App Intent is triggered. Include the code for the App Intent that updates the shared storage.`
                },
                marketing_playbook: [
                    {
                        platform: 'X (Tech Community)',
                        content_style: 'Interactive Demo',
                        strategy: `Screen recording showing the widget on the iOS 18 Home Screen. Caption: "Check your ${appName} data without opening the app! 🍎"`
                    },
                    ...generateMarketing(appName, 'Widgets')
                ]
            }
        };

        // Process reviews if available
        if (reviews && reviews.length > 0) {
            const allText = reviews.map(r => `${r.title || ''} ${r.review_text || ''}`).join(' ').toLowerCase();

            // --- PATTERN: Subscription Alternative ---
            if (allText.includes('subscription') || allText.includes('too expensive') || allText.includes('just want to pay once')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} - Pay Once`,
                    story: `People love ${appName} but hate the subscription. Build the same core features for a one-time $7.99 purchase.`,
                    evidence: 'Reviews mention wanting to pay once',
                    blueprint: {
                        tech_stack: ['SwiftUI', 'StoreKit 2', 'Supabase Auth', 'TipKit'],
                        builder_prompts: {
                            architecture: `Build a 'Focus-First' architecture. Help users transition from ${appName} by focusing on the absolute essentials. use TipKit to teach them the new UI.`,
                            ui_ux: `Design a 'Pay once, use forever' splash screen. Focus on the value of simplicity and ownership. Make the 'Purchase' button massive and satisfying to tap.`,
                            core_logic: `Implement the StoreKit 2 'Transaction.currentEntitlements' logic to check for lifetime access. Add a backup check against a Supabase DB to ensure cross-device consistency.`
                        },
                        marketing_playbook: generateMarketing(appName, 'Pay-Once Alternative')
                    }
                });
            } else if (allText.includes('complicated') || allText.includes('bloated') || allText.includes('too many features')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} Lite`,
                    story: `A stripped-down version of ${appName}. Just the one feature people use most. No accounts, no clutter.`,
                    evidence: 'Reviews say it has too many features',
                    blueprint: {
                        tech_stack: ['SwiftUI', 'App Storage (Local)', 'SF Symbols 6', 'SwiftCharts'],
                        builder_prompts: {
                            architecture: `Design a 'Zero-Hassle' architecture. Everything stays on the device for maximum speed. Explain how to use @AppStorage for all persistence.`,
                            ui_ux: `Create a UI inspired by Apple's 'Notes' or 'Journal' app. Use SF Symbols 6 heavily. The goal is a light, native feel. 1 Tab only.`,
                            core_logic: `Build a highly efficient data-to-chart logic using SwiftCharts. Show how the core value of ${appName} can be visualized in a single, beautiful view without complex menus.`
                        },
                        marketing_playbook: [
                            {
                                platform: 'Product Hunt',
                                content_style: 'Simple Comparison',
                                strategy: `Show ${appName} (feature-rich) vs ${appName} Lite (just the basics). Target the "less is more" crowd.`
                            },
                            ...generateMarketing(appName, 'Lite Version')
                        ]
                    }
                });
            } else if (allText.includes('sync') || allText.includes('lost data') || allText.includes('icloud')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} - Never Lose Data`,
                    story: `People complain about losing data. Build a version where sync "just works." Your selling point: it never loses your stuff.`,
                    evidence: 'Reviews mention data loss or sync issues',
                    blueprint: {
                        tech_stack: ['CloudKit', 'Core Data / SwiftData', 'Offline-First Architecture', 'NSPersistentCloudKitContainer'],
                        builder_prompts: {
                            architecture: `Explain the deep integration of NSPersistentCloudKitContainer. Design a logic to handle 'Merge Conflicts' automatically so users never lose data.`,
                            ui_ux: `Show a 'Sync Status' indicator in the main navigation. It should pulse green when saved to iCloud. Peace of mind is the primary UX goal.`,
                            core_logic: `Write a Swift class that monitors 'CloudKit' notifications. If sync fails, trigger a local backup export (to Files app) automatically as a safety net.`
                        },
                        marketing_playbook: generateMarketing(appName, 'Reliable Sync')
                    }
                });
            }

            // --- PATTERN: Companion Apps ---
            if (allText.includes('widget') || allText.includes('home screen')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} Widgets`,
                    story: `People want widgets. Build an app that just does widgets for ${appName}'s main features. Sell it for $1.99.`,
                    evidence: 'Reviews ask for widget support',
                    blueprint: {
                        tech_stack: ['WidgetKit', 'Configuration Intents', 'SwiftUI Static Views', 'App Groups'],
                        builder_prompts: {
                            architecture: `Build a 'Multi-Target' workspace. Container App for settings + Widget Extension for display. Shared App Group for common data.`,
                            ui_ux: `Create a 'Widget Gallery' in the main app where users can customize background colors and font styles for their widgets.`,
                            core_logic: `Write a helper that fetches JSON from a public endpoint and caches it for the Widget to read.`
                        },
                        marketing_playbook: generateMarketing(appName, 'Widgets')
                    }
                });
            } else if (allText.includes('watch') || allText.includes('apple watch')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} for Apple Watch`,
                    story: `People want it on their Watch. Build a simple Watch app that lets them check and log data from their wrist.`,
                    evidence: 'Reviews ask for Apple Watch support',
                    blueprint: {
                        tech_stack: ['watchOS SDK', 'SwiftUI for Watch', 'Complications', 'WatchConnectivity'],
                        builder_prompts: {
                            architecture: `Design a 'Standalone' Watch app that can also sync with an iPhone via WatchConnectivity. Explain how to handle 'Complication' updates in the background.`,
                            ui_ux: `Focus on 'Digital Crown' interactions. Use the Crown to scroll through lists or metrics. One-tap 'Log' buttons only.`,
                            core_logic: `Implement 'WCSession' to pass credentials from iPhone to Watch. Then, build the background task logic to update Complications every 30 minutes.`
                        },
                        marketing_playbook: [
                            {
                                platform: 'Apple Watch Subreddits',
                                content_style: 'Show & Tell',
                                strategy: `Photo of your Watch app. Title: "I built a simple Watch companion for ${appName}. Check your data from your wrist!"`
                            },
                            ...generateMarketing(appName, 'Watch App')
                        ]
                    }
                });
            }
            else if (allText.includes('apple health') || allText.includes('healthkit')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} Health Sync`,
                    story: `Users want better integration with Apple Health. Build a specialized utility that bridges ${appName}'s data with the Health app for automated tracking.`,
                    evidence: 'HealthKit integration requests detected',
                    blueprint: {
                        tech_stack: ['HealthKit', 'Background Tasks', 'Apple Health Dashboards', 'Push Notifications'],
                        builder_prompts: {
                            architecture: `Design an observer-based architecture. When ${appName} (or its imitation) updates, push that data directly to HealthKit using HKObserverQuery.`,
                            ui_ux: `Create a 'Permission Dashboard' where users toggle which Health metrics (Steps, Heart Rate, etc.) bridge into your app. Clean, medical-grade aesthetic.`,
                            core_logic: `Write the 'HealthKitManager' to handle writing to HealthKit specifically for 'Category' and 'Quantity' types. Include the error handling for 'User Denied' permissions.`
                        },
                        marketing_playbook: generateMarketing(appName, 'HealthKit Bridge')
                    }
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
            sentiment_score: idea.type === 'pain' ? -0.5 : 0.5,
            blueprint: idea.blueprint as any
        }));

        if (FinalInsights.length > 0) {
            const { error } = await supabase.from('review_insights').insert(FinalInsights);
            if (error) throw error;
            console.log(`    ✅ Stored 2 high-depth AppGap blueprints for ${appName}`);
        }

    } catch (error) {
        console.error(`    ❌ Failed to generate insights for ${appId}:`, error);
        throw error;
    }
}
