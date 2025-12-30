import { getServerClient } from '../lib/supabase';
import type { ReviewInsightInsert } from '../types/database';
import { generateSpinoffsWithAI, AISpinoffIdea } from './ai-analysis';

/**
 * THE SPINOFF GOLDMINE ENGINE - APPINTEL EDITION
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

        if (!appData) throw new Error('App not found');

        // 2. Fetch negative/neutral reviews
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating, title, review_text')
            .eq('app_id', appId)
            .lte('rating', 3)
            .order('rating', { ascending: true })
            .limit(50);

        const reviewTexts = (reviews || []).map(r => `${r.title || ''}: ${r.review_text || ''}`);

        let selectedIdeas: AISpinoffIdea[] = [];

        // 3. TRY AI GENERATION FIRST
        if (process.env.OPENAI_API_KEY) {
            try {
                selectedIdeas = await generateSpinoffsWithAI(
                    appData.name,
                    appData.description || '',
                    reviewTexts
                );
                console.log(`    ✨ AI generated ${selectedIdeas.length} unique spinoffs.`);
            } catch (aiError) {
                console.error('    ⚠️ AI Generation failed, falling back to patterns:', aiError);
            }
        }

        // 4. FALLBACK TO PATTERNS (If AI fails or no key)
        if (selectedIdeas.length === 0) {
            const appName = appData.name?.split(/[-–:]/)[0]?.trim() || 'this app';
            const allText = reviewTexts.join(' ').toLowerCase();

            const spinoffIdeas: AISpinoffIdea[] = [];

            // --- PATTERN: Subscription Alternative (The "Indie Classic") ---
            if (allText.includes('subscription') || allText.includes('expensive') || allText.includes('monthly') || appData.pricing_model === 'subscription') {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} - Pay Once`,
                    story: `A high-performance alternative to ${appName} with a one-time $7.99 purchase. Same core features, zero recurring costs, 100% ownership.`,
                    evidence: 'Users are increasingly fatigued by subscription models in this category.',
                    blueprint: {
                        tech_stack: ['SwiftUI', 'StoreKit 2', 'SwiftData', 'iCloud Sync'],
                        builder_prompts: {
                            architecture: `Build a local-first SwiftUI app. Use StoreKit 2 for one-time Lifetime IAP. Focus on ultra-fast startup and data persistence via SwiftData.`,
                            ui_ux: `Design a 'Premium & Minimal' dashboard. Use Apple's 'Bento Box' layout. Highlight the 'Purchased' status to reinforce value.`,
                            core_logic: `Implement an offline-first sync engine. Cache all user data locally and use iCloud to keep devices in sync without a custom backend.`
                        },
                        marketing_playbook: [{ platform: 'Reddit (r/iosapp)', content_style: 'Direct Comparison', strategy: 'Show ${appName} subscription costs vs your one-time price. Be the hero.' }]
                    }
                });
            }

            // --- PATTERN: Lite/Bloatware Fix ---
            if (allText.includes('complicated') || allText.includes('slow') || allText.includes('bloated') || allText.includes('too many')) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} Lite`,
                    story: `The fastest way to do one thing: [Core Feature]. Strips away the bloat of ${appName} for a focused, single-purpose experience.`,
                    evidence: 'Reviews suggest the current app has become too complex for simple tasks.',
                    blueprint: {
                        tech_stack: ['SwiftUI', 'SF Symbols 6', 'AppStorage'],
                        builder_prompts: {
                            architecture: `Design a 'Instant-On' architecture. No loading screens, no login required. All state managed via @AppStorage for simplicity.`,
                            ui_ux: `One-screen interface. Use massive SF Symbols for primary actions. Animations must be under 200ms for that 'snappy' feel.`,
                            core_logic: `Optimize the main action path. If ${appName} takes 5 taps, this must take 1. Document the tap-to-value optimization.`
                        },
                        marketing_playbook: [{ platform: 'X (Twitter)', content_style: 'Before/After Video', strategy: 'Screen record the long flow in ${appName} vs your 1-tap solution. Caption: "Life is too short."' }]
                    }
                });
            }

            // --- PATTERN: Widget Companion ---
            if (allText.includes('widget') || allText.includes('home screen') || allText.includes('glance')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `${appName} Widgets Pro`,
                    story: `A dedicated widget suite for ${appName} users. Track your metrics directly on the Home Screen and Lock Screen with interactive iOS 18 widgets.`,
                    evidence: 'Users want to see data without digging through deep menus.',
                    blueprint: {
                        tech_stack: ['WidgetKit', 'App Intents', 'TimelineProvider'],
                        builder_prompts: {
                            architecture: `Create a Widget Extension that shares data with ${appName} via App Groups or reads from a shared JSON API.`,
                            ui_ux: `Design 3 distinct widget sizes. Use vibrant gradients and clear typography that stays readable even at small sizes.`,
                            core_logic: `Implement Interactive Widgets using App Intents. Allow users to 'Log' or 'Update' data without ever opening the container app.`
                        },
                        marketing_playbook: [{ platform: 'Instagram/TikTok', content_style: 'Aesthetic Setup', strategy: 'Show a beautiful iOS setup featuring your widgets. Use trending lo-fi music.' }]
                    }
                });
            }

            // --- PATTERN: Gamification ---
            if (allText.includes('boring') || allText.includes('motivation') || allText.includes('hard to stick')) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `Quest for ${appName}`,
                    story: `Turns ${appName} into a RPG. Earn XP, level up your character, and unlock gear as you complete your tasks.`,
                    evidence: 'Many users struggle with long-term retention and motivation in this niche.',
                    blueprint: {
                        tech_stack: ['SwiftUI', 'SpriteKit (Optional)', 'GameKit'],
                        builder_prompts: {
                            architecture: `Merge a productivity tracker with a GameKit-backed leveling system.`,
                            ui_ux: `Pixel art or high-fantasy aesthetic. Progress bars should look like health bars. Notifications should feel like loot drops.`,
                            core_logic: `Design an XP algorithm that scales with task difficulty. Include a 'Streaks' system that offers rare rewards for consistent use.`
                        },
                        marketing_playbook: [{ platform: 'Reddit (r/gamification)', content_style: 'Progress Update', strategy: 'I turned my boring tasks into a dungeon crawler. Who wants to play-test?' }]
                    }
                });
            }

            // --- DEFAULTS (Ensure we always have 2) ---
            if (spinoffIdeas.length < 2) {
                spinoffIdeas.push({
                    type: 'pain',
                    title: `${appName} - Privacy First`,
                    story: `A secure, local-only version of ${appName}. No cloud sync, no tracking, no data mining. Your data stays on your iPhone.`,
                    evidence: 'Privacy-conscious users are looking for local alternatives to cloud-heavy apps.',
                    blueprint: {
                        tech_stack: ['SwiftUI', 'SwiftData', 'Local Authentication (FaceID)'],
                        builder_prompts: {
                            architecture: `Strictly local-first. Disable all network capabilities. Use FaceID/TouchID for app-level locking.`,
                            ui_ux: `Clean, 'System' look and feel. Use monochromatic themes to convey security and utility.`,
                            core_logic: `Implement an encrypted SwiftData store. Provide an 'Emergency Delete' feature and local-only backup to Files app.`
                        },
                        marketing_playbook: [{ platform: 'Hacker News / X', content_style: 'Technical deep-dive', strategy: 'Explain why cloud is the enemy of privacy and how your app is built to be a vault.' }]
                    }
                });
            }
            if (spinoffIdeas.length < 2) {
                spinoffIdeas.push({
                    type: 'feature',
                    title: `Shortcuts for ${appName}`,
                    story: `A power-user utility that adds deep Apple Shortcuts support to ${appName}. Automate your workflow with Siri and Automations.`,
                    evidence: 'Power users in this niche are asking for better automation capabilities.',
                    blueprint: {
                        tech_stack: ['App Intents', 'Shortcuts SDK', 'SwiftUI'],
                        builder_prompts: {
                            architecture: `Focus entirely on the App Intents framework. Every feature of the app should be a Shortcut action.`,
                            ui_ux: `Focused on 'Configuration' views. Help users build their first automation within your app's onboarding.`,
                            core_logic: `Deep-link into ${appName} or interact via a shared database. Provide 'Parameters' for all Shortcut actions for maximum flexibility.`
                        },
                        marketing_playbook: [{ platform: 'MacStories / X', content_style: 'Automation Guide', strategy: 'Show a complex automation (e.g. "When I wake up, do X in ${appName}") made possible by your app.' }]
                    }
                });
            }

            selectedIdeas = spinoffIdeas.slice(0, 2);
        }

        // 5. CLEAR OLD INSIGHTS & STORE NEW ONES
        await supabase.from('review_insights').delete().eq('app_id', appId);

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
            console.log(`    ✅ Stored ${FinalInsights.length} high-quality insights for ${appData.name}`);
        }

    } catch (error) {
        console.error(`    ❌ Failed to generate insights for ${appId}:`, error);
        throw error;
    }
}
