import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET() {
  const checks = {
    api: true,
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connection
    const supabase = getServerClient();
    const { error } = await supabase.from('categories').select('id').limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  const healthy = checks.api && checks.database;

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}

