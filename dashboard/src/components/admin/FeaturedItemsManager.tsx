import { useState, useEffect, useCallback } from 'react';

interface FeaturedItem {
  id: string;
  name: string;
  description: string | null;
  github_url: string | null;
  website_url: string | null;
  logo_url: string | null;
  tag: string | null;
  category: string | null;
  position: number;
  published: boolean;
}

const EMPTY: Omit<FeaturedItem, 'id' | 'position' | 'published'> = {
  name: '', description: '', github_url: '', website_url: '', logo_url: '', tag: '', category: '',
};

function deriveLogoFromGitHub(url: string): string {
  // https://github.com/owner/repo → https://github.com/owner.png
  const m = url.match(/github\.com\/([^/]+)/);
  return m ? `https://github.com/${m[1]}.png?size=80` : '';
}

export default function FeaturedItemsManager({ adminPassword }: { adminPassword: string }) {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FeaturedItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = { 'x-admin-password': adminPassword, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/featured', { headers });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [adminPassword]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY });
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function openEdit(item: FeaturedItem) {
    setForm({
      name: item.name,
      description: item.description ?? '',
      github_url: item.github_url ?? '',
      website_url: item.website_url ?? '',
      logo_url: item.logo_url ?? '',
      tag: item.tag ?? '',
      category: item.category ?? '',
    });
    setEditing(item);
    setCreating(false);
    setError(null);
  }

  function set(key: string, value: string) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Auto-derive GitHub avatar as logo if github_url set and logo blank
      if (key === 'github_url' && !f.logo_url && value.includes('github.com')) {
        updated.logo_url = deriveLogoFromGitHub(value);
      }
      return updated;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      position: editing?.position ?? items.length,
    };

    const url = editing ? `/api/admin/featured/${editing.id}` : '/api/admin/featured';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
    const json = await res.json();

    if (!res.ok) { setError(json.error ?? 'Save failed'); setSaving(false); return; }
    setCreating(false);
    setEditing(null);
    setSaving(false);
    load();
  }

  async function del(item: FeaturedItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await fetch(`/api/admin/featured/${item.id}`, { method: 'DELETE', headers });
    load();
  }

  async function togglePublished(item: FeaturedItem) {
    await fetch(`/api/admin/featured/${item.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ published: !item.published }),
    });
    load();
  }

  const showForm = creating || !!editing;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-[#4D6080] mt-0.5">
            Spotlight GitHub repos, tools, or integrations in the Featured section.
          </p>
        </div>
        <button onClick={openCreate}
          className="px-3 py-1.5 text-[12px] rounded-lg font-medium"
          style={{ background: '#0057FF', color: 'white' }}>
          + Add Featured Item
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-[#111827] border border-[#1C2433] rounded-xl p-5">
          <h3 className="text-[13px] font-semibold text-[#E4EBF8] mb-4">
            {editing ? 'Edit Item' : 'New Featured Item'}
          </h3>
          <form onSubmit={save} className="space-y-3">
            {error && (
              <div className="px-3 py-2 rounded-lg text-[12px] text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">Name *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} required
                  className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                  placeholder="e.g. SAP Integration Suite SDK" />
              </div>
              <div>
                <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">Tag</label>
                <input value={form.tag ?? ''} onChange={(e) => set('tag', e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                  placeholder="e.g. Integration, Tool, MCP" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">GitHub URL</label>
              <input value={form.github_url ?? ''} onChange={(e) => set('github_url', e.target.value)}
                className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                placeholder="https://github.com/owner/repo" />
            </div>

            <div>
              <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">Website URL</label>
              <input value={form.website_url ?? ''} onChange={(e) => set('website_url', e.target.value)}
                className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">Logo URL</label>
                <input value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                  placeholder="Auto-filled from GitHub" />
              </div>
              <div>
                <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">Category</label>
                <input value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                  placeholder="e.g. SAP BTP, DevOps" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#4D6080] mb-1 uppercase tracking-wider">Description</label>
              <input value={form.description ?? ''} onChange={(e) => set('description', e.target.value)}
                className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                placeholder="Short description shown on the card" />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-[13px] rounded-lg font-medium disabled:opacity-50"
                style={{ background: '#0057FF', color: 'white' }}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Item'}
              </button>
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
                className="px-4 py-2 text-[13px] rounded-lg border border-[#1C2433] text-[#8A9BBE] hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-[13px] text-[#4D6080] py-8 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#1C2433] rounded-xl">
          <p className="text-[13px] text-[#4D6080]">No featured items yet</p>
          <p className="text-[11px] text-[#4D6080] mt-1">Add a GitHub repo or external tool to feature it on the homepage</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#1C2433] bg-[#0D1117]">
              {/* Logo */}
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: '#111827', border: '1px solid #1C2433' }}>
                {item.logo_url
                  ? <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain p-1" />
                  : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: '#4D6080' }}>
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#E4EBF8]">{item.name}</span>
                  {item.tag && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,87,255,0.1)', color: '#60A5FA' }}>{item.tag}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {item.github_url && (
                    <a href={item.github_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] hover:underline" style={{ color: '#4D6080' }}>
                      {item.github_url.replace('https://github.com/', 'github/')}
                    </a>
                  )}
                  {item.description && (
                    <span className="text-[11px] truncate" style={{ color: '#4D6080' }}>{item.description}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Published toggle */}
                <button onClick={() => togglePublished(item)}
                  className="w-8 h-4 rounded-full transition-colors relative"
                  style={{ background: item.published ? '#34D399' : '#1C2433' }}>
                  <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                    style={{ left: item.published ? '17px' : '2px' }} />
                </button>
                <button onClick={() => openEdit(item)}
                  className="px-2 py-0.5 text-[11px] rounded border border-[#1C2433] text-[#8A9BBE] hover:text-white hover:border-[#2A3550] transition-colors">
                  Edit
                </button>
                <button onClick={() => del(item)}
                  className="px-2 py-0.5 text-[11px] rounded border border-[#1C2433] text-red-400 hover:border-red-400/40 transition-colors">
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
