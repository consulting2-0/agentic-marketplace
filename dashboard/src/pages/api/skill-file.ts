import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

/**
 * GET /api/skill-file?skillPath=development/senior-architect&file=references/architecture_patterns.md
 * Serves reference files from the cli-tool/components/skills directory.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const skillPath = url.searchParams.get('skillPath');
  const file = url.searchParams.get('file');

  if (!skillPath || !file) {
    return new Response('Missing skillPath or file param', { status: 400 });
  }

  // Security: prevent path traversal
  const normalizedSkillPath = path.normalize(skillPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const normalizedFile = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '');

  // Try skills directory first, then agents directory
  const baseOptions = [
    path.resolve('..', 'cli-tool', 'components', 'skills', normalizedSkillPath),
    path.resolve('..', 'cli-tool', 'components', 'agents', normalizedSkillPath),
  ];

  let content: string | null = null;

  for (const base of baseOptions) {
    const filePath = path.join(base, normalizedFile);

    // Ensure the resolved path is still within the expected base directories
    const skillsRoot = path.resolve('..', 'cli-tool', 'components');
    if (!filePath.startsWith(skillsRoot)) continue;

    try {
      content = fs.readFileSync(filePath, 'utf-8');
      break;
    } catch {
      continue;
    }
  }

  if (content === null) {
    return new Response(`File not found: ${normalizedFile}`, { status: 404 });
  }

  const ext = path.extname(normalizedFile).toLowerCase();
  const contentType = ext === '.json' ? 'application/json' : 'text/plain; charset=utf-8';

  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300',
    },
  });
};
