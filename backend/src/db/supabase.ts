import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

let supabase: SupabaseClient;

try {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) throw new Error('Missing env vars');

  supabase = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
  console.log('[Supabase] Connected to', url);
} catch {
  console.warn('[Supabase] Not configured — running in demo mode without database');
  const mockResponse = { data: null, error: null, count: 0 };
  const mockChain: any = new Proxy({}, {
    get: () => (..._args: any[]) => mockChain,
  });
  mockChain.then = (resolve: any) => resolve(mockResponse);
  supabase = { from: () => mockChain, channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }), removeChannel: () => {} } as any;
}

export { supabase };
