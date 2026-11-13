import React, { useEffect, useRef } from 'react';
import { voiceService } from '../services/voiceService';

interface SpatialCanvasProps {
  interactive?: boolean;
  intensity?: 'subtle' | 'vibrant';
  showWaveform?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  interactive = true,
  intensity = 'subtle',
  showWaveform = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const isSpeakingRef = useRef<boolean>(false);

  useEffect(() => {
    const unsub = voiceService.onSpeakingChange((speaking) => {
      isSpeakingRef.current = speaking;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate balanced, uncluttered particle field
    const particleCount = intensity === 'vibrant' ? 45 : 30;
    const particles: Particle[] = [];
    const colors = [
      'rgba(225, 29, 72, ',   // Crimson
      'rgba(244, 63, 94, ',   // Rose
      'rgba(168, 85, 247, ',  // Purple
      'rgba(255, 255, 255, '  // Pure white glimmer
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2 + 1;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius,
        baseRadius: radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.3 + 0.1
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Deep OLED Ambient Vignette
      const radialGradient = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      radialGradient.addColorStop(0, 'rgba(15, 15, 18, 0.4)');
      radialGradient.addColorStop(0.6, 'rgba(5, 5, 5, 0.85)');
      radialGradient.addColorStop(1, '#000000');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // Living Waveform Visualizer (Activates when Voice AI is speaking or idle subtle breath)
      if (showWaveform) {
        ctx.save();
        const waveY = height * 0.88;
        const waveAmp = isSpeakingRef.current ? 26 : 6;
        const waveFreq = isSpeakingRef.current ? 0.008 : 0.003;

        ctx.beginPath();
        ctx.moveTo(0, waveY);

        for (let x = 0; x <= width; x += 8) {
          const yOffset = 
            Math.sin(x * waveFreq + time * 3) * waveAmp +
            Math.cos(x * waveFreq * 1.5 - time * 2) * (waveAmp * 0.5);
          ctx.lineTo(x, waveY + yOffset);
        }

        ctx.strokeStyle = isSpeakingRef.current
          ? 'rgba(244, 63, 94, 0.45)'
          : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = isSpeakingRef.current ? 2.5 : 1;
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = isSpeakingRef.current ? 18 : 0;
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw particles
      const { x: mouseX, y: mouseY, active: mouseActive } = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce at boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Cursor interactive attraction
        if (mouseActive) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 200;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 0.8;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
            p.radius = p.baseRadius * (1 + force * 1.5);
          } else {
            p.radius = p.baseRadius;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Connect neighboring particles with subtle ethereal lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(225, 29, 72, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive, intensity, showWaveform]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
};
