import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Check, X, Save, Plus, Camera, Search, RefreshCw, Zap } from 'lucide-react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useMouseParallax } from '../hooks/useMouseParallax';
import { Settings, ExternalLink, ShieldCheck } from 'lucide-react';

// NUCLEAR CACHE KILLER: Run immediately on script load
if (typeof window !== 'undefined') {
  localStorage.removeItem('SIGNVISION_API_URL');
}

const SOCKET_URL = 'https://hand-sign-detection-4pz0.onrender.com';

export default function AdminDashboard() {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseParallax(8);
  const [signs, setSigns] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [newSignLabel, setNewSignLabel] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('');
  const [editingSign, setEditingSign] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(SOCKET_URL);

  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const latestLandmarksRef = useRef([]);
  const rafRef = useRef(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    fetchSigns();
    initMediaPipe();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const initMediaPipe = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm");
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO", numHands: 1
      });
      setIsMediaPipeReady(true);
    } catch (err) {
      console.error("MediaPipe Init Error (Admin):", err);
    }
  };

  const fetchSigns = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/signs`);
      const data = await res.json();
      setSigns(data.signs || []);
    } catch (err) { console.error(err); }
  };

  const captureFrame = useCallback(() => {
    if (!isCapturing || !videoRef.current || !landmarkerRef.current) return;
    const video = videoRef.current;
    
    if (video.readyState >= 2) {
      frameCountRef.current++;
      
      // Throttled Admin Viewport (20 FPS)
      if (frameCountRef.current % 3 === 0) {
        const results = landmarkerRef.current.detectForVideo(video, performance.now());
        latestLandmarksRef.current = results.landmarks?.[0] || [];
      }
    }
    rafRef.current = requestAnimationFrame(captureFrame);
  }, [isCapturing]);

  useEffect(() => {
    if (isCapturing) rafRef.current = requestAnimationFrame(captureFrame);
    else if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [isCapturing, captureFrame]);

  const toggleCamera = async () => {
    if (isCapturing) {
      setIsCapturing(false);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsCapturing(true);
    }
  };

  const handleCreateSign = async () => {
    if (!newSignLabel.trim()) return;
    const lm = latestLandmarksRef.current;
    if (!lm || lm.length === 0) { setTrainingStatus('No hand detected'); return; }
    setTrainingStatus('Saving...');
    try {
      const res = await fetch(`${SOCKET_URL}/train/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ label: newSignLabel.trim().toUpperCase(), landmarks: lm, handedness: 'Right' })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText || 'Unknown Error'}`);
      }
      
      const data = await res.json();
      if (data.status === 'success') {
        setTrainingStatus('✓ Done');
        setNewSignLabel('');
        fetchSigns();
        setTimeout(() => setTrainingStatus(''), 2000);
      } else {
        throw new Error(data.message || 'Back-end rejected the save.');
      }
    } catch (err) { 
      setTrainingStatus(`Error: ${err.message}`);
      console.error("Critical Saving Failure:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove/disable this sign?')) return;
    try {
      const res = await fetch(`${SOCKET_URL}/signs/${id}`, { method: 'DELETE' });
      if ((await res.json()).status === 'success') fetchSigns();
    } catch (err) { console.error(err); }
  };

  const handleRename = async () => {
    if (!editingSign?.new.trim()) return;
    try {
      const res = await fetch(`${SOCKET_URL}/signs/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_label: editingSign.old, new_label: editingSign.new.trim().toUpperCase() })
      });
      if ((await res.json()).status === 'success') {
        setEditingSign(null);
        fetchSigns();
      }
    } catch (err) { console.error(err); }
  };

  const filteredSigns = signs.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.current.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12" style={{ gap: 'calc(var(--space-base) * 2)' }}>
        
        {/* LEFT: Management Panel */}
        <div className="lg:col-span-7 flex flex-col" style={{ gap: 'calc(var(--space-base) * 1.5)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              <h1 className="text-3xl font-bold font-display text-white">Sign Database</h1>
              <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`p-1.5 rounded-lg transition-colors ${showConfig ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/20 hover:text-white'}`}
              >
                <Settings size={20} />
              </button>
            </div>
            <button onClick={fetchSigns} className="p-2 text-white/20 hover:text-emerald-400 transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>

          {showConfig && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="glass p-6 rounded-2xl border border-cyan-500/20 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck size={14} /> Production Neural Link
              </div>
              <p className="text-xs text-white/40 leading-relaxed font-sans">
                If the detector is working but the database reveals a "Failed to Fetch" error, 
                paste your Render Backend URL here and click save.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="https://your-api.onrender.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none font-mono"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                />
                <button 
                  onClick={() => {
                    localStorage.setItem('SIGNVISION_API_URL', customApiUrl);
                    window.location.reload();
                  }}
                  className="px-6 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 transition-all"
                >
                  Save & Connect
                </button>
              </div>
            </motion.div>
          )}

          <div className="glass px-6 py-4 flex items-center rounded-2xl border border-white/5 antigravity-lift" style={{ gap: 'var(--space-base)' }}>
            <Search className="text-white/20" size={20} />
            <input 
              type="text"
              placeholder="Filter signs by ID or current label..."
              className="bg-transparent border-none outline-none text-white w-full font-sans text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col max-h-[60vh] overflow-y-auto pr-3 custom-scroll" style={{ gap: 'var(--space-base)' }}>
            <AnimatePresence>
              {filteredSigns.map((sign) => (
                <motion.div 
                  className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors antigravity-lift"
                >
                  <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xl text-white">
                      {sign.current[0]}
                    </div>
                    {editingSign?.old === sign.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white outline-none font-mono text-sm"
                          value={editingSign.new}
                          onChange={e => setEditingSign({...editingSign, new: e.target.value})}
                          onKeyDown={e => e.key === 'Enter' && handleRename()}
                        />
                        <button onClick={handleRename} className="text-emerald-400 p-1.5 hover:bg-emerald-400/10 rounded-md">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setEditingSign(null)} className="text-white/30 p-1.5">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-white font-display uppercase tracking-wide">{sign.current}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter ${sign.type === 'system' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {sign.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/20 font-mono">ID: {sign.id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingSign({ old: sign.id, new: sign.current })}
                      className="p-2 text-white/20 hover:text-cyan-400 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(sign.id)}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Add New Sign */}
        <div className="lg:col-span-5 flex flex-col" style={{ gap: 'calc(var(--space-base) * 1.5)' }}>
          <div 
            className="glass-strong p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col sticky top-24 antigravity-lift"
            style={{ gap: 'calc(var(--space-base) * 1.5)' }}
          >
            <h2 className="text-2xl font-bold font-display text-white">Train New Pattern</h2>
            
            <div 
              className="relative aspect-square rounded-3xl overflow-hidden bg-black/40 border border-white/5 perspective-2000"
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            >
              <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="w-full h-full">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover grayscale-[0.5]" />
                {!isCapturing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
                    <Camera className="text-white/20" size={48} />
                    <button onClick={toggleCamera} className="px-6 py-2 bg-white text-black text-sm font-bold rounded-xl active:scale-95 cursor-pointer antigravity-lift">
                      Enable Viewport
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="flex flex-col" style={{ gap: 'calc(var(--space-base) * 0.5)' }}>
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Sign Label</label>
              <div className="flex" style={{ gap: 'var(--space-base)' }}>
                <input 
                  type="text"
                  placeholder="e.g. PEACE..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 transition-all font-mono"
                  value={newSignLabel}
                  onChange={e => setNewSignLabel(e.target.value)}
                />
                <button 
                  onClick={handleCreateSign}
                  disabled={!isCapturing || !newSignLabel.trim()}
                  className="px-6 rounded-2xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-[0_0_20px_#10b98133] antigravity-lift"
                >
                  <Plus size={24} />
                </button>
              </div>
                <div className="mt-4 text-xs text-emerald-400 font-mono flex items-center gap-3">
                  <Zap size={10} className="animate-pulse" /> {trainingStatus}
                </div>
            </div>

            <p className="text-[10px] text-white/20 leading-relaxed font-sans mt-2">
              Position your hand clearly in the viewport and hold the gesture steady before clicking the plus button to capture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
