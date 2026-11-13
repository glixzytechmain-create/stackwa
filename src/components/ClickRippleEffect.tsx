import React, { useState, useEffect } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const ClickRippleEffect: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      if (clientX === 0 && clientY === 0) return;

      const newRipple: Ripple = {
        id: Date.now() + Math.random(),
        x: clientX,
        y: clientY
      };

      setRipples(prev => [...prev.slice(-10), newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 550);
    };

    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            border: '1.5px solid rgba(244, 63, 94, 0.7)',
            boxShadow: '0 0 16px rgba(225, 29, 72, 0.6), inset 0 0 8px rgba(244, 63, 94, 0.4)'
          }}
        />
      ))}
    </div>
  );
};
