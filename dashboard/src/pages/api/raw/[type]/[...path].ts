import type { APIRoute } from 'astro';
import { fetchComponents } from '../../../../lib/data';
import type { Component } from '../../../../lib/types';

export const GET: APIRoute = async ({ params }) => {
  const { type, path } = params;
  if (!type || !path) {
    return new Response('Not found', { status: 404 });
  }

  // Match the same lookup the component detail page uses (static components.json,
  // the site's source of truth). The Supabase table is not guaranteed in sync.
  const requested = path.replace(/\.(md|json)$/, '');
  const typeKey = type.endsWith('s') ? type : `${type}s`;

  let component: Component | null = null;
  try {
    const data = await fetchComponents(new URL(request.url).origin);
    const items = (data as any)[typeKey] as Component[] | undefined;
    if (items) {
      component =
        items.find((c) => {
          const clean = c.path?.replace(/\.(md|json)$/, '') ?? '';
          return clean === requested || c.name === requested;
        }) ?? null;
    }
  } catch {
    return new Response('Failed to load components', { status: 500 });
  }

  if (!component || !component.content) {
    return new Response('Component not found', { status: 404 });
  }

  const isJson =
    component.path?.endsWith('.json') || ['mcp', 'setting', 'hook'].includes(component.type);
  const ext = isJson ? 'json' : 'md';
  const filename =
    component.path?.split('/').pop()?.replace(/\.(md|json)$/, '') ?? component.name;

  return new Response(component.content, {
    headers: {
      'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.${ext}"`,
      'Cache-Control': 'no-store',
    },
  });
};
