import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Camera, Square, Trash2, Copy, Zap, Save, X, Activity, CheckCircle, WifiOff, Maximize2, ChevronDown } from 'lucide-react';
import io from 'socket.io-client';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import ThreeBackground from './ThreeBackground';
import logo from './assets/logo.png';
import './App.css';

const SOCKET_URL = 'http://localhost:8000';

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17]
];

// Floating glass panel wrapper with Framer Motion spring physics
function FloatingPanel({ children, className = '', delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ 
        delay,
        type: 'spring',
        stiffness: 120,
        damping: 20
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Glow button with hover scaling and depth shift - Kinetic Trigger
function GlowButton({ children, onClick, variant = 'primary', className = '', disabled = false }) {
  const variants = {
    primary: 'bg-[#22c55e] text-[#f0fdf4] hover:bg-[#16a34a] shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    cyan: 'bg-[#0ea5e9]/20 border border-[#7dd3fc]/40 text-[#f0f9ff] hover:bg-[#0ea5e9]/30',
    danger: 'bg-red-600/20 border border-red-400/40 text-red-200 hover:bg-red-500/30',
    ghost: 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05, y: -2, boxShadow: variant === 'primary' ? '0 0 35px rgba(34,197,94,0.6)' : undefined }}
      whileTap={{ scale: 0.96 }}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-bold transition-all duration-300 cursor-pointer ${variants[variant]} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// Ripple component for when a sign is detected - 3-layer ripple spec
function DetectionRipple({ active }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {active && (
        <>
          <div className="absolute w-32 h-32 rounded-full border border-[#4cd7f6]/20 detection-ripple" />
          <div className="absolute w-48 h-48 rounded-full border border-[#4cd7f6]/10 detection-ripple" style={{ animationDelay: '0.1s' }} />
          <div className="absolute w-64 h-64 rounded-full border border-[#4cd7f6]/5 detection-ripple" style={{ animationDelay: '0.2s' }} />
        </>
      )}
    </div>
  );
}

export default function App() {
  const [online, setOnline] = useState(false);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [recognition, setRecognition] = useState({ letter: '?', sentence: '', confidence: 0, fps: 0, landmarks: [] });
  const [detectionPulse, setDetectionPulse] = useState(false);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [newSignLabel, setNewSignLabel] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionSigns, setSessionSigns] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const socketRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const latestLandmarksRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastLetterRef = useRef('?');

  // --- Cursor parallax (Framer Motion useMotionValue + useSpring) ---
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, { stiffness: 60, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 60, damping: 20 });

  // Transform mouse into gentle parallax offsets for panels
  const leftPanelX = useTransform(mouseX, [0, 1], [-8, 0]);
  const leftPanelY = useTransform(mouseY, [0, 1], [-5, 5]);
  const rightPanelX = useTransform(mouseX, [0, 1], [0, 8]);
  const rightPanelY = useTransform(mouseY, [0, 1], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      rawMouseX.set(e.clientX / window.innerWidth);
      rawMouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rawMouseX, rawMouseY]);

  // --- MediaPipe + Socket Init ---
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        handLandmarkerRef.current = landmarker;
        setIsMediaPipeReady(true);
      } catch (err) { console.error("MediaPipe init error:", err); }
    };
    initMediaPipe();

    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on('connect', () => setOnline(true));
    socket.on('disconnect', () => setOnline(false));
    socket.on('recognition_result', (data) => {
      latestLandmarksRef.current = data.landmarks || [];
      setRecognition(prev => ({
        ...data,
        sentence: data.sentence || prev.sentence
      }));
      // Trigger ripple on letter change
      if (data.letter && data.letter !== lastLetterRef.current && data.letter !== '?') {
        lastLetterRef.current = data.letter;
        setDetectionPulse(true);
        setSessionSigns(s => [...s.slice(-19), { letter: data.letter, conf: data.confidence, t: Date.now() }]);
        setTimeout(() => setDetectionPulse(false), 700);
      }
      isProcessingRef.current = false;
    });
    return () => socket.close();
  }, []);

  // --- Frame Loop ---
  const captureFrame = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!isCapturing || !video || !canvas || !landmarker) return;

    if (video.readyState >= 2) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const results = landmarker.detectForVideo(video, performance.now());
      const landmarks = results.landmarks?.[0] || [];

      if (landmarks.length > 0) {
        // Draw skeleton - Violet lines with cyan glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#06b6d4';
        ctx.strokeStyle = 'rgba(139,92,246,0.85)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        HAND_CONNECTIONS.forEach(([s, e]) => {
          const p1 = landmarks[s], p2 = landmarks[e];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.stroke();
          }
        });

        // Draw joints
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#7c3aed';
        landmarks.forEach((lm, i) => {
          ctx.fillStyle = i === 0 ? '#f472b6' : '#06b6d4';
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, i === 0 ? 5 : 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Depth rings around wrist (landmark 0)
        const wrist = landmarks[0];
        ctx.shadowBlur = 0;
        [20, 35, 52].forEach((r, i) => {
          ctx.strokeStyle = `rgba(124,58,237,${0.4 - i * 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(wrist.x * canvas.width, wrist.y * canvas.height, r, 0, Math.PI * 2);
          ctx.stroke();
        });

        if (socketRef.current?.connected && !isProcessingRef.current) {
          socketRef.current.emit('landmarks_data', { landmarks, handedness: 'Unknown' });
          isProcessingRef.current = true;
        }
      } else {
        if (socketRef.current?.connected && !isProcessingRef.current) {
          socketRef.current.emit('landmarks_data', { landmarks: [], handedness: 'Unknown' });
          isProcessingRef.current = true;
        }
      }
      ctx.restore();
    }
    rafRef.current = requestAnimationFrame(captureFrame);
  }, [isCapturing]);

  useEffect(() => {
    if (isCapturing) rafRef.current = requestAnimationFrame(captureFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isCapturing, captureFrame]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
          setIsCapturing(true);
        };
      }
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    setIsCapturing(false);
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const clearSentence = () => {
    fetch(`${SOCKET_URL}/clear`, { method: 'POST' }).catch(console.error);
    setRecognition(prev => ({ ...prev, sentence: '' }));
    setSessionSigns([]);
  };

  const learnSign = async () => {
    if (!newSignLabel.trim()) return;
    const lm = latestLandmarksRef.current;
    if (!lm || lm.length === 0) { setTrainingStatus('No hand detected'); return; }
    setTrainingStatus('Saving...');
    try {
      const res = await fetch(`${SOCKET_URL}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newSignLabel.trim().toUpperCase(), landmarks: lm, handedness: 'Right' })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setTrainingStatus('✓ Saved');
        setNewSignLabel('');
        setTimeout(() => { setIsTrainingMode(false); setTrainingStatus(''); }, 1500);
      } else { setTrainingStatus('Failed'); }
    } catch { setTrainingStatus('Error'); }
  };

  const confidencePct = Math.round((recognition.confidence || 0) * 100);

  return (
    <div className="layout-wrapper relative w-full h-screen overflow-hidden">
      {/* 3D Three.js background scene */}
      <ThreeBackground />

      {/* Gradient vignette overlay above 3D scene */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)' }}
      />

      {/* ── TOP NAVIGATION ── */}
      <FloatingPanel
        delay={0}
        className="top-nav-responsive fixed top-5 left-1/2 -translate-x-1/2 z-40 glass rounded-2xl px-5 py-3 flex items-center gap-5"
      >
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Logo" className="h-7 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          <span className="text-sm font-bold tracking-[0.2em] text-white/95 font-display">
            SIGN<span className="text-[#22c55e]">VISION</span>
          </span>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isMediaPipeReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isMediaPipeReady ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'}`} />
            {isMediaPipeReady ? 'Vision' : 'Loading...'}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${online ? 'text-cyan-400' : 'text-red-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-red-400'}`} />
            {online ? 'Uplink' : 'Offline'}
          </div>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <button
          onClick={() => setShowAnalytics(v => !v)}
          className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors cursor-pointer"
        >
          Stats <ChevronDown size={12} className={`transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
        </button>
      </FloatingPanel>

      {/* ── LEFT PANEL: Control Dock ── */}
      <motion.div
        style={{ zIndex: 30, x: leftPanelX, y: leftPanelY }}
        className="fixed left-6 top-1/2 -translate-y-1/2"
      >
        <FloatingPanel delay={0.15} className="controls-responsive glass rounded-3xl p-4 flex flex-col gap-3 float-anim-slow">
          <div className="ctrl-label text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-1 text-center font-display">Neural Core</div>
          
          {!isCapturing ? (
            <GlowButton onClick={startCamera} variant="primary" className="flex-col !px-5 !py-6 gap-2">
              <Camera size={24} />
              <span className="text-xs">Start</span>
            </GlowButton>
          ) : (
            <GlowButton onClick={stopCamera} variant="danger" className="flex-col !px-5 !py-6 gap-2">
              <Square size={24} />
              <span className="text-xs">Stop</span>
            </GlowButton>
          )}

          <div className="w-full h-px bg-white/5" />

          {isCapturing && (
            <GlowButton onClick={() => setIsTrainingMode(v => !v)} variant={isTrainingMode ? 'cyan' : 'ghost'} className="flex-col !px-5 !py-6 gap-2">
              <Zap size={24} />
              <span className="text-xs">Learn</span>
            </GlowButton>
          )}

          <GlowButton onClick={clearSentence} variant="ghost" className="flex-col !px-5 !py-6 gap-2">
            <Trash2 size={24} />
            <span className="text-xs">Clear</span>
          </GlowButton>

          <GlowButton onClick={() => navigator.clipboard.writeText(recognition.sentence)} variant="ghost" className="flex-col !px-5 !py-6 gap-2">
            <Copy size={24} />
            <span className="text-xs">Copy</span>
          </GlowButton>
        </FloatingPanel>
      </motion.div>

      {/* ── CENTER: Camera Feed ── */}
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
        <FloatingPanel delay={0.05} className="sensor-responsive relative w-[780px] max-w-[80vw]">
          <div className="relative aspect-video glass-strong rounded-3xl overflow-hidden">
            {/* Depth rings behind video */}
            <div className="absolute inset-0 rounded-3xl border border-violet-500/20 ring-pulse" />
            <div className="absolute -inset-2 rounded-3xl border border-cyan-500/10 ring-pulse-delay" />

            <video ref={videoRef} autoPlay playsInline muted className="absolute opacity-0 w-1 h-1" />
            <canvas ref={canvasRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />

            <DetectionRipple active={detectionPulse} />

            {/* Idle overlay */}
            <AnimatePresenceWrapper show={!isCapturing}>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/50 backdrop-blur-sm"
              >
                <div className="text-center">
                  <p className="text-2xl font-light text-white/60 mb-1">Neural Vision System</p>
                  <p className="text-sm text-white/30">Position your hand in frame to begin detection</p>
                </div>
                <GlowButton onClick={startCamera} variant="primary" className="!px-8 !py-3 text-base">
                  <Camera size={20} /> Initialize Camera
                </GlowButton>
              </motion.div>
            </AnimatePresenceWrapper>

            {/* FPS pill */}
            {isCapturing && (
              <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 text-emerald-400 font-mono">
                <Activity size={12} /> {recognition.fps} FPS
              </div>
            )}

            {/* Detected letter overlay (large) */}
            {isCapturing && recognition.letter !== '?' && (
              <motion.div
                key={recognition.letter}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-5 right-5 glass rounded-2xl w-16 h-16 flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
              >
                <span className="text-4xl font-bold text-white glow-text font-display">
                  {recognition.letter === '_' ? '·' : recognition.letter}
                </span>
              </motion.div>
            )}
          </div>

          {/* Training mode input bar — below the video */}
          <AnimatePresenceWrapper show={isTrainingMode}>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-white/40 font-mono uppercase tracking-wider whitespace-nowrap">Train Sign:</span>
                <input
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder-white/20 font-mono"
                  placeholder="Type meaning, e.g., HELLO..."
                  value={newSignLabel}
                  onChange={e => setNewSignLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && learnSign()}
                  autoFocus
                />
                {trainingStatus && (
                  <span className="text-xs text-emerald-400 font-mono">{trainingStatus}</span>
                )}
                <GlowButton onClick={learnSign} variant="cyan" className="!py-1.5 !px-3 text-xs">
                  <Save size={14}/> Save
                </GlowButton>
                <GlowButton onClick={() => setIsTrainingMode(false)} variant="ghost" className="!py-1.5 !px-3">
                  <X size={14} />
                </GlowButton>
              </div>
            </motion.div>
          </AnimatePresenceWrapper>
        </FloatingPanel>
      </div>

      {/* ── RIGHT PANEL: Gesture Info ── */}
      <motion.div
        style={{ zIndex: 30, x: rightPanelX, y: rightPanelY }}
        className="fixed right-6 top-1/2 -translate-y-1/2"
      >
        <FloatingPanel delay={0.25} className="detection-responsive glass rounded-3xl p-5 w-52 flex flex-col gap-4 float-anim">
          <div className="text-[10px] font-semibold text-white/30 tracking-widest uppercase">Detection</div>

          {/* Big character */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              key={recognition.letter}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-8xl font-bold font-display"
              style={{ textShadow: '0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.2)', color: '#fff' }}
            >
              {recognition.letter === '_' ? '·' : recognition.letter}
            </motion.div>
            <span className="text-[10px] text-[#bbf7d0]/40 tracking-[0.3em] font-display uppercase">Quantum Signature</span>
          </div>

          {/* Confidence bar */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">Confidence</span>
              <span className="text-violet-300 font-mono">{confidencePct}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full shimmer-bar"
                animate={{ width: `${Math.max(4, confidencePct)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              />
            </div>
          </div>
        </FloatingPanel>
      </motion.div>

      {/* ── BOTTOM DOCK: Sentence Output ── */}
      <FloatingPanel
        delay={0.35}
        className="output-dock-responsive fixed bottom-5 left-1/2 -translate-x-1/2 z-40 glass rounded-2xl px-6 py-4 flex items-center gap-6"
        style={{ maxWidth: '800px', width: '92vw', borderBottom: '2px solid rgba(34,197,94,0.1)' }}
      >
        <span className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase whitespace-nowrap font-display">Stream</span>
        <div className="w-px h-5 bg-white/10 shrink-0" />
        <div className="flex-1 text-base font-medium text-white/80 font-mono truncate">
          {recognition.sentence || <span className="text-white/20 italic font-sans text-sm font-normal">Sentence will appear as you sign...</span>}
        </div>
        <div className="flex gap-2 shrink-0">
          <GlowButton onClick={clearSentence} variant="ghost" className="!px-2 !py-1.5">
            <Trash2 size={15} />
          </GlowButton>
          <GlowButton onClick={() => navigator.clipboard.writeText(recognition.sentence)} variant="ghost" className="!px-2 !py-1.5">
            <Copy size={15} />
          </GlowButton>
        </div>
      </FloatingPanel>

      {/* ── ANALYTICS PANEL (Collapsible) ── */}
      <AnimatePresenceWrapper show={showAnalytics}>
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          style={{ zIndex: 40 }}
          className="fixed right-6 top-24 glass rounded-3xl p-4 w-48"
        >
          <div className="text-[10px] font-semibold text-white/30 tracking-widest uppercase mb-3">Session Log</div>
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
            {sessionSigns.length === 0 ? (
              <p className="text-xs text-white/20 italic">No signs yet</p>
            ) : (
              sessionSigns.slice().reverse().map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-violet-300 font-mono font-bold text-sm">{s.letter}</span>
                  <span className="text-white/30 font-mono">{Math.round(s.conf * 100)}%</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresenceWrapper>
    </div>
  );
}

// Helper wrapper to handle AnimatePresence cleanly
function AnimatePresenceWrapper({ show, children }) {
  return <AnimatePresence>{show ? children : null}</AnimatePresence>;
}
