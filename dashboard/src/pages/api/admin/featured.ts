import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

function isAdmin(request: Request): boolean {
  return request.headers.get('x-admin-password') === import.meta.env.ADMIN_PASSWORD;
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('featured_items')
    .select('*')
    .order('position');
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });
  const body = await request.json();
  if (!body.name) return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('featured_items').insert(body).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
