import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function test() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        console.error('❌ OPENAI_API_KEY not found in .env.local');
        return;
    }
    console.log('✅ Found API Key (starts with: ' + key.substring(0, 7) + '...)');
    
    const openai = new OpenAI({ apiKey: key });
    try {
        console.log('⏳ Sending test request to GPT-4o-mini...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say 'LLM is active!'" }],
        });
        console.log('🚀 Response:', completion.choices[0].message.content);
        console.log('\n✨ Everything is ready. You can now run the master quality script!');
    } catch (e: any) {
        console.error('❌ OpenAI request failed:', e.message);
    }
}

test();
