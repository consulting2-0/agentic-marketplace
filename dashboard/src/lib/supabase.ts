import { createClient } from '@supabase/supabase-js';

// Read at RUNTIME (process.env) first, falling back to build-time import.meta.env,
// so env vars set in Vercel take effect on redeploy and aren't inlined as
// undefined at build time.
function envVar(key: string): string | undefined {
  const p = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)[key] : undefined;
  return p ?? (import.meta.env as Record<string, string | undefined>)[key];
}

function supabaseUrl(): string | undefined {
  return envVar('SUPABASE_URL') || envVar('PUBLIC_SUPABASE_URL');
}

/** Public client — respects RLS, safe for client-side */
export function getPublicClient() {
  const url = supabaseUrl();
  const anon = envVar('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anon) {
    throw new Error('Supabase is not configured: missing SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anon);
}

/** Admin client — bypasses RLS, server-side only */
export function getAdminClient() {
  const url = supabaseUrl();
  const serviceKey = envVar('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error('Supabase admin is not configured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in this environment');
  }
  return createClient(url, serviceKey);
}

export type ComponentRow = {
  id: string;
  type: 'skill' | 'agent' | 'command' | 'hook' | 'mcp' | 'setting' | 'template';
  name: string;
  path: string;
  description: string | null;
  category: string | null;
  content: string | null;
  downloads: number;
  featured: boolean;
  published: boolean;
  platform: 'claude' | 'joule' | 'both';
  tags: string[];
  author: string;
  version: string;
  created_at: string;
  updated_at: string;
};

export type ComponentFileRow = {
  id: string;
  component_id: string;
  file_path: string;
  content: string;
  file_type: string;
  created_at: string;
  updated_at: string;
};
