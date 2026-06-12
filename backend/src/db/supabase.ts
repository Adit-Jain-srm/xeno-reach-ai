import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
} else {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — using mock client');
  // Create a no-op proxy that won't crash the server on startup
  supabase = new Proxy({} as SupabaseClient, {
    get: (_target, prop) => {
      if (prop === 'from') {
        return () => new Proxy({}, {
          get: () => () => Promise.resolve({ data: null, error: { message: 'Supabase not configured', code: 'NOT_CONFIGURED' }, count: 0 }),
        });
      }
      return () => ({});
    },
  });
}

export { supabase };
