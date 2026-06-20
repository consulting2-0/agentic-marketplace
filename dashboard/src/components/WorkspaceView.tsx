import { useState, useEffect } from 'react';
import { TYPE_CONFIG, ICONS } from '../lib/icons';
import {
  loadWorkspace, activeProject, projectCount, createProject, renameProject,
  deleteProject, setActive, removeItem, type Workspace, type WsProject,
} from '../lib/workspace';

const TYPE_ORDER = ['agents', 'commands', 'skills', 'hooks', 'mcps', 'settings', 'templates'];

function cleanName(item: any): string {
  return (item.name ?? item.path ?? '').replace(/\.(md|json)$/, '').split('/').pop() ?? '';
}
function formatName(name: string): string {
  if (!name) return '';
  return name.replace(/\.(md|json)$/, '').replace(/[-_]/g, ' ')
    .split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function fileLeaf(type: string, item: any): { leaf: string; isDir?: boolean } {
  const n = cleanName(item);
  if (type === 'skills') return { leaf: `${n}/`, isDir: true };
  if (type === 'hooks') return { leaf: `${n}.sh` };
  return { leaf: `${n}.md` };
}

export default function WorkspaceView() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [zipping, setZipping] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setWs(loadWorkspace());
    const onWs = ((e: CustomEvent) => setWs(e.detail as Workspace)) as EventListener;
    const reload = () => setWs(loadWorkspace());
    window.addEventListener('workspace-updated', onWs);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('workspace-updated', onWs);
      window.removeEventListener('storage', reload);
    };
  }, []);

  if (!ws) return <div className="py-20" />;

  const project = activeProject(ws);
  const presentTypes = TYPE_ORDER.filter((t) => project?.items[t]?.length > 0);
  const total = projectCount(project);
  const structureTypes = presentTypes.filter((t) => ['agents', 'commands', 'skills', 'hooks'].includes(t));
  const hasSettings = (project?.items.settings?.length ?? 0) > 0;
  const hasMcps = (project?.items.mcps?.length ?? 0) > 0;

  function addProject() {
    const name = newName.trim();
    if (!name) return;
    setWs(createProject(name));
    setNewName('');
  }
  function commitRename(id: string) {
    if (editName.trim()) setWs(renameProject(id, editName));
    setEditingId(null);
  }
  function removeProject(id: string, name: string) {
    if (!confirm(`Delete project “${name}”? This can't be undone.`)) return;
    setWs(deleteProject(id));
  }

  async function downloadZip() {
    if (zipping || total === 0) return;
    setZipping(true);
    try {
      const components = Object.entries(project.items).flatMap(([type, items]) =>
        (items ?? []).map((i: any) => ({ path: i.path, type, name: i.name }))
      );
      const res = await fetch('/api/download-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, collectionName: project.name }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Sorry — the download failed. Please try again.');
    } finally { setZipping(false); }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 py-8 min-h-[70vh]">
      {/* Sidebar: projects */}
      <aside className="md:w-64 shrink-0">
        <h1 className="text-2xl text-text-primary mb-1" style={{ fontFamily: 'var(--font-display)' }}>My Workspace</h1>
        <p className="text-[12.5px] text-text-tertiary mb-4">Projects you can install into Claude Code.</p>

        <div className="flex items-center gap-2 mb-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProject()}
            placeholder="New project…"
            className="flex-1 min-w-0 h-9 px-3 bg-surface-1 border border-border rounded-lg text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-border-hover"
            style={{ outline: 'none' }}
          />
          <button
            onClick={addProject}
            className="h-9 w-9 shrink-0 grid place-items-center rounded-lg bg-primary-500 hover:bg-primary-600 text-white"
            aria-label="Create project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <ul className="space-y-1">
          {ws.projects.map((p: WsProject) => {
            const count = projectCount(p);
            const active = p.id === ws.activeId;
            return (
              <li key={p.id}>
                <div
                  onClick={() => setWs(setActive(p.id))}
                  className={`group flex items-center gap-2 px-3 h-10 rounded-lg cursor-pointer transition-colors ${
                    active ? 'bg-primary-50 text-primary-700' : 'hover:bg-surface-2 text-text-secondary'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                  {editingId === p.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => commitRename(p.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(p.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 min-w-0 bg-transparent text-[13px] text-text-primary border-b border-border-hover"
                      style={{ outline: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1 min-w-0 truncate text-[13.5px] font-medium"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name); }}
                    >
                      {p.name}
                    </span>
                  )}
                  <span className={`text-[11px] tabular-nums ${active ? 'text-primary-600' : 'text-text-tertiary'}`}>{count}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name); }}
                    className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-primary-600 transition-all"
                    aria-label="Rename project"
                    title="Rename"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeProject(p.id, p.name); }}
                    className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-red-500 transition-all"
                    aria-label="Delete project"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main: active project */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{project.name}</h2>
            <p className="text-[13px] text-text-secondary mt-0.5">{total} component{total !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={downloadZip}
            disabled={total === 0 || zipping}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold shadow-[0_10px_28px_-10px_rgba(0,87,255,0.5)] transition-colors"
          >
            {zipping ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            )}
            {zipping ? 'Preparing…' : 'Download ZIP'}
          </button>
        </div>

        {total === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-1 py-16 text-center">
            <p className="text-[15px] text-text-primary font-medium">“{project.name}” is empty</p>
            <p className="mt-1.5 text-[13px] text-text-secondary max-w-sm mx-auto">
              Browse the catalog and click <span className="inline-flex w-5 h-5 align-middle items-center justify-center rounded bg-surface-3 text-text-secondary">+</span> on any component to add it to this project.
            </p>
            <a href="/" className="mt-5 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-medium transition-colors">Browse components</a>
          </div>
        ) : (
          <>
            {/* Project structure */}
            <section className="mb-9">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                <h3 className="text-[13px] font-semibold text-text-primary">Project structure</h3>
                <span className="text-[12px] text-text-tertiary">how your files install</span>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-5 font-mono text-[13px] leading-[1.9] overflow-x-auto">
                <div className="text-text-primary font-medium">.claude/</div>
                {structureTypes.map((t, ti) => {
                  const items = project.items[t];
                  const color = TYPE_CONFIG[t]?.color ?? '#5C5A50';
                  const lastFolder = ti === structureTypes.length - 1 && !hasSettings && !hasMcps;
                  return (
                    <div key={t}>
                      <div><span className="text-text-tertiary">{lastFolder ? '└─ ' : '├─ '}</span><span style={{ color }}>{t}/</span></div>
                      {items.map((it: any, i: number) => {
                        const f = fileLeaf(t, it);
                        const lastFile = i === items.length - 1;
                        return (
                          <div key={it.path}>
                            <span className="text-text-tertiary">{lastFolder ? '   ' : '│  '}{lastFile ? '└─ ' : '├─ '}</span>
                            <span className={f.isDir ? '' : 'text-text-secondary'} style={f.isDir ? { color } : undefined}>{f.leaf}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {hasSettings && <div><span className="text-text-tertiary">{hasMcps ? '├─ ' : '└─ '}</span><span className="text-amber-600">settings.json</span> <span className="text-text-tertiary text-[11px]">— merge manually</span></div>}
                {hasMcps && <div><span className="text-text-tertiary">└─ </span><span className="text-violet-600">.mcp.json</span> <span className="text-text-tertiary text-[11px]">— merge manually</span></div>}
              </div>
              <p className="mt-3 text-[12.5px] text-text-tertiary">
                Unzip into your project root and run <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">bash install.sh</code>, or drop the folders into <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded text-text-secondary">.claude/</code>. Then start Claude Code.
              </p>
            </section>

            {/* Grouped cards */}
            {presentTypes.map((type) => {
              const items = project.items[type];
              const cfg = TYPE_CONFIG[type];
              return (
                <section key={type} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5" style={{ color: cfg?.color }} dangerouslySetInnerHTML={{ __html: ICONS[type] ?? '' }} />
                    <h3 className="text-[15px] font-semibold" style={{ color: cfg?.color }}>{cfg?.label ?? type}</h3>
                    <span className="text-[13px] text-text-tertiary">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item: any) => (
                      <div key={item.path} className="group relative flex items-start gap-3 bg-surface-1 border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]" style={{ backgroundColor: `${cfg?.color}1f`, color: cfg?.color }} dangerouslySetInnerHTML={{ __html: ICONS[type] ?? '' }} />
                        <div className="min-w-0 flex-1">
                          <a href={`/component/${type.replace(/s$/, '')}/${(item.path ?? '').replace(/\.(md|json)$/, '')}`} className="text-[14px] font-medium text-text-primary hover:text-primary-600 transition-colors block truncate">{formatName(item.name)}</a>
                          {item.category && <span className="text-[12px] text-text-tertiary">{item.category}</span>}
                        </div>
                        <button onClick={() => setWs(removeItem(project.id, type, item.path))} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-2 text-text-tertiary hover:text-red-500 transition-all shrink-0" aria-label="Remove">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
