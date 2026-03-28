import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Phone, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

const InputField = ({ label, type = 'text', placeholder, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
      placeholder={placeholder}
    />
  </div>
);

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Simulate API call
    setTimeout(() => {
      setForm({ name: '', email: '', message: '' });
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-48 pb-32 px-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-32 items-center mb-48">
        
        {/* Left: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-bold font-display text-white!">Get in <span className="text-emerald-400">Touch</span></h1>
            <p className="text-lg text-white/40 leading-relaxed max-w-sm">
              Whether you're exploring partnership opportunities or need technical support, our research team is here to help.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Headquarters</span>
                <span className="text-white/80">CGC University, Mohali</span>
              </div>
            </div>
            
            <div className="flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Email</span>
                <span className="text-white/80">sainiharsh1818@gmail.com</span>
              </div>
            </div>

            <div className="flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Phone</span>
                <span className="text-white/80">+91 8837543974</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Form */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0, y: 20 }}
                className="glass-strong p-10 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Name" placeholder="John Doe" value={form.name} onChange={v => setForm({...form, name: v})} />
                  <InputField label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={v => setForm({...form, email: v})} />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Message</label>
                  <textarea 
                    rows="4"
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 cursor-pointer"
                >
                  Send Message <Send size={20} />
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-strong p-12 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl flex flex-col items-center justify-center text-center gap-6 h-full min-h-[460px]"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent</h3>
                  <p className="text-white/40">We'll get back to you within 24 neural cycles.</p>
                </div>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-8 py-3 rounded-xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                >
                  New Request <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
