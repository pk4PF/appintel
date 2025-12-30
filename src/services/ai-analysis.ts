import OpenAI from 'openai';
import { getServerClient } from '../lib/supabase';

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) return null;
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

export interface AISpinoffIdea {
    title: string;
    story: string;
    evidence: string;
    type: 'pain' | 'feature';
    blueprint: {
        tech_stack: string[];
        builder_prompts: {
            architecture: string;
            ui_ux: string;
            core_logic: string;
        };
        marketing_playbook: Array<{
            platform: string;
            content_style: string;
            strategy: string;
        }>;
    };
}

/**
 * GENERATE HIGH-QUALITY SPINOFFS USING AI
 * This is the "Brain" that ensures apps "do what they say" and "spinoffs are accurate"
 */
export async function generateSpinoffsWithAI(
    appName: string,
    appDescription: string,
    reviews: string[]
): Promise<AISpinoffIdea[]> {
    const openai = getOpenAIClient();
    if (!openai) {
        throw new Error('OPENAI_API_KEY is missing. Add it to .env.local for high-quality analysis.');
    }

    const prompt = `
Act as a Silicon Valley Venture Studio Founder and a shark-like Indie Hacker.
I will give you data about an existing iOS app: Name, Description, and User Reviews.

Your goal is to identify TWO high-intensity "App Bangers" (spinoff ideas) that are mathematically more likely to convert browsers into paying customers.

STRATEGY SHIFT:
Avoid generic "Simpler version" or "Pay once" ideas. Those are low-intent traps.
Instead, focus on:
1. UNBUNDLING: Take ONE "power feature" that users are obsessed with from a bloated app and turn it into a dedicated pro tool.
2. VERTICALIZATION: Take a general tool and rebuild it specifically for ONE high-intent professional niche (e.g., instead of a general "Planner", build "The Planner for Traveling Nurses").
3. WORKFLOW INTEGRATION: Build an app that solves a specific "Money-losing" or "Time-wasting" step in a user's professional life.

APP DATA:
Name: ${appName}
Description: ${appDescription}
Reviews:
${reviews.join('\n---\n')}

OUTPUT FORMAT:
Return a JSON array with exactly two objects. Each object must follow this structure:
{
  "type": "pain" | "feature",
  "title": "Short punchy name for the spinoff",
  "story": "The 'Angle': Why users will feel STUPID if they don't buy this. What is the specific monetizable outcome?",
  "evidence": "Which specific review or description gap proves there is UNMET demand for this vertical?",
  "blueprint": {
    "tech_stack": ["SwiftUI", "Firebase", etc.],
    "builder_prompts": {
      "architecture": "The high-performance core architecture",
      "ui_ux": "Focus on high-intensity efficiency vs bloated competitors",
      "core_logic": "How to implement the 'killer feature'"
    },
    "marketing_playbook": [
      { "platform": "Twitter/TikTok/etc", "content_style": "High-hooks content", "strategy": "The exact viral angle to use" }
    ]
  }
}

CRITICAL RULES:
1. MONETIZATION FIRST: The idea must be something users would pay $9.99/mo or $49/year for.
2. NO GENERIC IDEAS: If it sounds like "Just another habit tracker," it's a fail. It must be specialized.
3. iOS ONLY: Use native iOS features (Widgets, Live Activities, App Intents).
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and high quality for this task
        messages: [
            { role: 'system', content: 'You are an expert iOS app strategist.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) return [];

    try {
        const parsed = JSON.parse(content);
        // Expecting { spinoffs: [...] } or just the array depending on how it interpreted "json_object"
        // Most reliable is to wrap it.
        return parsed.spinoffs || parsed.ideas || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);
    } catch (e) {
        console.error('Failed to parse AI response:', e);
        return [];
    }
}

/**
 * CLEAN APP DESCRIPTION & IDENTIFY CORE VALUE
 * Ensures apps "do what they say" by boiling down long marketing text to a sharp summary
 */
export async function cleanAppDescription(name: string, description: string) {
    const openai = getOpenAIClient();
    if (!openai) return null;

    const prompt = `
Summarize this iOS app's core value in one sharp sentence. 
Also identify exactly WHO the target user is.

App Name: ${name}
Description: ${description}

JSON Output: { "summary": "...", "target_user": "..." }
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
}
