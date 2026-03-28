import React from 'react';
import Navigation from './Navigation';
import ThreeBackground from '../ThreeBackground';
import CyberpunkEffects from './CyberpunkEffects';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen w-full bg-[#030712] overflow-x-hidden">
      <CyberpunkEffects />
      {/* Dynamic Three.js Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ThreeBackground />
      </div>

      {/* Antigravity Decorative Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="antigravity-blob blob-1" />
        <div className="antigravity-blob blob-2" />
        <div className="antigravity-blob blob-3" />
      </div>

      {/* Glossy Overlay */}
      <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_70%)]" />

      {/* Main Navigation */}
      <Navigation />

      {/* CRT Scanline Effects */}
      <div className="crt-overlay" />
      <div className="scanline" />

      {/* Content Area */}
      <main className="relative z-10 w-full">
        {children}
      </main>

      {/* Global Grainy Texture (Optional but adds premium feel) */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] contrast-150 brightness-150 mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
    </div>
  );
}
