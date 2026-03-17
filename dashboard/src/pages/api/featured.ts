import type { APIRoute } from 'astro';
import { getAdminClient } from '../../lib/supabase';

/**
 * GET /api/featured
 * Returns:
 *  - featured_items rows (standalone GitHub repos / tools)
 *  - featured components from the components table (featured = true, limit 6)
 */
export const GET: APIRoute = async () => {
  const supabase = getAdminClient();

  const [itemsRes, componentsRes] = await Promise.all([
    supabase
      .from('featured_items')
      .select('*')
      .eq('published', true)
      .order('position')
      .limit(12),
    supabase
      .from('components')
      .select('id, name, path, type, category, description, downloads, platform, github_url, featured')
      .eq('featured', true)
      .eq('published', true)
      .order('downloads', { ascending: false })
      .limit(6),
  ]);

  return new Response(
    JSON.stringify({
      items: itemsRes.data ?? [],
      components: componentsRes.data ?? [],
    }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } }
  );
};
