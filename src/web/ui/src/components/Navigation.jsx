import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronRight, LayoutDashboard, Globe } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const isAdmin = localStorage.getItem('adminToken') === 'true';

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'DETECTOR', path: '/detector' },
    { name: 'RESEARCH', path: '#tech' }, // Anchor link for tech section
    { name: 'CONTACT', path: '/contact' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userToken');
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 p-8 flex justify-center pointer-events-none">
      <div className="max-w-7xl w-full flex justify-between items-center bg-black/20 backdrop-blur-2xl border border-white/5 px-8 py-4 rounded-2xl pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-9 h-9 rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center text-black font-bold text-lg group-hover:scale-110 transition-transform">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.2em] text-white/90 font-display leading-tight uppercase">SIGN<span className="text-white">VISION</span></span>
            <span className="text-[7px] font-mono tracking-[0.4em] text-white/30 font-bold uppercase">Event Horizon v1.0</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.path.startsWith('#') ? '/' : link.path}
              onClick={() => {
                if(link.path.startsWith('#')) {
                   setTimeout(() => document.getElementById(link.path.substring(1))?.scrollIntoView({behavior: 'smooth'}), 100);
                }
              }}
              className={`text-[10px] font-bold tracking-[0.2em] transition-all hover:text-white ${location.pathname === link.path ? 'text-white' : 'text-white/40'}`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-4 w-px bg-white/10" />

          {isAdmin ? (
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg text-[10px] font-bold tracking-widest hover:bg-white/10 transition-all">
                <LayoutDashboard size={12} /> DASHBOARD
              </Link>
              <button onClick={handleLogout} className="p-2 text-white/40 hover:text-red-400 transition-colors cursor-pointer">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/40 hover:text-white transition-all group">
              <User size={14} className="group-hover:text-white" /> LOGIN
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-white/60 hover:text-white cursor-pointer"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-6 right-6 mt-2 glass-strong rounded-3xl border border-white/10 p-8 flex flex-col gap-6 lg:hidden pointer-events-auto shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold font-display text-white tracking-widest flex justify-between items-center group"
              >
                {link.name} <ChevronRight size={18} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
            <div className="h-px w-full bg-white/5" />
            {isAdmin ? (
              <button onClick={handleLogout} className="text-red-400 font-bold tracking-widest text-left flex items-center gap-2">
                <LogOut size={18} /> LOGOUT
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-white font-bold tracking-widest flex items-center gap-2">
                <User size={18} /> LOGIN
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
