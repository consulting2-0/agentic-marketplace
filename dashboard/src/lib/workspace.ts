// Local, no-login multi-project workspace.
// A "project" is a named bundle (like a Claude Code project) holding components
// grouped by type. The user adds components from the catalog to the ACTIVE project.

export interface WsItem {
  path: string;
  name: string;
  type: string; // plural, e.g. "agents"
  category?: string;
  description?: string;
}
export interface WsProject {
  id: string;
  name: string;
  items: Record<string, WsItem[]>;
}
export interface Workspace {
  activeId: string;
  projects: WsProject[];
}

const KEY = 'claudeWorkspace';
const OLD_KEY = 'claudeCodeCart';
export const WS_TYPES = ['agents', 'commands', 'skills', 'hooks', 'mcps', 'settings', 'templates'];

function emptyItems(): Record<string, WsItem[]> {
  return { agents: [], commands: [], skills: [], hooks: [], mcps: [], settings: [], templates: [] };
}
function uid(): string {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}
function plural(type: string): string {
  return type.endsWith('s') ? type : `${type}s`;
}

function write(ws: Workspace) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ws));
  } catch {}
}
function emit(ws: Workspace) {
  window.dispatchEvent(new CustomEvent('workspace-updated', { detail: ws }));
}
export function save(ws: Workspace) {
  write(ws);
  emit(ws);
}

export function loadWorkspace(): Workspace {
  if (typeof localStorage === 'undefined') return { activeId: '', projects: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const ws = JSON.parse(raw) as Workspace;
      if (ws && Array.isArray(ws.projects) && ws.projects.length) {
        if (!ws.activeId || !ws.projects.some((p) => p.id === ws.activeId)) {
          ws.activeId = ws.projects[0].id;
        }
        return ws;
      }
    }
  } catch {}

  // Migrate the old single stack into a first project, if present.
  const items = emptyItems();
  try {
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const cart = JSON.parse(old);
      for (const t of WS_TYPES) {
        if (Array.isArray(cart[t]) && cart[t].length) {
          items[t] = cart[t].map((i: any) => ({ ...i, type: t }));
        }
      }
    }
  } catch {}

  const proj: WsProject = { id: uid(), name: 'My first project', items };
  const ws: Workspace = { activeId: proj.id, projects: [proj] };
  write(ws);
  return ws;
}

export function activeProject(ws: Workspace): WsProject {
  return ws.projects.find((p) => p.id === ws.activeId) ?? ws.projects[0];
}
export function projectCount(p?: WsProject): number {
  if (!p) return 0;
  return Object.values(p.items).reduce((s, a) => s + (a?.length ?? 0), 0);
}
export function activeCount(): number {
  return projectCount(activeProject(loadWorkspace()));
}

export function createProject(name: string): Workspace {
  const ws = loadWorkspace();
  const proj: WsProject = { id: uid(), name: name.trim() || 'Untitled project', items: emptyItems() };
  ws.projects.push(proj);
  ws.activeId = proj.id;
  save(ws);
  return ws;
}
export function renameProject(id: string, name: string): Workspace {
  const ws = loadWorkspace();
  const p = ws.projects.find((x) => x.id === id);
  if (p) p.name = name.trim() || p.name;
  save(ws);
  return ws;
}
export function deleteProject(id: string): Workspace {
  const ws = loadWorkspace();
  ws.projects = ws.projects.filter((p) => p.id !== id);
  if (!ws.projects.length) {
    const np: WsProject = { id: uid(), name: 'My first project', items: emptyItems() };
    ws.projects.push(np);
    ws.activeId = np.id;
  } else if (!ws.projects.some((p) => p.id === ws.activeId)) {
    ws.activeId = ws.projects[0].id;
  }
  save(ws);
  return ws;
}
export function setActive(id: string): Workspace {
  const ws = loadWorkspace();
  if (ws.projects.some((p) => p.id === id)) ws.activeId = id;
  save(ws);
  return ws;
}

export function isInActive(path: string, type: string): boolean {
  const p = activeProject(loadWorkspace());
  const tp = plural(type);
  return p?.items[tp]?.some((i) => i.path === path) ?? false;
}

// Toggle a component in the active project. Returns whether it was added and the project name.
export function toggleInActive(component: {
  path: string; name: string; type: string; category?: string; description?: string;
}): { added: boolean; projectName: string } {
  const ws = loadWorkspace();
  const p = activeProject(ws);
  const tp = plural(component.type);
  if (!p.items[tp]) p.items[tp] = [];
  const exists = p.items[tp].some((i) => i.path === component.path);
  if (exists) {
    p.items[tp] = p.items[tp].filter((i) => i.path !== component.path);
  } else {
    p.items[tp].push({
      path: component.path, name: component.name, type: tp,
      category: component.category, description: component.description,
    });
  }
  save(ws);
  return { added: !exists, projectName: p.name };
}

export function removeItem(projectId: string, type: string, path: string): Workspace {
  const ws = loadWorkspace();
  const p = ws.projects.find((x) => x.id === projectId);
  if (p && p.items[type]) p.items[type] = p.items[type].filter((i) => i.path !== path);
  save(ws);
  return ws;
}
