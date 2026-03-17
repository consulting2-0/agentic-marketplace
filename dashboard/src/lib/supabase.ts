import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

/** Public client — respects RLS, safe for client-side */
export function getPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Admin client — bypasses RLS, server-side only */
export function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
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
