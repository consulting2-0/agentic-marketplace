import { useState, useEffect, useRef, useCallback } from 'react';
import type { Component, ComponentsData } from '../lib/types';
import { TYPE_CONFIG } from '../lib/icons';
import TypeIcon from './TypeIcon';
import { COMPONENTS_JSON_URL } from '../lib/constants';

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

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ComponentsData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load data lazily on first open
  useEffect(() => {
    if (!open || data) return;

    fetch(COMPONENTS_JSON_URL)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {});
  }, [open, data]);

  // Cmd+K listener
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);

    // Also listen for search trigger button clicks
    const trigger = document.getElementById('searchTrigger');
    const handler = () => setOpen(true);
    trigger?.addEventListener('click', handler);

    return () => {
      window.removeEventListener('keydown', handleKey);
      trigger?.removeEventListener('click', handler);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search results
  const results = useCallback(() => {
    if (!data || !query.trim()) return [];

    const q = query.toLowerCase();
    const all: Component[] = [];

    for (const type of Object.keys(TYPE_CONFIG)) {
      const items = (data as any)[type] as Component[] | undefined;
      if (items) all.push(...items);
    }

    return all
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [data, query])();

  // Keyboard navigation
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      const c = results[selectedIndex];
      navigate(c);
    }
  }

  function navigate(component: Component) {
    setOpen(false);
    window.location.href = `/component/${component.type}/${cleanPath(component.path ?? component.name)}`;
  }

  // Scroll selected into view
  useEffect(() => {
    const container = resultsRef.current;
    const selected = container?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[16vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop — warm dark tint */}
      <div className="absolute inset-0 bg-[#16150F]/45 backdrop-blur-[3px]" />

      {/* Palette */}
      <div
        className="relative w-full max-w-[600px] bg-[--color-surface-1] rounded-2xl ring-1 ring-black/[0.06] shadow-[0_28px_70px_-16px_rgba(22,21,15,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 h-[60px] border-b border-[--color-border]">
          <svg className="w-[18px] h-[18px] text-[--color-text-tertiary] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search agents, skills, commands, hooks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ outline: 'none', boxShadow: 'none' }}
            className="flex-1 bg-transparent text-[15px] text-[--color-text-primary] placeholder:text-[--color-text-tertiary] border-none"
          />
          <kbd className="px-1.5 py-1 text-[10px] font-medium bg-[--color-surface-2] border border-[--color-border] rounded-md text-[--color-text-tertiary]">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div ref={resultsRef} className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
          {/* Empty state — quick links by type */}
          {!hasQuery && (
            <div>
              <p className="px-5 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[--color-text-tertiary]" style={{ fontFamily: 'var(--font-ui)' }}>
                Browse by type
              </p>
              {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                <a
                  key={type}
                  href={`/${type}`}
                  className="group/q w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-[--color-surface-2] transition-colors"
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]"
                    style={{ backgroundColor: `${config.color}1f`, color: config.color }}
                  >
                    <TypeIcon type={type} size={18} />
                  </span>
                  <span className="flex-1 text-[14px] text-[--color-text-primary]">{config.label}</span>
                  <span className="text-[--color-text-tertiary] opacity-0 group-hover/q:opacity-100 transition-opacity">→</span>
                </a>
              ))}
            </div>
          )}

          {/* No results */}
          {hasQuery && results.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-[14px] text-[--color-text-secondary]">No results for “{query}”</p>
              <p className="mt-1 text-[12px] text-[--color-text-tertiary]">Try a different keyword or browse by type.</p>
            </div>
          )}

          {/* Results */}
          {hasQuery && results.length > 0 && (
            <>
              <p className="px-5 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[--color-text-tertiary]" style={{ fontFamily: 'var(--font-ui)' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((component, i) => {
                const typePlural = component.type.endsWith('s') ? component.type : component.type + 's';
                const config = TYPE_CONFIG[typePlural];
                const selected = i === selectedIndex;
                return (
                  <button
                    key={component.path ?? `${component.name}-${i}`}
                    onClick={() => navigate(component)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`group/r relative w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                      selected ? 'bg-[--color-primary-50]' : 'hover:bg-[--color-surface-2]'
                    }`}
                  >
                    {selected && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[--color-primary-500]" />}
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]"
                      style={{ backgroundColor: config ? `${config.color}1f` : 'var(--color-surface-3)', color: config?.color ?? 'var(--color-text-tertiary)' }}
                    >
                      <TypeIcon type={typePlural} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-[--color-text-primary] truncate">{formatName(component.name)}</div>
                      {component.description && (
                        <div className="text-[12px] text-[--color-text-tertiary] truncate">{component.description}</div>
                      )}
                    </div>
                    <span className="text-[11px] text-[--color-text-tertiary] shrink-0">{config?.label ?? component.type}</span>
                    <span className={`text-[--color-primary-600] text-[13px] shrink-0 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>↵</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer — always present */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[--color-border] text-[11px] text-[--color-text-tertiary]">
          <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-[--color-surface-2] border border-[--color-border] rounded text-[10px]">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-[--color-surface-2] border border-[--color-border] rounded text-[10px]">↵</kbd> open</span>
          <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-[--color-surface-2] border border-[--color-border] rounded text-[10px]">esc</kbd> close</span>
          <span className="ml-auto font-medium" style={{ fontFamily: 'var(--font-ui)' }}>consulting<span className="text-[--color-primary-500]">2.0</span></span>
        </div>
      </div>
    </div>
  );
}
