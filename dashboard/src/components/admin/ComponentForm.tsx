import { useState } from 'react';
import type { ComponentRow } from '../../lib/supabase';

const TYPES = ['skill', 'agent', 'command', 'hook', 'mcp', 'setting', 'template'] as const;

interface Props {
  component: ComponentRow | null;
  adminPassword: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function ComponentForm({ component, adminPassword, onSave, onCancel }: Props) {
  const isEdit = !!component;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: component?.type ?? 'skill',
    name: component?.name ?? '',
    path: component?.path ?? '',
    description: component?.description ?? '',
    category: component?.category ?? '',
    content: component?.content ?? '',
    downloads: component?.downloads ?? 0,
    featured: component?.featured ?? false,
    published: component?.published ?? true,
    platform: component?.platform ?? 'claude',
    github_url: (component as any)?.github_url ?? '',
    author: component?.author ?? 'Consulting 2.0',
    version: component?.version ?? '1.0.0',
    tags: component?.tags?.join(', ') ?? '',
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      downloads: Number(form.downloads),
    };

    const url = isEdit ? `/api/admin/components/${component!.id}` : '/api/admin/components';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'x-admin-password': adminPassword, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Save failed');
      setSaving(false);
      return;
    }
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,13,32,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#1C2433] bg-[#0D1117]">
        <div className="px-6 py-4 border-b border-[#1C2433] flex items-center justify-between sticky top-0 bg-[#0D1117]">
          <h2 className="text-[14px] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
            {isEdit ? 'Edit Component' : 'New Component'}
          </h2>
          <button onClick={onCancel} className="text-[#4D6080] hover:text-[#8A9BBE] text-[20px] leading-none">×</button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg text-[12px] text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Type *</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)}
                className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550]">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Platform */}
            <div>
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Platform</label>
              <select value={form.platform} onChange={(e) => set('platform', e.target.value)}
                className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550]">
                <option value="claude">Claude Code</option>
                <option value="joule">SAP Joule</option>
                <option value="both">Both</option>
              </select>
            </div>
            {/* Version */}
            <div>
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Version</label>
              <input value={form.version} onChange={(e) => set('version', e.target.value)}
                className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                placeholder="1.0.0" />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Name *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required
              className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
              placeholder="e.g. SAP Integration Expert" />
          </div>

          {/* Path */}
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Path (unique slug) *</label>
            <input value={form.path} onChange={(e) => set('path', e.target.value)} required
              className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
              placeholder="e.g. agents/sap-integration-expert" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Category</label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                placeholder="e.g. integration, development" />
            </div>
            {/* Author */}
            <div>
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Author</label>
              <input value={form.author} onChange={(e) => set('author', e.target.value)}
                className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
                placeholder="Consulting 2.0" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
              className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080] resize-none"
              placeholder="Short description shown on cards..." />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Content (Markdown)</label>
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={10}
              className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[12px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080] resize-y font-mono"
              placeholder="# Agent Name&#10;&#10;Full markdown content..." />
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">GitHub URL</label>
            <input value={form.github_url} onChange={(e) => set('github_url', e.target.value)}
              className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
              placeholder="https://github.com/owner/repo" />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)}
              className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
              placeholder="sap, integration, btp" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Downloads */}
            <div>
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Downloads</label>
              <input type="number" value={form.downloads} onChange={(e) => set('downloads', e.target.value)}
                className="w-full bg-[#111827] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2 outline-none focus:border-[#2A3550]" />
            </div>
            {/* Published */}
            <div className="flex flex-col">
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Published</label>
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0057FF]" />
                <span className="text-[13px] text-[#8A9BBE]">{form.published ? 'Yes' : 'No'}</span>
              </label>
            </div>
            {/* Featured */}
            <div className="flex flex-col">
              <label className="block text-[11px] text-[#4D6080] mb-1 uppercase tracking-wider">Featured</label>
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#FBBF24]" />
                <span className="text-[13px] text-[#8A9BBE]">{form.featured ? 'Yes' : 'No'}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C2433]">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 text-[13px] rounded-lg border border-[#1C2433] text-[#8A9BBE] hover:text-white hover:border-[#2A3550] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-[13px] rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ background: '#0057FF', color: 'white' }}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
