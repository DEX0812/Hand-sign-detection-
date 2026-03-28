import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Admin: DEX / 0...DeX...9
    if (username === 'DEX' && password === '0...DeX...9') {
      setTimeout(() => {
        localStorage.setItem('adminToken', 'true');
        navigate('/admin');
      }, 800);
    } else if (username.trim() && password.trim()) {
      // Any other non-empty credentials log in as a normal user
      setTimeout(() => {
        localStorage.setItem('userToken', 'true');
        navigate('/detector');
      }, 800);
    } else {
      setTimeout(() => {
        setError('Please enter both username and password.');
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center" style={{ marginBottom: 'calc(var(--space-base) * 3)' }}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto" style={{ marginBottom: 'calc(var(--space-base) * 1.5)' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold font-display text-white" style={{ marginBottom: 'calc(var(--space-base) * 0.5)' }}>Admin Terminal</h1>
          <p className="text-white/40 text-sm">Secure authorization required for dashboard access.</p>
        </div>

        <form 
          onSubmit={handleLogin} 
          className="glass-strong p-8 rounded-4xl border border-white/10 shadow-2xl flex flex-col"
          style={{ gap: 'calc(var(--space-base) * 1.5)' }}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <div className="flex flex-col" style={{ gap: 'calc(var(--space-base) * 0.5)' }}>
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Username</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                <User size={18} />
              </div>
              <input 
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                placeholder="Enter admin name"
              />
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: 'calc(var(--space-base) * 0.5)' }}>
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                <Lock size={18} />
              </div>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold transition-all antigravity-lift ${
              isLoading ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-white text-black hover:bg-emerald-400 active:scale-95 cursor-pointer'
            }`}
            style={{ marginTop: 'calc(var(--space-base) * 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--space-base) * 0.5)' }}
          >
            {isLoading ? 'Authenticating...' : (
              <>
                Sign In <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-white/20 text-xs">
          Authorized personnel only. All access attempts are logged.
        </p>
      </motion.div>
    </div>
  );
}
