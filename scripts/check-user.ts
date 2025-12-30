import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkUser() {
    const adminEmail = process.env.ADMIN_EMAILS || '';
    console.log('--- Auth Audit ---');
    console.log('Target Email (from .env):', adminEmail);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('❌ Error listing users:', error.message);
        return;
    }

    const user = users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

    if (!user) {
        console.log('\n❌ USER NOT FOUND in Supabase Auth.');
        console.log('You need to SIGN UP first on the website before you can log in.');
        return;
    }

    console.log('\n✅ USER FOUND');
    console.log('ID:', user.id);
    console.log('Email Confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
    console.log('Is Premium (Metadata):', user.user_metadata?.is_premium ? 'YES' : 'NO');
    console.log('Last Sign In:', user.last_sign_in_at || 'Never');

    if (!user.email_confirmed_at) {
        console.log('\n⚠️ ACTION REQUIRED: Confirm your email or manually confirm it in Supabase dashboard.');
    }
}

checkUser();
