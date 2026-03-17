import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../../lib/supabase';

function isAdmin(request: Request): boolean {
  const auth = request.headers.get('x-admin-password');
  return auth === import.meta.env.ADMIN_PASSWORD;
}

/** GET /api/admin/components — list all (inc unpublished) */
export const GET: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '50');
  const search = url.searchParams.get('search') ?? '';

  const supabase = getAdminClient();
  let query = supabase
    .from('components')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (type) query = query.eq('type', type);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ data, count, page, limit }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/** POST /api/admin/components — create */
export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const { type, name, path, description, category, content, featured, published, tags, author, version } = body;

  if (!type || !name || !path) {
    return new Response(JSON.stringify({ error: 'type, name, path are required' }), { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('components')
    .insert({ type, name, path, description, category, content, featured: featured ?? false, published: published ?? true, tags: tags ?? [], author: author ?? 'Consulting 2.0', version: version ?? '1.0.0' })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
