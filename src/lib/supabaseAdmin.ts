// src/lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  const details = `Missing Supabase admin env:
  NEXT_PUBLIC_SUPABASE_URL: ${url ? 'set' : 'undefined'}
  SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? 'set' : 'undefined'}
  Add them to .env.local (service key is server-only).`;
  throw new Error(details);
}

export const supabaseAdmin: SupabaseClient<any> = createClient(url, serviceKey);

