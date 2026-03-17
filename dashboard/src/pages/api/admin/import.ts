import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import fs from 'node:fs';
import path from 'node:path';

function isAdmin(request: Request): boolean {
  return request.headers.get('x-admin-password') === import.meta.env.ADMIN_PASSWORD;
}

const SKILLS_BASE = path.resolve('..', 'cli-tool', 'components', 'skills');
const AGENTS_BASE = path.resolve('..', 'cli-tool', 'components', 'agents');
const COMMANDS_BASE = path.resolve('..', 'cli-tool', 'components', 'commands');

const typeMap: Record<string, string> = {
  skills: 'skill', agents: 'agent', commands: 'command',
  hooks: 'hook', mcps: 'mcp', settings: 'setting', templates: 'template',
};

const baseDirMap: Record<string, string> = {
  skill: SKILLS_BASE,
  agent: AGENTS_BASE,
  command: COMMANDS_BASE,
};

/** Recursively collect all files under a directory, returning paths relative to that dir */
function collectFiles(dir: string, base: string = dir): string[] {
  const result: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...collectFiles(full, base));
      } else if (entry.isFile()) {
        const rel = path.relative(base, full).replace(/\\/g, '/');
        // Skip the main SKILL.md / AGENT.md — already in components.content
        if (rel === 'SKILL.md' || rel === 'AGENT.md' || rel === 'COMMAND.md') continue;
        result.push(rel);
      }
    }
  } catch { /* dir may not exist */ }
  return result;
}

/** POST /api/admin/import — bulk import components + all reference files into Supabase */
export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const importFiles = url.searchParams.get('files') !== 'false'; // default true

  try {
    const filePath = path.resolve('public/components.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    // ── 1. Build component rows ─────────────────────────────────────
    const rows: any[] = [];
    for (const [plural, singularType] of Object.entries(typeMap)) {
      const items: any[] = json[plural] ?? [];
      for (const item of items) {
        if (!item.name || !item.path) continue;
        // Detect platform from path / category
        const isBtp = item.path.includes('sap-btp') || item.path.includes('integration-suite') ||
          item.category?.includes('sap') || item.path.includes('hana') || item.path.includes('abap');
        rows.push({
          type: singularType,
          name: item.name,
          path: item.path,
          description: item.description ?? null,
          category: item.category ?? null,
          content: item.content ?? null,
          downloads: item.downloads ?? 0,
          featured: item.featured ?? false,
          published: true,
          platform: 'claude', // default; admin can update to 'joule' or 'both'
          tags: item.tags ?? [],
          author: item.author ?? 'Consulting 2.0',
          version: item.version ?? '1.0.0',
        });
      }
    }

    const supabase = getAdminClient();

    // ── 2. Upsert components in batches ────────────────────────────
    // Keep batches small — full markdown content makes payloads large
    const BATCH = 100;
    let inserted = 0;
    let skipped = 0;
    const pathToId: Record<string, string> = {};

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { data, error } = await supabase
        .from('components')
        .upsert(batch, { onConflict: 'path', ignoreDuplicates: false })
        .select('id, path');
      if (error) {
        console.error('Component batch error:', error);
        skipped += batch.length;
      } else {
        for (const row of data ?? []) pathToId[row.path] = row.id;
        inserted += data?.length ?? 0;
      }
    }

    if (!importFiles) {
      return new Response(
        JSON.stringify({ success: true, components: { total: rows.length, inserted, skipped }, files: { skipped: true } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 3. Collect and upsert reference files ──────────────────────
    // Fetch any IDs we didn't get from the upsert (e.g. pre-existing rows)
    const missingPaths = rows.map((r) => r.path).filter((p) => !pathToId[p]);
    if (missingPaths.length > 0) {
      const { data } = await supabase
        .from('components')
        .select('id, path')
        .in('path', missingPaths.slice(0, 1000));
      for (const row of data ?? []) pathToId[row.path] = row.id;
    }

    const fileRows: any[] = [];
    for (const row of rows) {
      const componentId = pathToId[row.path];
      if (!componentId) continue;

      const baseDir = baseDirMap[row.type];
      if (!baseDir) continue;

      // The component's directory on disk
      // path format: "development/senior-architect" or "sap-btp/integration-suite/something"
      const compDir = path.join(baseDir, row.path.replace(/\.(md|json)$/, ''));
      const refFiles = collectFiles(compDir);

      for (const relPath of refFiles) {
        const fullPath = path.join(compDir, relPath);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          fileRows.push({
            component_id: componentId,
            file_path: relPath,
            content,
          });
        } catch { /* skip unreadable files */ }
      }
    }

    let filesInserted = 0;
    let filesSkipped = 0;
    const FILE_BATCH = 50; // small — file content can be large
    for (let i = 0; i < fileRows.length; i += FILE_BATCH) {
      const batch = fileRows.slice(i, i + FILE_BATCH);
      const { data, error } = await supabase
        .from('component_files')
        .upsert(batch, { onConflict: 'component_id,file_path', ignoreDuplicates: false })
        .select('id');
      if (error) {
        console.error(`File batch ${i}–${i + batch.length} error:`, error.message);
        filesSkipped += batch.length;
      } else {
        filesInserted += data?.length ?? 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        components: { total: rows.length, inserted, skipped },
        files: { total: fileRows.length, inserted: filesInserted, skipped: filesSkipped },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
