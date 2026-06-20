import type { APIRoute } from 'astro';

// TEMPORARY diagnostic — reports only presence + length of env vars, never values.
// Remove after debugging admin login.
export const GET: APIRoute = async () => {
  const rt = typeof process !== 'undefined' ? process.env : ({} as Record<string, string | undefined>);
  const im = import.meta.env as Record<string, string | undefined>;
  const info = {
    runtime_admin_set: !!rt.ADMIN_PASSWORD,
    runtime_admin_len: rt.ADMIN_PASSWORD ? String(rt.ADMIN_PASSWORD).length : 0,
    build_admin_set: !!im.ADMIN_PASSWORD,
    build_admin_len: im.ADMIN_PASSWORD ? String(im.ADMIN_PASSWORD).length : 0,
    supabase_url_set: !!(rt.SUPABASE_URL || im.SUPABASE_URL),
    service_key_set: !!(rt.SUPABASE_SERVICE_ROLE_KEY || im.SUPABASE_SERVICE_ROLE_KEY),
    vercel_env: rt.VERCEL_ENV ?? null,
  };
  return new Response(JSON.stringify(info, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
