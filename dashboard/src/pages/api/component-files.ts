import type { APIRoute } from 'astro';
import { getAdminClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const componentPath = url.searchParams.get('componentPath');
  const file = url.searchParams.get('file');

  if (!componentPath) {
    return new Response(JSON.stringify({ error: 'componentPath is required' }), { status: 400 });
  }

  const supabase = getAdminClient();

  // Try exact path, then with .md / .json extension — use .in() to avoid or() syntax issues
  const { data: components } = await supabase
    .from('components')
    .select('id')
    .in('path', [componentPath, `${componentPath}.md`, `${componentPath}.json`])
    .limit(1);

  const component = components?.[0];

  if (!component) {
    return new Response(JSON.stringify({ error: `Component not found: ${componentPath}` }), { status: 404 });
  }

  if (file) {
    const { data, error } = await supabase
      .from('component_files')
      .select('content, file_type')
      .eq('component_id', component.id)
      .eq('file_path', file)
      .single();

    if (error || !data) {
      return new Response(`File not found: ${file}`, { status: 404 });
    }

    const contentType = data.file_type === 'json' ? 'application/json' : 'text/plain; charset=utf-8';
    return new Response(data.content, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300' },
    });
  }

  const { data: files, error: filesError } = await supabase
    .from('component_files')
    .select('file_path, file_type')
    .eq('component_id', component.id)
    .order('file_path');

  if (filesError) {
    return new Response(JSON.stringify({ error: filesError.message }), { status: 500 });
  }

  return new Response(JSON.stringify(files ?? []), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
};
