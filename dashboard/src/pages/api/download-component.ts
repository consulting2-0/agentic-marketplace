import type { APIRoute } from 'astro';
import * as JSZipModule from 'jszip';
import { fetchComponents, originFromRequest, fetchReferenceBytes } from '../../lib/data';

const JSZip = (JSZipModule as any).default ?? JSZipModule;

function pluralize(t: string): string {
  return t.endsWith('s') ? t : `${t}s`;
}

// Download a single component. Single-file components return the file directly;
// multi-file components (skills with references, etc.) return a complete folder ZIP.
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const path = url.searchParams.get('path');
  if (!type || !path) {
    return new Response('Missing type or path', { status: 400 });
  }

  const data = await fetchComponents(originFromRequest(request));
  const typePlural = pluralize(type);
  const cleanReq = path.replace(/\.(md|json)$/, '');
  const items = (data as any)[typePlural] as any[] | undefined;
  const component = items?.find((c) => (c.path?.replace(/\.(md|json)$/, '') ?? '') === cleanReq);

  if (!component || component.content == null) {
    return new Response('Component not found', { status: 404 });
  }

  const baseName = cleanReq.split('/').pop() ?? component.name;
  const isJson = component.path?.endsWith('.json') || ['mcp', 'setting', 'hook'].includes(component.type);
  const ext = isJson ? 'json' : 'md';
  const refs: string[] = component.references ?? [];

  // Single-file component → return the file as-is.
  if (refs.length === 0) {
    return new Response(component.content, {
      headers: {
        'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${baseName}.${ext}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // Multi-file component → zip the whole folder (main file + every reference).
  const zip = new JSZip();
  const mainName = typePlural === 'skills' ? 'SKILL.md' : `${baseName}.${ext}`;
  zip.file(`${baseName}/${mainName}`, component.content);

  await Promise.all(
    refs.map(async (ref) => {
      const bytes = await fetchReferenceBytes(typePlural, cleanReq, ref);
      if (bytes) zip.file(`${baseName}/${ref}`, bytes);
    }),
  );

  const buffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${baseName}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
};
