import { useState } from 'react';

export default function AdminLogin({ onLogin }: { onLogin: (pw: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);
    // Verify by hitting the API
    const res = await fetch('/api/admin/components?limit=1', {
      headers: { 'x-admin-password': password },
    });
    if (res.ok) {
      sessionStorage.setItem('admin_pw', password);
      onLogin(password);
    } else {
      setError(true);
    }
    setChecking(false);
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            Admin <span style={{ color: '#00E599' }}>Panel</span>
          </div>
          <p className="text-[13px] text-[#4D6080]">Consulting 2.0 Content Management</p>
        </div>
        <form onSubmit={submit} className="bg-[#111827] border border-[#1C2433] rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-[11px] text-[#4D6080] mb-1.5 uppercase tracking-wider">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-[#0D1117] border border-[#1C2433] rounded-lg text-[13px] text-[#E4EBF8] px-3 py-2.5 outline-none focus:border-[#2A3550] placeholder:text-[#4D6080]"
              placeholder="Enter admin password"
            />
            {error && <p className="mt-1.5 text-[11px] text-red-400">Incorrect password</p>}
          </div>
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full py-2.5 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{ background: '#0057FF', color: 'white' }}
          >
            {checking ? 'Checking...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
