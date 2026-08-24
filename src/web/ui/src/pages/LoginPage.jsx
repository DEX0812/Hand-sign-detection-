import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, Mail, ArrowRight, AlertCircle } from 'lucide-react';

import { API_BASE_URL } from '../apiConfig';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username.trim() || !password.trim() || (isRegister && !email.trim())) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister 
        ? { username: username.trim(), email: email.trim(), password }
        : { username: username.trim(), password };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success') {
        if (data.isAdmin) {
          localStorage.setItem('adminToken', 'true');
          localStorage.removeItem('userToken');
          localStorage.removeItem('username');
          localStorage.removeItem('token');
          navigate('/admin');
        } else {
          localStorage.setItem('userToken', 'true');
          localStorage.setItem('username', data.username);
          localStorage.setItem('token', data.token);
          localStorage.removeItem('adminToken');
          
          // Let navigation update
          window.dispatchEvent(new Event('storage'));
          
          navigate('/detector');
        }
      } else {
        setError(data.message || 'An error occurred during authentication.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center" style={{ marginBottom: 'calc(var(--space-base) * 2.5)' }}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto" style={{ marginBottom: 'calc(var(--space-base) * 1.5)' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold font-display text-white" style={{ marginBottom: 'calc(var(--space-base) * 0.5)' }}>
            {isRegister ? 'Create Account' : 'Security Terminal'}
          </h1>
          <p className="text-white/40 text-sm">
            {isRegister ? 'Register to start your 1-day free trial.' : 'Secure authorization required for uplink access.'}
          </p>
        </div>

        <form 
          onSubmit={handleLogin} 
          className="glass-strong p-8 rounded-4xl border border-white/10 shadow-2xl flex flex-col"
          style={{ gap: 'calc(var(--space-base) * 1.25)' }}
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-pulse"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col" style={{ gap: 'calc(var(--space-base) * 0.4)' }}>
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
                placeholder={isRegister ? "Choose a username" : "Enter username"}
              />
            </div>
          </div>

          <AnimatePresence>
            {isRegister && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col overflow-hidden"
                style={{ gap: 'calc(var(--space-base) * 0.4)' }}
              >
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="off"
                    disabled={isLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                    placeholder="you@example.com"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col" style={{ gap: 'calc(var(--space-base) * 0.4)' }}>
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
            className={`w-full py-4 rounded-2xl font-bold transition-all mt-2 antigravity-lift ${
              isLoading ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-white text-black hover:bg-emerald-400 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            }`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--space-base) * 0.5)' }}
          >
            {isLoading ? 'Processing...' : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-white/60 hover:text-emerald-400 font-semibold cursor-pointer transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        <p className="mt-8 text-center text-white/20 text-[10px] uppercase tracking-widest font-mono">
          Uplink Link Secured • AES-256 Encryption
        </p>
      </motion.div>
    </div>
  );
}
