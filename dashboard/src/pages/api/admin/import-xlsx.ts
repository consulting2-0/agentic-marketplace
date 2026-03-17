import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { getAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  const password = request.headers.get('x-admin-password');
  if (password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Read first sheet
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No data rows found in spreadsheet' }), { status: 400 });
  }

  const supabase = getAdminClient();
  const BATCH = 50;
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  const components = rows
    .filter((r) => r.name?.trim() && r.type?.trim() && r.path?.trim())
    .map((r) => ({
      name: r.name.trim(),
      type: r.type.trim().toLowerCase(),
      path: r.path.trim(),
      description: r.description?.trim() || null,
      category: r.category?.trim() || null,
      tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      platform: (['claude', 'joule', 'both'].includes(r.platform?.trim()) ? r.platform.trim() : 'claude'),
      author: r.author?.trim() || 'Consulting 2.0',
      version: r.version?.trim() || '1.0.0',
      published: r.published?.toString().toLowerCase() !== 'false',
      featured: r.featured?.toString().toLowerCase() === 'true',
      github_url: r.github_url?.trim() || null,
      content: r.content?.trim() || '',
      downloads: 0,
    }));

  for (let i = 0; i < components.length; i += BATCH) {
    const batch = components.slice(i, i + BATCH);
    const { error, data } = await supabase
      .from('components')
      .upsert(batch, { onConflict: 'path', ignoreDuplicates: false })
      .select('id');

    if (error) {
      skipped += batch.length;
      errors.push(error.message);
    } else {
      inserted += data?.length ?? batch.length;
    }
  }

  return new Response(JSON.stringify({
    total: components.length,
    inserted,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  }), { headers: { 'Content-Type': 'application/json' } });
};
