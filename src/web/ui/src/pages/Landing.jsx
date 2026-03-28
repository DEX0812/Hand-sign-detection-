import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, ShieldCheck, Zap, Layers, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import detectionExample from '../assets/hand_sign.jpg';
import TechStack from '../components/TechStack';
import Footer from '../components/Footer';

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass p-8 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:bg-white/5 transition-all"
  >
    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold font-display text-white">{title}</h3>
    <p className="text-sm text-white/40 leading-relaxed font-sans">{desc}</p>
  </motion.div>
);

export default function Landing() {
  return (
    <div className="w-full pt-20 flex flex-col items-center">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-32 lg:py-48 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-fit px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-[0.3em]"
            >
              Neural Vision v4.0 Active
            </motion.div>
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black font-display text-white! leading-tight tracking-tighter">
              The Matrix of <span className="text-emerald-400 underline decoration-emerald-500/20 underline-offset-16">Sign Language.</span>
            </h1>
            <p className="text-xl text-white/30 leading-relaxed max-w-lg mt-8 font-sans font-light">
              Experience the next evolution of human interaction. Decipher complex hand gestures in real-time with our zero-latency neural core.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/detector" className="group px-8 py-5 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_#10b98144] hover:shadow-[0_0_50px_#10b98166]">
              Launch Detector <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#tech" className="px-8 py-5 glass border border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center">
              The Architecture
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="relative glass-strong p-2 rounded-4xl overflow-hidden border border-white/10 shadow-2xl">
            <img 
              src={detectionExample} 
              alt="Hand Sign Detection Example" 
              className="w-full h-auto rounded-3xl opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-linear-to-t from-emerald-500/20 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/50 shadow-[0_0_15px_#34d399] animate-[scan_3s_ease-in-out_infinite]" />
          </div>
        </motion.div>
      </section>

      {/* Metrics Strip */}
      <section className="w-full border-y border-white/5 bg-white/2 py-12 mb-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-display font-bold text-white">99.2%</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Accuracy</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-display font-bold text-white">15ms</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Latency</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-display font-bold text-white">21 pts</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Tracking</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-display font-bold text-white">WASM</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Engine</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-8 mb-64">
        <div className="flex flex-col items-center text-center gap-6 mb-32">
          <span className="text-[10px] uppercase tracking-[0.6em] font-bold text-emerald-400 opacity-60">Capabilities</span>
          <h2 className="text-5xl lg:text-7xl font-bold font-display text-white tracking-tighter">Engineered for <span className="text-emerald-400">Precision.</span></h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Zap} title="Instant Deciphering" 
            desc="Recognize complex hand signs in milliseconds using our optimized neural inference engine running directly in your hardware."
            delay={0.1}
          />
          <FeatureCard 
            icon={Layers} title="Custom Pattern Training" 
            desc="Exclusively for admins: capture and train the system on unique hand signs through our intuitive kinetic recording interface."
            delay={0.2}
          />
          <FeatureCard 
            icon={ShieldCheck} title="Privacy by Design" 
            desc="All visual processing happens locally on your device. We never transmit video streams to our servers — guaranteed."
            delay={0.3}
          />
          <FeatureCard 
            icon={Cpu} title="Hybrid Computation" 
            desc="Seamlessly switching between rule-based geometry and deep learning to achieve maximum stability and low-light performance."
            delay={0.4}
          />
          <FeatureCard 
            icon={Activity} title="Kinetic Skeleton" 
            desc="Track 21 unique landmarks in 3D space with sub-pixel accuracy, ensuring every finger joint movement is accounted for."
            delay={0.5}
          />
          <FeatureCard 
            icon={ArrowRight} title="Future Ready" 
            desc="Built on standards like Mediapipe and TensorFlow.js, SignVision is ready for integration into any VR/AR ecosystem."
            delay={0.6}
          />
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="w-full block h-auto relative">
        <TechStack />
      </section>

      {/* CTA Section - Absolute Flow Reset */}
      <section id="cta-banner" className="max-w-5xl mx-auto px-6 w-full mt-36 mb-36 block h-auto relative">
        <div className="glass-strong p-16 rounded-[4rem] border border-white/10 text-center flex flex-col items-center justify-center gap-8 relative overflow-hidden h-auto min-h-[400px]">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] pointer-events-none" />
          <h2 className="text-4xl lg:text-6xl font-bold font-display text-white! relative">Start Translating <br/> <span className="text-emerald-400">Today.</span></h2>
          <p className="text-lg text-white/30 max-w-xl font-sans italic relative">
            Join the research frontier and help us bridge the gap between silence and speech through the power of kinetic vision.
          </p>
          <Link to="/detector" className="px-10 py-5 bg-white text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 cursor-pointer flex items-center gap-3 relative">
            Enter the Matrix <Zap size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
