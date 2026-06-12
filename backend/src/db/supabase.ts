import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

console.log(`[Supabase] ENV check: SUPABASE_URL=${url ? url.substring(0, 30) + '...' : 'NOT SET'}, KEY=${key ? 'SET (' + key.length + ' chars)' : 'NOT SET'}`);

try {
  if (!url || !key) throw new Error('Missing env vars');

  supabase = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
  console.log('[Supabase] Connected successfully');
} catch (err) {
  console.warn('[Supabase] Not configured —', (err as Error).message);
  const mockChain: any = new Proxy({}, {
    get: () => (..._args: any[]) => mockChain,
  });
  mockChain.then = (resolve: any) => resolve({ data: null, error: null, count: 0 });
  supabase = { from: () => mockChain, channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }), removeChannel: () => {} } as any;
}

export { supabase };
