import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../common/Avatar';
import { Layers, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { email: 'alex@kortex.dev', name: 'Alex Rivera', role: 'Product Lead & Owner', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { email: 'maya@kortex.dev', name: 'Maya Lin', role: 'Senior Fullstack Dev', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
    { email: 'jordan@kortex.dev', name: 'Jordan Smith', role: 'Frontend Architect', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { email: 'devon@kortex.dev', name: 'Devon Vance', role: 'DevOps & SRE Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { email: 'priya@kortex.dev', name: 'Priya Patel', role: 'QA Lead', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name, orgName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      setError('Demo login failed. Make sure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070b12] select-none">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-[#0e1626] border border-[#202e48] rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side: Brand presentation */}
        <div className="p-8 bg-gradient-to-br from-indigo-950/60 via-[#101726] to-[#090e18] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#202e48]">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
                <Layers className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Kortex</span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight leading-snug pt-4">
              All-in-one work & agile engineering platform.
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combining Jira's agile sprint depth with ClickUp's flexible multi-view hierarchy, real-time presence, and customizable workflows.
            </p>
          </div>

          {/* Demo Login Quick Switcher */}
          <div className="pt-6 space-y-2">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
              ⚡ Quick Demo Sign-In
            </span>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={loading}
                  className="w-full p-2 rounded-xl bg-[#141e30] hover:bg-[#1a2740] border border-[#233555] flex items-center justify-between text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={acc.name} avatarUrl={acc.avatar} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{acc.role}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 flex flex-col justify-center space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">
              {isRegister ? 'Create your workspace' : 'Welcome back'}
            </h2>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isRegister ? 'Sign in instead' : 'Create an account'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Organization Name</label>
                  <input
                    type="text"
                    placeholder="Acme Technologies"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@kortex.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Get Started Free' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
