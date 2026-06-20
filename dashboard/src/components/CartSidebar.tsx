import { useState, useEffect } from 'react';
import { activeCount } from '../lib/workspace';

// Floating quick-access to the workspace page (appears once you've added something).
export default function CartSidebar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => setCount(activeCount());
    load();
    window.addEventListener('workspace-updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('workspace-updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (count === 0) return null;

  return (
    <a
      href="/workspace"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-4 pr-3 py-2.5 bg-[#111111] hover:bg-black text-white rounded-full shadow-[0_8px_28px_-6px_rgba(0,0,0,0.35)] transition-all hover:scale-105"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <span className="text-[13px] font-semibold">Workspace</span>
      <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#111111] text-[11px] font-medium flex items-center justify-center">
        {count}
      </span>
    </a>
  );
}
