import { getServerClient } from '../src/lib/supabase';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CATEGORIES = [
    'medical',
    'health-fitness',
    'productivity',
    'utilities',
    'finance',
    'lifestyle',
    'photo-video',
    'education',
    'entertainment',
    'social-networking',
    'shopping'
];

async function ensureCategories() {
    console.log('Checking categories...');
    const supabase = getServerClient();

    for (const slug of CATEGORIES) {
        const { data, error } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!data && (!error || error.code === 'PGRST116')) {
            console.log(`Creating missing category: ${slug}`);
            const name = slug.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .replace('And', '&'); // Health And Fitness -> Health & Fitness

            await supabase.from('categories').insert({
                slug,
                name,
                description: `${name} apps and tools`
            });
        } else {
            console.log(`Category exists: ${slug}`);
        }
    }
}

ensureCategories().catch(console.error);
