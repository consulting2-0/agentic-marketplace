import { useState, useEffect } from 'react';
import { TYPE_CONFIG } from '../lib/icons';

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
}

interface FeaturedComponent {
  id: string;
  name: string;
  path: string;
  type: string;
  category: string | null;
  description: string | null;
  downloads: number;
  platform: string;
  github_url: string | null;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function formatName(name: string) {
  return name.replace(/\.(md|json)$/, '').replace(/[-_]/g, ' ')
    .split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function ItemCard({ item }: { item: FeaturedItem }) {
  const url = item.github_url || item.website_url || '#';
  const isGitHub = !!item.github_url;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
      style={{ background: '#0D1117', border: '1px solid #1C2433' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2A3550')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1C2433')}
    >
      {/* Logo / GitHub avatar */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ background: '#111827', border: '1px solid #1C2433' }}>
        {item.logo_url ? (
          <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain p-1" />
        ) : (
          <span style={{ color: '#4D6080' }}><GitHubIcon /></span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-[#E4EBF8] truncate">{item.name}</span>
          {item.tag && (
            <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'rgba(0,87,255,0.12)', color: '#60A5FA', border: '1px solid rgba(0,87,255,0.2)' }}>
              {item.tag}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#4D6080' }}>{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isGitHub && <span style={{ color: '#4D6080' }}><GitHubIcon /></span>}
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#4D6080' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}

function ComponentCard({ component }: { component: FeaturedComponent }) {
  const config = TYPE_CONFIG[component.type + 's'] ?? TYPE_CONFIG[component.type];
  const href = `/component/${component.type}/${component.path.replace(/\.(md|json)$/, '')}`;

  return (
    <a
      href={href}
      className="group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
      style={{ background: '#0D1117', border: '1px solid #1C2433' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2A3550')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1C2433')}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4"
        style={{ background: `${config?.color ?? '#60A5FA'}12`, color: config?.color ?? '#60A5FA' }}
        dangerouslySetInnerHTML={{ __html: (TYPE_CONFIG[component.type + 's'] ?? TYPE_CONFIG[component.type])
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${getIconPath(component.type)}</svg>`
          : '' }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-[#E4EBF8] truncate">{formatName(component.name)}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded capitalize shrink-0"
            style={{ background: `${config?.color ?? '#60A5FA'}12`, color: config?.color ?? '#60A5FA' }}>
            {component.type}
          </span>
        </div>
        {component.description && (
          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#4D6080' }}>{component.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {component.github_url && (
          <a href={component.github_url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: '#4D6080' }}>
            <GitHubIcon />
          </a>
        )}
        {component.downloads > 0 && (
          <span className="text-[10px] tabular-nums" style={{ color: '#4D6080' }}>
            ↓{component.downloads >= 1000 ? `${(component.downloads / 1000).toFixed(1)}k` : component.downloads}
          </span>
        )}
      </div>
    </a>
  );
}

// Minimal inline icon paths for featured cards
function getIconPath(type: string): string {
  const paths: Record<string, string> = {
    skill: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    agent: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><path d="M9 17h6"/>',
    command: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    mcp: '<path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242"/><path d="M12 12v9"/><path d="M8 17l4 4 4-4"/>',
    hook: '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',
  };
  return paths[type] ?? paths.skill;
}

export default function FeaturedSection() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [components, setComponents] = useState<FeaturedComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/featured')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setComponents(data.components ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allEmpty = !loading && items.length === 0 && components.length === 0;
  if (allEmpty) return null;

  return (
    <section className="px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold" style={{ color: '#E4EBF8' }}>Featured</h2>
        {(items.length + components.length) > 6 && (
          <span className="text-[11px]" style={{ color: '#4D6080' }}>
            {items.length + components.length} items
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[56px] rounded-xl animate-pulse" style={{ background: '#111827' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
          {components.map((c) => <ComponentCard key={c.id} component={c} />)}
        </div>
      )}
    </section>
  );
}
