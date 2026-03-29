import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a mock client for build time or when env vars aren't set
    console.warn('Supabase credentials not configured');
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-key'
  );
}
