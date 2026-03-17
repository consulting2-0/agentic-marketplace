import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { type, path } = params;
  if (!type || !path) {
    return new Response('Not found', { status: 404 });
  }

  const supabase = getAdminClient();

  // Try with and without extension
  const paths = [path, `${path}.md`, `${path}.json`];

  const { data, error } = await supabase
    .from('components')
    .select('name, type, path, content, downloads')
    .in('path', paths)
    .eq('published', true)
    .limit(1)
    .single();

  if (error || !data) {
    return new Response('Component not found', { status: 404 });
  }

  // Increment download count (fire and forget)
  supabase
    .from('components')
    .update({ downloads: (data.downloads ?? 0) + 1 })
    .eq('path', data.path)
    .then(() => {});

  const isJson = data.path.endsWith('.json') || ['mcp', 'setting', 'hook'].includes(data.type);
  const ext = isJson ? 'json' : 'md';
  const filename = data.path.split('/').pop()?.replace(/\.(md|json)$/, '') ?? data.name;

  return new Response(data.content ?? '', {
    headers: {
      'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.${ext}"`,
      'Cache-Control': 'no-store',
    },
  });
};
