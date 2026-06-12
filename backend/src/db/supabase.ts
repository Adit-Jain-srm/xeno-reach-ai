import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

let supabase: SupabaseClient;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fezjpfcrikzirfypjjcp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

try {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY not set');

  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' },
    realtime: { transport: ws as any },
  });
  console.error('[Supabase] Connected to ' + SUPABASE_URL);
} catch (err) {
  console.error('[Supabase] FAILED:', (err as Error).message);
  const mockChain: any = new Proxy({}, {
    get: () => (..._args: any[]) => mockChain,
  });
  mockChain.then = (resolve: any) => resolve({ data: null, error: null, count: 0 });
  supabase = { from: () => mockChain, channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }), removeChannel: () => {} } as any;
}

export { supabase };
