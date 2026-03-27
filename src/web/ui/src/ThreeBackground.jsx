import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleField() {
  const mesh = useRef();
  const count = 1200; // Denser field
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25 - 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.015;
      mesh.current.rotation.x = state.clock.elapsedTime * 0.008;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#bbf7d0" // Emerald tint
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function AtmosphericOrb({ position, color, scale = 1, speed = 0.3 }) {
  const mesh = useRef();
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.6;
      mesh.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * speed * 0.5) * 0.3;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[scale, 64, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        transparent
        opacity={0.04}
      />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <Canvas
      className="three-canvas"
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#000000' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.2} />
      <pointLight position={[15, 15, 10]} color="#22c55e" intensity={1.5} />
      <pointLight position={[-15, -15, -5]} color="#0ea5e9" intensity={1} />
      
      <ParticleField />
      
      {/* Primary Neural Pulse Orbs */}
      <AtmosphericOrb position={[-6, 2, -5]} color="#22c55e" scale={3.5} speed={0.2} />
      <AtmosphericOrb position={[7, -3, -6]} color="#0ea5e9" scale={2.8} speed={0.35} />
      <AtmosphericOrb position={[2, 5, -8]} color="#16a34a" scale={1.8} speed={0.25} />

      <fog attach="fog" args={['#000000', 12, 35]} />
    </Canvas>
  );
}
