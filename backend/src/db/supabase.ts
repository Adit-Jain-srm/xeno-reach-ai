import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;

// Hardcode the URL since it's not a secret — only the key needs to be in env
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fezjpfcrikzirfypjjcp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

console.error(`[Supabase Init] URL=${SUPABASE_URL.substring(0, 20)}... KEY=${SUPABASE_KEY ? 'present(' + SUPABASE_KEY.length + ')' : 'MISSING'}`);
console.error(`[Supabase Init] All env keys: ${Object.keys(process.env).filter(k => k.includes('SUPA')).join(', ') || 'NONE with SUPA'}`);

try {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY not set');

  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
  console.error('[Supabase] Connected successfully to ' + SUPABASE_URL);
} catch (err) {
  console.error('[Supabase] FAILED:', (err as Error).message);
  console.error('[Supabase] Running in demo mode without database');
  const mockChain: any = new Proxy({}, {
    get: () => (..._args: any[]) => mockChain,
  });
  mockChain.then = (resolve: any) => resolve({ data: null, error: null, count: 0 });
  supabase = { from: () => mockChain, channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }), removeChannel: () => {} } as any;
}

export { supabase };
