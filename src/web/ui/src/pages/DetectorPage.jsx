import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Square, Copy, Zap, Activity, Trash2, Delete, Type } from 'lucide-react';
import io from 'socket.io-client';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useMouseParallax } from '../hooks/useMouseParallax';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8], [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16], [0,17],[17,18],[18,19],[19,20], [5,9],[9,13],[13,17]
];

function FloatingPanel({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      className={`antigravity-lift ${className}`}
    >
      {children}
    </motion.div>
  );
}

function GlowButton({ children, onClick, variant = 'primary', className = '', disabled = false }) {
  const variants = {
    primary: 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    ghost: 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80',
    danger: 'bg-zinc-800 border border-white/20 text-white hover:bg-zinc-700',
  };
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer antigravity-lift ${variants[variant]} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default function DetectorPage() {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseParallax(6);
  const [isCapturing, setIsCapturing] = useState(false);
  const [recognition, setRecognition] = useState({ letter: '?', sentence: '', confidence: 0, fps: 0 });
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const isProcessingRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastEmitTimeRef = useRef(0);

  useEffect(() => {
    const init = async () => {
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
        console.error("MediaPipe Initialization Error:", err);
      }
    };
    init();

    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('recognition_result', (data) => {
      setRecognition(prev => ({
        ...data,
        sentence: typeof data.sentence === 'string' ? data.sentence : prev.sentence
      }));
      isProcessingRef.current = false;
    });

    return () => {
      socketRef.current?.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!isCapturing || !landmarkerRef.current || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState >= 2) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      frameCountRef.current++;
      
      // High-Performance 20 FPS Throttled Detector (UI Thread Optimized)
      if (frameCountRef.current % 3 === 0) {
        const results = landmarkerRef.current.detectForVideo(video, performance.now());
        const landmarks = results.landmarks?.[0] || [];

        if (landmarks && landmarks.length > 0) {
          // Draw skeleton (Cosmic Spec)
          ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          HAND_CONNECTIONS.forEach(([s, e]) => {
            const p1 = landmarks[s], p2 = landmarks[e];
            if (p1 && p2) {
              ctx.beginPath();
              ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
              ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              ctx.stroke();
            }
          });

          // Throttled Socket Emission (Min 100ms)
          const now = performance.now();
          if (socketRef.current?.connected && !isProcessingRef.current && (now - lastEmitTimeRef.current > 100)) {
            socketRef.current.emit('landmarks_data', { landmarks, handedness: 'Unknown' });
            isProcessingRef.current = true;
            lastEmitTimeRef.current = now;
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(captureFrame);
  }, [isCapturing]);

  useEffect(() => {
    if (isCapturing) rafRef.current = requestAnimationFrame(captureFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isCapturing, captureFrame]);

  const toggleCamera = async () => {
    if (isCapturing) {
      setIsCapturing(false);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    } else {
      // Resolution Downscaling (640x480 Optimized Performance)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        setIsCapturing(true);
      };
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col" style={{ gap: 'calc(var(--space-base) * 2)' }}>
        {/* Header Info */}
        <div className="flex items-center justify-between" style={{ gap: 'var(--space-base)' }}>
          <div className="flex flex-col" style={{ gap: '2px' }}>
            <h1 className="text-2xl font-bold font-display text-white">Live Detection</h1>
            <p className="text-xs text-white/30 font-mono">Neural Uplink: {recognition.fps} FPS</p>
          </div>
          {!isMediaPipeReady && (
            <div 
              className="flex items-center bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider rounded-lg"
              style={{ gap: 'calc(var(--space-base) * 0.5)', padding: 'calc(var(--space-base) * 0.5) var(--space-base)' }}
            >
              <Zap size={10} className="animate-pulse" /> Calibrating Void Sensors...
            </div>
          )}
        </div>

        {/* Viewport */}
        <div 
          className="relative aspect-video bg-black/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl perspective-2000"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="w-full h-full"
          >
            <video ref={videoRef} className="absolute opacity-0" />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            
            <AnimatePresence>
              {!isCapturing && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md gap-6"
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <Camera size={40} />
                  </div>
                  <button 
                    onClick={toggleCamera}
                    className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer antigravity-lift"
                  >
                    Initiate Zero-G Stream
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
  
            {/* Recognition Pill */}
            {isCapturing && recognition.letter !== '?' && (
              <motion.div 
                key={recognition.letter}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-8 right-8 w-20 h-20 glass flex items-center justify-center rounded-3xl border border-white/20 shadow-2xl antigravity-lift"
              >
                <span className="text-4xl font-bold text-white font-display glow-text">
                  {recognition.letter === '_' ? '·' : recognition.letter}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Output Docks */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 'var(--space-base)' }}>
          <FloatingPanel className="md:col-span-3 glass p-8 rounded-3xl flex flex-col" style={{ gap: 'calc(var(--space-base) * 0.5)' }}>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">Translated Sentence</span>
            <div className="text-2xl font-mono text-white min-h-[1.5em] flex items-center tracking-tight">
              {recognition.sentence || <span className="text-white/10 italic font-sans text-sm">Waiting for gestures...</span>}
            </div>
          </FloatingPanel>

          <FloatingPanel delay={0.1} className="glass p-6 rounded-3xl flex flex-col justify-center items-center" style={{ gap: 'calc(var(--space-base) * 0.5)' }}>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-display">Confidence</span>
            <div className="text-3xl font-bold font-display text-white">
              {Math.round(recognition.confidence * 100)}%
            </div>
          </FloatingPanel>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center mt-4" style={{ gap: 'var(--space-base)' }}>
          <GlowButton onClick={toggleCamera} variant={isCapturing ? 'danger' : 'primary'} className="min-w-[180px]">
            {isCapturing ? <><Square size={20} /> Stop Stream</> : <><Camera size={20} /> Start Stream</>}
          </GlowButton>
          <GlowButton onClick={() => fetch(`${SOCKET_URL}/backspace`, { method: 'POST' }).catch(e => console.error("Backspace error:", e))} variant="ghost">
            <Delete size={20} /> Backspace
          </GlowButton>
          <GlowButton onClick={() => fetch(`${SOCKET_URL}/space`, { method: 'POST' }).catch(e => console.error("Space error:", e))} variant="ghost">
            <Type size={20} /> Space
          </GlowButton>
          <GlowButton onClick={() => fetch(`${SOCKET_URL}/clear`, { method: 'POST' }).catch(e => console.error("Clear error:", e))} variant="ghost">
            <Trash2 size={20} /> Clear All
          </GlowButton>
          <GlowButton onClick={() => navigator.clipboard.writeText(recognition.sentence)} variant="ghost">
            <Copy size={20} /> Copy Text
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
