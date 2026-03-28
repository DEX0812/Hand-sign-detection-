import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Activity, Database, Fingerprint, Zap, Globe } from 'lucide-react';

const TechCard = ({ icon: Icon, title, items, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass p-8 rounded-3xl border border-white/5 flex flex-col gap-6 group hover:border-emerald-500/20"
  >
    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      <Icon size={28} />
    </div>
    <div className="flex flex-col gap-2">
      <h3 className="text-xl font-bold font-display text-white">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-white/30 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default function TechStack() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 h-auto">
      <div className="flex flex-col items-center text-center gap-6 mb-24">
        <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-emerald-400">The Neural Core</span>
        <h2 className="text-4xl lg:text-6xl font-black font-display text-white tracking-tight">Built on <span className="text-emerald-400">Advanced Architecture</span></h2>
        <p className="text-lg text-white/30 max-w-2xl font-sans mt-2 italic leading-relaxed">
          SignVision leverages cutting-edge geometry analysis and edge-computing to ensure speed without compromising security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6 h-fit">
        <TechCard 
          icon={Layers}
          title="Neural Processing"
          items={["TensorFlow BlazePalm Model", "Asynchronous WASM Execution", "Real-time Quantization"]}
          delay={0.1}
        />
        <TechCard 
          icon={Database}
          title="Custom Datasets"
          items={["Dynamic Pattern Serialization", "JSON-based Config Persistence", "Distance Normalization"]}
          delay={0.2}
        />
        <TechCard 
          icon={Fingerprint}
          title="Kinetic Identity"
          items={["21-Point Landmark Tracking", "3D Coordinate Analysis", "Stabilized Smoothing Algorithm"]}
          delay={0.3}
        />
        <TechCard 
          icon={Activity}
          title="Edge Performance"
          items={["Zero-latency Local Logic", "GPU Accelerated Rendering", "Optimized Web workers"]}
          delay={0.4}
        />
        <TechCard 
          icon={Zap}
          title="Adaptive Rules"
          items={["Context-aware Smoothing", "Conflict Resolving Logic", "Dynamic Thresholding"]}
          delay={0.5}
        />
        <TechCard 
          icon={Globe}
          title="Global Access"
          items={["Unified Sign Registry", "System Override Controls", "Multi-role Access Layers"]}
          delay={0.6}
        />
      </div>
    </div>
  );
}
