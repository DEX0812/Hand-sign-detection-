import React, { useEffect } from 'react';

const CyberpunkEffects = () => {
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const glitchElements = document.querySelectorAll('.text-glitch');
      glitchElements.forEach(el => {
        // Randomly trigger an extra "jump" or glitch shift
        if (Math.random() > 0.9) {
          el.style.transform = `translateX(${Math.random() * 4 - 2}px) skewX(${Math.random() * 2 - 1}deg)`;
          setTimeout(() => {
            el.style.transform = 'none';
          }, 100);
        }
      });
    }, 200);

    return () => clearInterval(glitchInterval);
  }, []);

  return null;
};

export default CyberpunkEffects;
