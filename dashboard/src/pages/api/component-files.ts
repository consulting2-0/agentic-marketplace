import type { APIRoute } from 'astro';
import { fetchComponents, originFromRequest } from '../../lib/data';

// Sub-files (skill references etc.) live in this repo under cli-tool/components/.
// Serve them from the public raw GitHub content — same source of truth as the
// catalog — instead of the Supabase component_files table (which isn't in sync).
const RAW_BASE = 'https://raw.githubusercontent.com/consulting2-0/agentic-marketplace/main/cli-tool/components';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const componentPath = url.searchParams.get('componentPath');
  const file = url.searchParams.get('file');

  if (!componentPath || !file) {
    return new Response(JSON.stringify({ error: 'componentPath and file are required' }), { status: 400 });
  }
  // Path-traversal guard.
  if (file.includes('..') || componentPath.includes('..')) {
    return new Response('Invalid path', { status: 400 });
  }

  try {
    const data = await fetchComponents(originFromRequest(request));
    const cleanReq = componentPath.replace(/\.(md|json)$/, '');

    // Locate the component (and its type) in the catalog.
    let component: any = null;
    let typePlural = '';
    for (const [type, items] of Object.entries(data) as [string, any][]) {
      if (!Array.isArray(items)) continue;
      const match = items.find((c: any) => (c.path?.replace(/\.(md|json)$/, '') ?? '') === cleanReq);
      if (match) { component = match; typePlural = type; break; }
    }
    if (!component) {
      return new Response(`Component not found: ${componentPath}`, { status: 404 });
    }

    // Only allow files that are declared references (security + correctness).
    const refs: string[] = component.references ?? [];
    if (!refs.includes(file)) {
      return new Response(`File not found: ${file}`, { status: 404 });
    }

    const rawUrl = `${RAW_BASE}/${typePlural}/${cleanReq}/${file}`;
    const res = await fetch(rawUrl);
    if (!res.ok) {
      return new Response(`File not found: ${file}`, { status: 404 });
    }
    const text = await res.text();
    const isJson = file.endsWith('.json');
    return new Response(text, {
      headers: {
        'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e: any) {
    return new Response(`Error loading file: ${e?.message ?? 'unknown'}`, { status: 500 });
  }
};
