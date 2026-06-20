import { useState, useEffect } from 'react';
import type { Cart } from '../lib/types';
import { TYPE_CONFIG, ICONS } from '../lib/icons';

const EMPTY_CART: Cart = {
  agents: [], commands: [], settings: [], hooks: [], mcps: [], skills: [], templates: [],
};

// Order sections + structure consistently.
const TYPE_ORDER = ['agents', 'commands', 'skills', 'hooks', 'mcps', 'settings', 'templates'] as const;

function cleanName(item: any): string {
  return (item.name ?? item.path ?? '').replace(/\.(md|json)$/, '').split('/').pop() ?? '';
}
function formatName(name: string): string {
  if (!name) return '';
  return name.replace(/\.(md|json)$/, '').replace(/[-_]/g, ' ')
    .split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Where each type lands inside .claude/, and how its files look.
function fileFor(type: string, item: any): { folder: string; leaf: string; isDir?: boolean } | null {
  const n = cleanName(item);
  switch (type) {
    case 'agents': return { folder: 'agents/', leaf: `${n}.md` };
    case 'commands': return { folder: 'commands/', leaf: `${n}.md` };
    case 'skills': return { folder: 'skills/', leaf: `${n}/`, isDir: true };
    case 'hooks': return { folder: 'hooks/', leaf: `${n}.sh` };
    default: return null; // settings/mcps merge into json files (shown separately)
  }
}

export default function WorkspaceView() {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [zipping, setZipping] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function load() {
      try {
        const saved = localStorage.getItem('claudeCodeCart');
        setCart(saved ? { ...EMPTY_CART, ...JSON.parse(saved) } : EMPTY_CART);
      } catch { setCart(EMPTY_CART); }
      setReady(true);
    }
    load();
    const onUpdate = ((e: CustomEvent) => setCart({ ...EMPTY_CART, ...e.detail })) as EventListener;
    window.addEventListener('cart-updated', onUpdate);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('cart-updated', onUpdate);
      window.removeEventListener('storage', load);
    };
  }, []);

  const total = Object.values(cart).reduce((s, a) => s + (a?.length ?? 0), 0);
  const presentTypes = TYPE_ORDER.filter((t) => (cart as any)[t]?.length > 0);

  function persist(next: Cart) {
    localStorage.setItem('claudeCodeCart', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: next }));
  }
  function removeItem(type: string, path: string) {
    const next = { ...cart, [type]: (cart as any)[type].filter((i: any) => i.path !== path) } as Cart;
    setCart(next); persist(next);
  }
  function clearAll() {
    if (!confirm('Clear your entire workspace?')) return;
    setCart(EMPTY_CART); persist(EMPTY_CART);
  }

  async function downloadZip() {
    if (zipping || total === 0) return;
    setZipping(true);
    try {
      const components = Object.entries(cart).flatMap(([type, items]) =>
        (items ?? []).map((i: any) => ({ path: i.path, type, name: i.name }))
      );
      const res = await fetch('/api/download-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, collectionName: 'claude-workspace' }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'claude-workspace.zip';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Sorry — the download failed. Please try again.');
    } finally { setZipping(false); }
  }

  // Build the .claude/ structure rows for the preview.
  const structureFolders = presentTypes
    .map((t) => {
      const files = ((cart as any)[t] as any[]).map((i) => fileFor(t, i)).filter(Boolean) as { folder: string; leaf: string; isDir?: boolean }[];
      if (!files.length) return null;
      return { folder: files[0].folder, color: TYPE_CONFIG[t]?.color ?? '#5C5A50', files };
    })
    .filter(Boolean) as { folder: string; color: string; files: { leaf: string; isDir?: boolean }[] }[];
  const hasSettings = (cart.settings?.length ?? 0) > 0;
  const hasMcps = (cart.mcps?.length ?? 0) > 0;

  if (!ready) return <div className="py-20" />;

  if (total === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-2xl text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>Your workspace is empty</h1>
        <p className="mt-2 text-[14px] text-text-secondary max-w-md mx-auto">
          Add agents, skills, commands and more, then download one ZIP and drop it straight into your project's <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded">.claude/</code> folder.
        </p>
        <a href="/agents" className="mt-6 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-[14px] font-medium transition-colors">
          Browse components
        </a>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>My Workspace</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            {total} component{total !== 1 ? 's' : ''} ready to install ·{' '}
            <button onClick={clearAll} className="text-text-tertiary hover:text-red-500 transition-colors">Clear all</button>
          </p>
        </div>
        <button
          onClick={downloadZip}
          disabled={zipping}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-wait text-white text-[14px] font-semibold shadow-[0_10px_28px_-10px_rgba(0,87,255,0.5)] transition-colors"
        >
          {zipping ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
          {zipping ? 'Preparing…' : 'Download ZIP'}
        </button>
      </div>

      {/* Project structure preview */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <h2 className="text-[13px] font-semibold text-text-primary">Project structure</h2>
          <span className="text-[12px] text-text-tertiary">how your files install</span>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-5 font-mono text-[13px] leading-[1.9] overflow-x-auto">
          <div className="text-text-primary font-medium">.claude/</div>
          {structureFolders.map((f, fi) => {
            const lastFolder = fi === structureFolders.length - 1 && !hasSettings && !hasMcps;
            return (
              <div key={f.folder}>
                <div>
                  <span className="text-text-tertiary">{lastFolder ? '└─ ' : '├─ '}</span>
                  <span style={{ color: f.color }}>{f.folder}</span>
                </div>
                {f.files.map((file, i) => {
                  const lastFile = i === f.files.length - 1;
                  return (
                    <div key={file.leaf}>
                      <span className="text-text-tertiary">{lastFolder ? '   ' : '│  '}{lastFile ? '└─ ' : '├─ '}</span>
                      <span className={file.isDir ? '' : 'text-text-secondary'} style={file.isDir ? { color: f.color } : undefined}>{file.leaf}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {hasSettings && (
            <div><span className="text-text-tertiary">{hasMcps ? '├─ ' : '└─ '}</span><span className="text-amber-600">settings.json</span> <span className="text-text-tertiary text-[11px]">— merge manually</span></div>
          )}
          {hasMcps && (
            <div><span className="text-text-tertiary">└─ </span><span className="text-violet-600">.mcp.json</span> <span className="text-text-tertiary text-[11px]">— merge manually</span></div>
          )}
        </div>
        <p className="mt-3 text-[12.5px] text-text-tertiary">
          Unzip into your project root and run <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">bash install.sh</code>, or drop the folders into <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">.claude/</code> yourself. Then start Claude Code.
        </p>
      </section>

      {/* Grouped component cards */}
      {presentTypes.map((type) => {
        const items = (cart as any)[type] as any[];
        const cfg = TYPE_CONFIG[type];
        return (
          <section key={type} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5" style={{ color: cfg?.color }} dangerouslySetInnerHTML={{ __html: ICONS[type] ?? '' }} />
              <h2 className="text-[15px] font-semibold" style={{ color: cfg?.color }}>{cfg?.label ?? type}</h2>
              <span className="text-[13px] text-text-tertiary">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <div key={item.path} className="group relative flex items-start gap-3 bg-surface-1 border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]"
                    style={{ backgroundColor: `${cfg?.color}1f`, color: cfg?.color }}
                    dangerouslySetInnerHTML={{ __html: ICONS[type] ?? '' }} />
                  <div className="min-w-0 flex-1">
                    <a href={`/component/${type.replace(/s$/, '')}/${(item.path ?? '').replace(/\.(md|json)$/, '')}`}
                      className="text-[14px] font-medium text-text-primary hover:text-primary-600 transition-colors block truncate">
                      {formatName(item.name)}
                    </a>
                    {item.category && <span className="text-[12px] text-text-tertiary">{item.category}</span>}
                  </div>
                  <button onClick={() => removeItem(type, item.path)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-2 text-text-tertiary hover:text-red-500 transition-all shrink-0"
                    aria-label="Remove from workspace">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
