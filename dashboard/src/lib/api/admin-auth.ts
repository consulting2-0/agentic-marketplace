// Admin auth check for the /api/admin/* routes.
// Reads ADMIN_PASSWORD at RUNTIME (process.env) first so changing it in Vercel
// takes effect on redeploy without relying on Vite's build-time inlining of
// import.meta.env. Trims both sides to tolerate stray whitespace/newlines from
// copy-pasted env values.
export function isAdminRequest(request: Request): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD ?? '')
    .toString()
    .trim();
  if (!expected) return false;
  const provided = (request.headers.get('x-admin-password') ?? '').trim();
  return provided === expected;
}
