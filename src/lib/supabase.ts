import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a more permissive type for now until proper schema generation is set up
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = SupabaseClient<any, 'public', any>;

// Client-side Supabase client (uses anon key)
export function createBrowserClient(): SupabaseClientAny {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server-side Supabase client (uses service role key for admin operations)
export function createServerClient(): SupabaseClientAny {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Singleton for server-side operations
let serverClient: SupabaseClientAny | null = null;

export function getServerClient(): SupabaseClientAny {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}
