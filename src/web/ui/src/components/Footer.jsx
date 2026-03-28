import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Youtube, Mail, MapPin, ExternalLink, Shield, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative glass border-t border-white/5 pt-32 pb-16 px-8 overflow-hidden">
      <div className="absolute inset-0 bg-emerald-500/5 blur-[160px] -z-10 opacity-20" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
        {/* Brand Column */}
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-bold">
              V
            </div>
            <span className="text-sm font-bold tracking-[0.2em] text-white/90 font-display uppercase">
              SIGN<span className="text-emerald-400">VISION</span>
            </span>
          </Link>
          <p className="text-sm text-white/30 leading-relaxed max-w-xs font-sans">
            Advancing the frontier of human-machine interaction through real-time hand gesture recognition and accessible neural computing.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><Github size={18} /></a>
            <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><Twitter size={18} /></a>
            <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><Youtube size={18} /></a>
          </div>
        </div>

        {/* Navigation Column */}
        <div className="flex flex-col gap-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Application</h4>
          <ul className="flex flex-col gap-4">
            <li><Link to="/" className="text-sm text-white/40 hover:text-white transition-colors">Home Landing</Link></li>
            <li><Link to="/detector" className="text-sm text-white/40 hover:text-white transition-colors">Live Recognition</Link></li>
            <li><Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors">Admin Dashboard</Link></li>
            <li><Link to="/contact" className="text-sm text-white/40 hover:text-white transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        {/* Features Column */}
        <div className="flex flex-col gap-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Technology</h4>
          <ul className="flex flex-col gap-4 text-sm text-white/40">
            <li className="flex items-center gap-3 hover:text-white transition-colors"><Shield size={12} /> Privacy First Processing</li>
            <li className="flex items-center gap-3 hover:text-white transition-colors">Neural Geometric Analysis</li>
            <li className="flex items-center gap-3 hover:text-white transition-colors">Multi-Hand Support (BETA)</li>
            <li className="flex items-center gap-3 hover:text-white transition-colors">Custom Dataset Training</li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="flex flex-col gap-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Join the Lab</h4>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 text-sm text-white/40 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500">
                <MapPin size={18} />
              </div>
              <span className="leading-tight">CGC University, Mohali</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/40 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500">
                <Mail size={18} />
              </div>
              <span className="leading-tight">sainiharsh1818@gmail.com</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/40 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500">
                <Phone size={16} />
              </div>
              <span className="leading-tight">+91 8837543974</span>
            </div>
          </div>
          <div className="mt-2 glass p-1 rounded-xl flex">
              <input type="text" placeholder="Email Newsletter" className="bg-transparent px-3 flex-1 text-xs outline-none text-white" />
              <button className="px-4 py-2 bg-emerald-500 text-black text-[10px] font-bold rounded-lg uppercase tracking-wider">Join</button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">
          © {currentYear} SignVision AI. All signatures authenticated.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest font-mono">Privacy Policy</a>
          <a href="#" className="text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest font-mono">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
