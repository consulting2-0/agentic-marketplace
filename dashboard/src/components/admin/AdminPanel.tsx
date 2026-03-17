import { useState, useEffect, useCallback } from 'react';
import type { ComponentRow } from '../../lib/supabase';
import ComponentForm from './ComponentForm';
import FeaturedItemsManager from './FeaturedItemsManager';

const TYPES = ['all', 'skill', 'agent', 'command', 'hook', 'mcp', 'setting', 'template'] as const;
const TYPE_COLORS: Record<string, string> = {
  skill: '#34D399', agent: '#60A5FA', command: '#7C9CBF',
  hook: '#FBBF24', mcp: '#34D399', setting: '#A78BFA', template: '#F87171',
};

export default function AdminPanel({ adminPassword }: { adminPassword: string }) {
  const [tab, setTab] = useState<'components' | 'featured'>('components');
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ComponentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const LIMIT = 50;

  const headers = { 'x-admin-password': adminPassword, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filterType !== 'all') params.set('type', filterType);
    if (search) params.set('search', search);

    const res = await fetch(`/api/admin/components?${params}`, { headers });
    if (!res.ok) { setError('Failed to load'); setLoading(false); return; }
    const json = await res.json();
    setComponents(json.data ?? []);
    setCount(json.count ?? 0);
    setLoading(false);
  }, [page, filterType, search, adminPassword]);

  useEffect(() => { load(); }, [load]);

  async function deleteComponent(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/components/${id}`, { method: 'DELETE', headers });
    if (res.ok) load();
    else alert('Delete failed');
  }

  async function togglePublished(component: ComponentRow) {
    await fetch(`/api/admin/components/${component.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ published: !component.published }),
    });
    load();
  }

  async function toggleFeatured(component: ComponentRow) {
    await fetch(`/api/admin/components/${component.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ featured: !component.featured }),
    });
    load();
  }

  async function runImport() {
    if (!confirm('This will import all components from components.json into Supabase. Existing entries will be updated. Continue?')) return;
    setImporting(true);
    setImportResult(null);
    const res = await fetch('/api/admin/import', { method: 'POST', headers });
    const json = await res.json();
    if (json.error) {
      setImportResult(`Error: ${json.error}`);
    } else {
      const c = json.components ?? {};
      const f = json.files ?? {};
      setImportResult(
        `Components: ${c.inserted ?? 0} imported of ${c.total ?? 0} (${c.skipped ?? 0} skipped). ` +
        `Reference files: ${f.inserted ?? 0} imported of ${f.total ?? 0} (${f.skipped ?? 0} skipped).`
      );
    }
    setImporting(false);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(count / LIMIT));

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E4EBF8]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-[#1C2433] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[#4D6080] hover:text-[#8A9BBE] text-[13px]">← Dashboard</a>
          <span className="text-[#1C2433]">|</span>
          <h1 className="text-[15px] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Admin <span style={{ color: '#00E599' }}>Panel</span>
          </h1>
          <div className="flex gap-1 ml-2">
            {(['components', 'featured'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1 text-[12px] rounded-lg capitalize transition-colors"
                style={tab === t
                  ? { background: 'rgba(0,87,255,0.15)', color: '#60A5FA', border: '1px solid rgba(0,87,255,0.3)' }
                  : { color: '#4D6080', border: '1px solid transparent' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'components' && (<>
            <span className="text-[12px] text-[#4D6080]">{count} components</span>
            <button
              onClick={runImport}
              disabled={importing}
              className="px-3 py-1.5 text-[12px] rounded-lg border border-[#2A3550] text-[#8A9BBE] hover:text-white hover:border-[#3D5580] transition-colors disabled:opacity-50"
            >
              {importing ? 'Importing...' : '↑ Import from JSON'}
            </button>
            <button
              onClick={() => setCreating(true)}
              className="px-3 py-1.5 text-[12px] rounded-lg font-medium transition-colors"
              style={{ background: '#0057FF', color: 'white' }}
            >
              + New Component
            </button>
          </>)}
        </div>
      </div>

      {tab === 'featured' && <FeaturedItemsManager adminPassword={adminPassword} />}

      {tab === 'components' && (<>
      {importResult && (
        <div className="mx-6 mt-4 px-4 py-2 rounded-lg text-[12px]"
          style={{ background: importResult.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', color: importResult.startsWith('Error') ? '#F87171' : '#34D399' }}>
          {importResult}
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-[#1C2433]">
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setPage(1); }}
              className="px-2.5 py-1 text-[11px] rounded-md capitalize transition-colors"
              style={filterType === t
                ? { background: 'rgba(0,87,255,0.15)', color: '#60A5FA', border: '1px solid rgba(0,87,255,0.3)' }
                : { color: '#4D6080', border: '1px solid transparent' }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ml-auto w-56 bg-[#111827] border border-[#1C2433] rounded-lg text-[12px] text-[#E4EBF8] placeholder:text-[#4D6080] px-3 py-1.5 outline-none focus:border-[#2A3550]"
        />
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#4D6080] text-[13px]">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-400 text-[13px]">{error}</div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[#4D6080] border-b border-[#1C2433]">
                <th className="text-left pb-2 pr-4 font-medium">Name</th>
                <th className="text-left pb-2 pr-4 font-medium w-20">Type</th>
                <th className="text-left pb-2 pr-4 font-medium w-20">Platform</th>
                <th className="text-left pb-2 pr-4 font-medium">Category</th>
                <th className="text-left pb-2 pr-4 font-medium w-16">Downloads</th>
                <th className="text-left pb-2 pr-4 font-medium w-16">Featured</th>
                <th className="text-left pb-2 pr-4 font-medium w-16">Published</th>
                <th className="text-left pb-2 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.id} className="border-b border-[#111827] hover:bg-[#111827] transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium text-[#E4EBF8] truncate max-w-[280px]">{c.name}</div>
                    <div className="text-[#4D6080] text-[10px] truncate max-w-[280px] mt-0.5">{c.path}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] capitalize"
                      style={{ background: `${TYPE_COLORS[c.type] ?? '#8A9BBE'}15`, color: TYPE_COLORS[c.type] ?? '#8A9BBE' }}>
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                      style={c.platform === 'joule'
                        ? { background: 'rgba(0,229,153,0.1)', color: '#00E599' }
                        : c.platform === 'both'
                        ? { background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#4D6080' }}>
                      {c.platform ?? 'claude'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-[#8A9BBE]">{c.category ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-[#8A9BBE] tabular-nums">{c.downloads.toLocaleString()}</td>
                  <td className="py-2.5 pr-4">
                    <button onClick={() => toggleFeatured(c)}
                      className="w-8 h-4 rounded-full transition-colors relative"
                      style={{ background: c.featured ? '#FBBF24' : '#1C2433' }}>
                      <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: c.featured ? '17px' : '2px' }} />
                    </button>
                  </td>
                  <td className="py-2.5 pr-4">
                    <button onClick={() => togglePublished(c)}
                      className="w-8 h-4 rounded-full transition-colors relative"
                      style={{ background: c.published ? '#34D399' : '#1C2433' }}>
                      <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: c.published ? '17px' : '2px' }} />
                    </button>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(c)}
                        className="px-2 py-0.5 text-[11px] rounded border border-[#1C2433] text-[#8A9BBE] hover:text-white hover:border-[#2A3550] transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteComponent(c.id, c.name)}
                        className="px-2 py-0.5 text-[11px] rounded border border-[#1C2433] text-red-400 hover:border-red-400/40 transition-colors">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-[12px] rounded border border-[#1C2433] text-[#8A9BBE] hover:text-white disabled:opacity-30">
              Previous
            </button>
            <span className="text-[12px] text-[#4D6080]">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] rounded border border-[#1C2433] text-[#8A9BBE] hover:text-white disabled:opacity-30">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Form modal */}
      {(creating || editing) && (
        <ComponentForm
          component={editing}
          adminPassword={adminPassword}
          onSave={() => { setCreating(false); setEditing(null); load(); }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}
      </>)}
    </div>
  );
}
