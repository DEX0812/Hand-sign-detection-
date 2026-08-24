import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, ShieldAlert, Sparkles, Clock, Ban, ShieldCheck, Settings, RefreshCw } from 'lucide-react';

import { API_BASE_URL } from '../apiConfig';

export default function ProfilePage() {
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchStatus = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUserStatus(data.userStatus);
      }
    } catch (err) {
      console.error(err);
      setError("Cannot fetch user billing details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleCancelSub = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will maintain access until the end of your billing cycle.")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUserStatus(data.userStatus);
        setMessage("Subscription cancelled successfully.");
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || "Failed to cancel subscription.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failure while cancelling subscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateExpiry = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/simulate-expiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUserStatus(data.userStatus);
        setMessage("Simulation: Free trial and premium subscription expired!");
        setTimeout(() => setMessage(''), 4000);
      } else {
        setError("Failed to simulate subscription expiration.");
      }
    } catch (err) {
      console.error(err);
      setError("Uplink failed during expiration simulation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 flex justify-center items-center font-sans">
      <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT: User Info & Subscription Card */}
        <div className="w-full lg:flex-1 flex flex-col gap-6">
          <div className="glass-strong p-8 rounded-4xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                <User size={28} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white tracking-wide">{userStatus?.username || 'Uplink Member'}</h2>
                <span className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5"><Mail size={12} /> {userStatus?.email}</span>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Subscription status section */}
            {userStatus && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">Uplink Status</span>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-white/50">Current Plan</span>
                    <span className="text-lg font-bold text-white uppercase tracking-wide mt-0.5">
                      {userStatus.sub_plan === 'none' ? '1-Day Free Trial' : `${userStatus.sub_plan} Premium`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {userStatus.has_access ? (
                      <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={10} /> Active
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Ban size={10} /> Expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub info details */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
                  {userStatus.is_trial_active ? (
                    <>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock size={14} className="text-cyan-400" /> Trial Ends Soon
                      </span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Your free trial is active. You have {Math.ceil(userStatus.trial_remaining / 3600)} hours remaining before access is restricted.
                      </p>
                    </>
                  ) : userStatus.is_sub_active ? (
                    <>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-400" /> Premium Access Unlocked
                      </span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Next renewal date: {new Date(userStatus.sub_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                        {userStatus.sub_status === 'cancelled' && ' (Plan will cancel at end of billing cycle)'}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-red-400" /> Access Suspended
                      </span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Your free trial has ended. Subscribe to monthly or annual billing to unlock features.
                      </p>
                    </>
                  )}
                </div>

                {/* Subscription Action Button */}
                {userStatus.is_sub_active ? (
                  userStatus.sub_status !== 'cancelled' && (
                    <button 
                      onClick={handleCancelSub}
                      disabled={isLoading}
                      className="w-full py-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-bold uppercase tracking-widest text-xs rounded-2xl transition-all cursor-pointer mt-2"
                    >
                      Cancel Subscription
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => navigate('/pricing')}
                    disabled={isLoading}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer mt-2"
                  >
                    Upgrade to Premium
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: System Notification Messages & Dev Tools Sandbox */}
        <div className="w-full lg:w-[360px] flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {(message || error) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-5 rounded-3xl border flex items-start gap-3 text-xs leading-relaxed ${
                  error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{error || message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sandbox Testing Dashboard Widget */}
          <div className="glass p-6 rounded-3xl border border-dashed border-white/20 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
              <Settings size={14} /> Developer Sandbox Controls
            </div>
            
            <p className="text-[10px] text-white/40 leading-relaxed">
              Use these buttons to instantly trigger different trial and subscription states on the database for testing and demonstration.
            </p>

            <button
              onClick={handleSimulateExpiry}
              disabled={isLoading}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Simulate Account Expiry
            </button>

            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="w-full py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Sync Neural Link
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
