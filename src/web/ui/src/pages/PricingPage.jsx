import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Sparkles, Clock, AlertTriangle } from 'lucide-react';

import { API_BASE_URL } from '../apiConfig';

export default function PricingPage() {
  const [trialStatus, setTrialStatus] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setTrialStatus(data.userStatus);
        }
      } catch (err) {
        console.error("Error fetching status:", err);
      }
    };

    fetchStatus();
  }, [token, navigate]);

  const selectPlan = (planId) => {
    navigate('/checkout', { state: { plan: planId } });
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$9.99',
      period: 'month',
      description: 'Ideal for getting started and experimenting with hand-sign detection.',
      features: [
        'Unlimited real-time ASL translation',
        'Dual-hand skeleton tracking',
        'Access to 18 system signs',
        'Learn & save up to 10 custom signs',
        'Secure billing portal access'
      ],
      tag: null,
      buttonStyle: 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
    },
    {
      id: '6month',
      name: '6-Month Plan',
      price: '$49.99',
      period: '6 months',
      savings: 'Save 16%',
      description: 'Great for training stable custom models and learning extended sign vocabularies.',
      features: [
        'Everything in Monthly',
        'Priority neural rendering (Low Latency)',
        'Unlimited custom signs database',
        'Access to beta features',
        'Enhanced custom sign sensitivity'
      ],
      tag: 'POPULAR',
      buttonStyle: 'bg-emerald-500 text-black hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]'
    },
    {
      id: 'yearly',
      name: '1-Year Plan',
      price: '$79.99',
      period: 'year',
      savings: 'Save 33%',
      description: 'The ultimate subscription for full continuous sign vision developer integrations.',
      features: [
        'Everything in 6-Month',
        'Lowest latency API uplink routing',
        'Personal cloud profile backup',
        'Premium developer API key access',
        '24/7 priority support'
      ],
      tag: 'BEST VALUE',
      buttonStyle: 'bg-white text-black hover:bg-zinc-200 font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]'
    }
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col items-center">
        {/* Trial Status Header Notification */}
        {trialStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl mb-10"
          >
            {trialStatus.is_trial_active ? (
              <div className="glass border border-cyan-500/20 rounded-3xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Clock size={20} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">1-Day Free Trial is Active</span>
                    <span className="text-xs text-white/50">
                      You have {Math.ceil(trialStatus.trial_remaining / 3600)} hours remaining. Upgrade to secure permanent access.
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/detector')}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-all"
                >
                  Continue Trial
                </button>
              </div>
            ) : !trialStatus.is_sub_active ? (
              <div className="glass border border-red-500/20 rounded-3xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <AlertTriangle size={20} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Free Trial Expired</span>
                  <span className="text-xs text-white/50">
                    Your 24-hour trial period has ended. Select a plan below to continue using the hand-sign detector.
                  </span>
                </div>
              </div>
            ) : (
              <div className="glass border border-emerald-500/20 rounded-3xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Shield size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Premium Plan Active</span>
                    <span className="text-xs text-white/50">
                      Your {trialStatus.sub_plan.toUpperCase()} plan is currently active. Access is fully unlocked.
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Manage Account
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Title */}
        <div className="text-center max-w-3xl mb-16" style={{ gap: 'var(--space-base)' }}>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] font-display">Subscription Uplink</span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mt-2 mb-4">Choose Your Access Plan</h2>
          <p className="text-white/40 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Unlock the next generation of sign vision. Complete flexibility, cancel anytime, secure payments processed in real-time.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              className={`relative flex flex-col justify-between p-8 rounded-4xl border glass ${
                plan.tag === 'POPULAR' ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]' : 'border-white/5'
              }`}
            >
              {plan.tag && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${
                  plan.tag === 'POPULAR' ? 'bg-emerald-500 text-black' : 'bg-white text-black'
                }`}>
                  {plan.tag}
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">{plan.name}</span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-white font-display leading-none">{plan.price}</span>
                  <span className="text-xs text-white/30 font-semibold">/ {plan.period}</span>
                </div>
                {plan.savings && (
                  <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-md mb-4">
                    {plan.savings}
                  </span>
                )}
                <p className="text-xs text-white/50 leading-relaxed mb-6 font-sans">
                  {plan.description}
                </p>
                <div className="h-px bg-white/5 mb-6" />
                <ul className="flex flex-col gap-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-white/60">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <Check size={10} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => selectPlan(plan.id)}
                className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer select-none antigravity-lift ${plan.buttonStyle}`}
              >
                Select Uplink
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-16 flex items-center justify-center gap-2 text-white/30 text-xs">
          <Shield size={14} /> 256-Bit SSL Secure Checkout • 100% Risk Free
        </div>
      </div>
    </div>
  );
}
