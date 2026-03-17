import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../../lib/supabase';

function isAdmin(request: Request): boolean {
  return request.headers.get('x-admin-password') === import.meta.env.ADMIN_PASSWORD;
}

/** PUT /api/admin/components/:id — update */
export const PUT: APIRoute = async ({ request, params }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const body = await request.json();

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('components')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};

/** DELETE /api/admin/components/:id */
export const DELETE: APIRoute = async ({ request, params }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const supabase = getAdminClient();
  const { error } = await supabase.from('components').delete().eq('id', id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
};
