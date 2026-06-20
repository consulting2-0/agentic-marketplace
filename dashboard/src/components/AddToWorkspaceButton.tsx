import { useState, useEffect } from 'react';
import { isInActive, toggleInActive } from '../lib/workspace';

interface Props {
  type: string; // singular, e.g. "agent"
  path: string;
  name: string;
  category?: string;
  description?: string;
}

export default function AddToWorkspaceButton({ type, path, name, category, description }: Props) {
  const [inWs, setInWs] = useState(false);
  const [project, setProject] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setInWs(isInActive(path, type));
    sync();
    window.addEventListener('workspace-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('workspace-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [path, type]);

  function toggle() {
    const { added, projectName } = toggleInActive({ path, name, type, category, description });
    setProject(projectName);
    setToast(`${added ? 'Added to' : 'Removed from'} “${projectName}”`);
    window.clearTimeout((toggle as any)._t);
    (toggle as any)._t = window.setTimeout(() => setToast(null), 2000);
  }

  return (
    <>
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          inWs
            ? 'bg-surface-2 border border-border text-text-primary hover:border-border-hover'
            : 'bg-[#111111] hover:bg-black text-white'
        }`}
      >
        {inWs ? (
          <>
            <svg className="w-4 h-4 text-[#00b377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            In workspace
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add to workspace
          </>
        )}
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111111] text-white text-[13px] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]">
          <svg className="w-4 h-4 text-[#00E599]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span>{toast}</span>
          <a href="/workspace" className="ml-1 text-[12px] font-medium text-[#7db4ff] hover:underline">View</a>
        </div>
      )}
    </>
  );
}
