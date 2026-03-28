import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

/**
 * useMouseParallax
 * @param {number} strength - The intensity of the tilt (default: 10)
 * @returns {object} - Returns { x, y, rotateX, rotateY, onMouseMove, onMouseLeave }
 */
export function useMouseParallax(strength = 10) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [0, 1], [strength, -strength]);
  const rotateY = useTransform(springX, [0, 1], [-strength, strength]);

  const onMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / rect.width;
    const mouseY = (event.clientY - rect.top) / rect.height;
    x.set(mouseX);
    y.set(mouseY);
  };

  const onMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}
