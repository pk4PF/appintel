
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkData() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { count: totalApps } = await supabase.from('apps').select('*', { count: 'exact', head: true });

    // Check apps with reviews
    const { count: appsWithReviews } = await supabase
        .from('apps')
        .select('id, reviews!inner(id)', { count: 'exact', head: true });

    // Check total reviews count
    const { count: totalReviews } = await supabase.from('reviews').select('*', { count: 'exact', head: true });

    console.log('--- Database Status ---');
    console.log(`Total Apps in DB: ${totalApps}`);
    console.log(`Apps WITH Reviews: ${appsWithReviews}`);
    console.log(`Total Review Records: ${totalReviews}`);
    console.log('-----------------------');
}

checkData();
