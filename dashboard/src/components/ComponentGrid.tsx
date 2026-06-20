import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Component, ComponentsData, ComponentType } from '../lib/types';
import { TYPE_CONFIG } from '../lib/icons';
import { ITEMS_PER_PAGE, COMPONENTS_JSON_URL } from '../lib/constants';
import { loadWorkspace, activeProject, toggleInActive, setActive, createProject, isInProject, toggleInProject } from '../lib/workspace';

interface Props {
  initialType: string;
  /** Whether to mark items already in the active project (catalog: true, home: false) */
  markAdded?: boolean;
}

interface CartState {
  [key: string]: { name: string; path: string; category: string; description: string; icon: string }[];
}

function cleanPath(path: string): string {
  return path?.replace(/\.(md|json)$/, '') ?? '';
}

function formatName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\.(md|json)$/, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

import TypeIcon from './TypeIcon';

export default function ComponentGrid({ initialType, markAdded = true }: Props) {
  const [data, setData] = useState<ComponentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>(initialType);
  const [category, setCategory] = useState('all');
  const [platform, setPlatform] = useState<'all' | 'claude' | 'joule' | 'both'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'downloads' | 'name'>('downloads');
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartState>({});
  const [activeName, setActiveName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [activeId, setActiveId] = useState('');
  const [pickerPath, setPickerPath] = useState<string | null>(null);

  // Sync activeType when initialType changes (e.g. sidebar navigation)
  useEffect(() => {
    setActiveType(initialType);
    setCategory('all');
    setPlatform('all');
    setPage(1);
  }, [initialType]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(COMPONENTS_JSON_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) { setData(json); setLoading(false); }
      } catch (err: any) {
        if (!cancelled && err.name !== 'AbortError') { setError('Failed to load components'); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; controller.abort(); };
  }, []);

  useEffect(() => {
    function syncActive() {
      const ws = loadWorkspace();
      const p = activeProject(ws);
      setCart(p ? ((p.items as unknown) as CartState) : {});
      setActiveName(p?.name ?? '');
      setProjects(ws.projects.map((x) => ({ id: x.id, name: x.name })));
      setActiveId(ws.activeId);
    }
    syncActive();
    const onWs = () => syncActive();
    window.addEventListener('workspace-updated', onWs);
    window.addEventListener('storage', onWs);
    return () => {
      window.removeEventListener('workspace-updated', onWs);
      window.removeEventListener('storage', onWs);
    };
  }, []);


  const typeComponents = useMemo(() => {
    if (!data) return [];
    return (data[activeType as ComponentType] as Component[]) ?? [];
  }, [data, activeType]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const c of typeComponents) { if (c.category) cats.add(c.category); }
    return Array.from(cats).sort();
  }, [typeComponents]);

  const filtered = useMemo(() => {
    let items = typeComponents;
    if (category !== 'all') items = items.filter((c) => c.category === category);
    if (platform !== 'all') items = items.filter((c) => {
      const p = c.platform ?? 'claude';
      return p === platform || p === 'both';
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) =>
        c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q)
      );
    }
    const sorted = [...items];
    if (sortBy === 'downloads') sorted.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [typeComponents, category, platform, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [category, platform, search, activeType]);

  const counts = useMemo(() => {
    if (!data) return {};
    const result: Record<string, number> = {};
    for (const type of Object.keys(TYPE_CONFIG)) result[type] = ((data as any)[type] as Component[])?.length ?? 0;
    return result;
  }, [data]);

  // Emit counts to sidebar
  useEffect(() => {
    if (Object.keys(counts).length > 0) {
      window.dispatchEvent(new CustomEvent('component-counts', { detail: counts }));
    }
  }, [counts]);

  const isInCart = useCallback(
    (path: string, type: string) => {
      const typePlural = type.endsWith('s') ? type : type + 's';
      return cart[typePlural]?.some((item) => item.path === path) ?? false;
    },
    [cart]
  );

  const toggleCart = useCallback((component: Component) => {
    const { added, projectName } = toggleInActive({
      path: component.path,
      name: component.name,
      type: component.type,
      category: component.category ?? '',
      description: component.description ?? '',
    });
    setToast(`${added ? 'Added to' : 'Removed from'} “${projectName}”`);
    window.clearTimeout((toggleCart as any)._t);
    (toggleCart as any)._t = window.setTimeout(() => setToast(null), 1900);
  }, []);

  function flashToast(msg: string) {
    setToast(msg);
    window.clearTimeout((flashToast as any)._t);
    (flashToast as any)._t = window.setTimeout(() => setToast(null), 1900);
  }

  // "+" click: with multiple projects, ask which; with one, add directly.
  function handleAddClick(component: Component) {
    if (projects.length <= 1) {
      toggleCart(component);
    } else {
      setPickerPath((prev) => (prev === component.path ? null : component.path));
    }
  }

  function pickProject(projectId: string, component: Component) {
    const { added, projectName } = toggleInProject(projectId, {
      path: component.path,
      name: component.name,
      type: component.type,
      category: component.category ?? '',
      description: component.description ?? '',
    });
    flashToast(`${added ? 'Added to' : 'Removed from'} “${projectName}”`);
  }

  function newProjectAndAdd(component: Component) {
    const name = window.prompt('Name your new project');
    if (!name || !name.trim()) return;
    const ws = createProject(name.trim());
    pickProject(ws.activeId, component);
    setPickerPath(null);
  }

  if (loading) {
    return (
      <div className="px-6 py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-text-tertiary">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-[13px] text-red-400">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-[13px] text-text-secondary hover:text-text-primary underline underline-offset-4">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Add-to-workspace toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111111] text-white text-[13px] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]">
          <svg className="w-4 h-4 text-[#00E599]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toast}</span>
          <a href="/workspace" className="ml-1 text-[12px] font-medium text-[#7db4ff] hover:underline">View</a>
        </div>
      )}

      {/* Platform tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-1 border-b border-border">
        {([
          { value: 'all',    label: 'All Platforms', color: '' },
          { value: 'claude', label: 'Claude Code',   color: '#60A5FA' },
          { value: 'joule',  label: 'SAP Joule',     color: '#00E599' },
        ] as { value: 'all' | 'claude' | 'joule' | 'both'; label: string; color: string }[]).map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setPlatform(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={platform === value
              ? { background: `${color || '#60A5FA'}18`, color: color || '#16150F', border: `1px solid ${color || '#60A5FA'}30` }
              : { color: '#8A867A', border: '1px solid transparent' }}
          >
            {value !== 'all' && color && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            )}
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-text-tertiary">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && ` for "${search}"`}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-2.5">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 bg-surface-2 border border-border rounded-lg text-[12px] text-text-primary placeholder:text-[#666] pl-8 pr-3 py-1.5 outline-none focus:bg-surface-3 focus:ring-1 focus:ring-border transition-all"
          />
        </div>

        {/* Category select */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg text-[12px] text-text-secondary px-2.5 py-1.5 outline-none focus:bg-surface-3 cursor-pointer"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'downloads' | 'name')}
            className="bg-surface-2 border border-border rounded-lg text-[12px] text-text-secondary px-2.5 py-1.5 outline-none focus:bg-surface-3 cursor-pointer"
          >
            <option value="downloads">Popular</option>
            <option value="name">A-Z</option>
          </select>
        </div>
      </div>

      {/* Active project bar — where the + adds */}
      <div className="flex items-center gap-2 px-6 pb-3 text-[12px]">
        <span className="text-text-tertiary">Adding to</span>
        <select
          value={activeId}
          onChange={(e) => {
            if (e.target.value === '__new') {
              const n = window.prompt('Name your new project');
              if (n && n.trim()) createProject(n.trim());
            } else {
              setActive(e.target.value);
            }
          }}
          className="bg-primary-50 text-primary-700 border border-primary-200 rounded-lg px-2.5 py-1 font-medium outline-none cursor-pointer max-w-[200px]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value="__new">+ New project…</option>
        </select>
        <a href="/workspace" className="text-text-tertiary hover:text-text-primary underline underline-offset-2">view workspace</a>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 px-6 pb-6">
        {paged.map((component) => {
          const inCart = markAdded && isInCart(component.path, component.type);
          const config = TYPE_CONFIG[activeType];

          return (
            <div
              key={component.path ?? component.name}
              className="group flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-border hover:border-border-hover hover:bg-surface-2 transition-all duration-200 cursor-pointer"
              onClick={() => {
                window.location.href = `/component/${component.type}/${cleanPath(component.path ?? component.name)}`;
              }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${config?.color ?? '#a1a1a1'}15`, color: config?.color ?? '#a1a1a1' }}
              >
                <TypeIcon type={activeType} size={18} className="[&>svg]:w-[18px] [&>svg]:h-[18px]" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium text-text-primary group-hover:text-text-primary transition-colors">
                  {formatName(component.name)}
                </span>
                <p className="text-[12px] text-text-tertiary line-clamp-2 mt-1 leading-relaxed">
                  {component.description || component.content?.slice(0, 120) || 'No description'}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {/* Platform badge */}
                  {component.platform && component.platform !== 'claude' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                      style={component.platform === 'joule'
                        ? { background: 'rgba(0,229,153,0.1)', color: '#00E599', border: '1px solid rgba(0,229,153,0.2)' }
                        : { background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)' }}>
                      {component.platform === 'joule' ? 'Joule' : 'Claude + Joule'}
                    </span>
                  )}
                  {component.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-text-tertiary">
                      {component.category}
                    </span>
                  )}
                  {(component.downloads ?? 0) > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(52,211,153,0.08)', color: '#34D399' }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      {component.downloads?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="relative flex items-center gap-0.5 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddClick(component); }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 transition-all ${
                    inCart
                      ? 'bg-[#111111] text-white'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
                  }`}
                  title={inCart ? 'Remove from stack' : 'Add to project'}
                >
                  {inCart ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>

                {/* Project picker (when 2+ projects) */}
                {pickerPath === component.path && (
                  <div
                    className="absolute right-0 top-9 z-30 w-56 bg-surface-1 border border-border rounded-xl shadow-[0_16px_40px_-12px_rgba(11,18,40,0.35)] p-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Add to project</p>
                    <div className="max-h-56 overflow-y-auto">
                      {projects.map((p) => {
                        const inIt = isInProject(p.id, component.path, component.type);
                        return (
                          <button
                            key={p.id}
                            onClick={(e) => { e.stopPropagation(); pickProject(p.id, component); }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[13px] text-text-primary hover:bg-surface-2 transition-colors"
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${inIt ? 'bg-primary-500 border-primary-500' : 'border-border'}`}>
                              {inIt && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              )}
                            </span>
                            <span className="flex-1 truncate">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); newProjectAndAdd(component); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 border-t border-border rounded-lg text-left text-[13px] text-primary-600 hover:bg-surface-2 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      New project…
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Click-away overlay for the project picker */}
      {pickerPath && (
        <div className="fixed inset-0 z-20" onClick={() => setPickerPath(null)} />
      )}

      {/* Empty state */}
      {paged.length === 0 && !loading && (
        <div className="px-6 py-16 text-center">
          <p className="text-[13px] text-text-tertiary">No components found</p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-2 text-[13px] text-text-secondary hover:text-text-primary underline underline-offset-4">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Pagination - Vercel style */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 px-6 pb-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-[13px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-[12px] text-text-tertiary tabular-nums">
            {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-[13px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
