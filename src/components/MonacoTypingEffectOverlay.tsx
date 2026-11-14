import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  isReverse?: boolean;
}

interface MonacoTypingEffectOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  editorInstance: any;
}

export const MonacoTypingEffectOverlay: React.FC<MonacoTypingEffectOverlayProps> = ({
  containerRef,
  editorInstance
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isLoopRunningRef = useRef<boolean>(false);

  useEffect(() => {
    if (!editorInstance || !containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Particle Animation Loop
    const runAnimationLoop = () => {
      if (particlesRef.current.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isLoopRunningRef.current = false;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.isReverse) {
          // Inward vacuum suction: accelerate inward and shrink
          p.vx *= 0.88;
          p.vy *= 0.88;
          p.alpha -= 0.05;
        } else {
          // Outward explosion: subtle drag and gravity
          p.vy += 0.06;
          p.alpha -= 0.04;
        }

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color.replace('ALPHA', p.alpha.toFixed(2));
        ctx.shadowColor = p.isReverse ? '#38bdf8' : '#fb7185';
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      requestAnimationFrame(runAnimationLoop);
    };

    const triggerLoop = () => {
      if (!isLoopRunningRef.current) {
        isLoopRunningRef.current = true;
        requestAnimationFrame(runAnimationLoop);
      }
    };

    // Hook into Monaco model changes
    const disposable = editorInstance.onDidChangeModelContent((event: any) => {
      const position = editorInstance.getPosition();
      if (!position) return;

      const coordinates = editorInstance.getScrolledVisiblePosition(position);
      if (!coordinates) return;

      const cursorX = Math.min(canvas.width - 10, Math.max(10, coordinates.left));
      const cursorY = Math.min(canvas.height - 10, Math.max(10, coordinates.top + 6));

      const isDeletion = event.changes.some((c: any) => c.text === '' && c.rangeLength > 0);

      if (isDeletion) {
        // Reverse Deletion: Inward Vacuum Particles (Cyan / Purple)
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 18 + 10;
          particlesRef.current.push({
            x: cursorX + Math.cos(angle) * radius,
            y: cursorY + Math.sin(angle) * radius,
            vx: -Math.cos(angle) * (Math.random() * 2 + 1.2),
            vy: -Math.sin(angle) * (Math.random() * 2 + 1.2),
            alpha: 0.9,
            size: Math.random() * 2 + 1.2,
            color: 'rgba(56, 189, 248, ALPHA)', // Cyan
            isReverse: true
          });
        }
      } else {
        // Forward Typing: Outward Radiating Sparks (Rose / Amber)
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            x: cursorX + (Math.random() - 0.5) * 6,
            y: cursorY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 2.8,
            vy: -Math.random() * 2.2 - 0.6,
            alpha: 1,
            size: Math.random() * 2 + 1,
            color: Math.random() > 0.4 ? 'rgba(244, 63, 94, ALPHA)' : 'rgba(251, 191, 36, ALPHA)', // Rose / Amber
            isReverse: false
          });
        }
      }

      // Cap maximum particles for optimal performance
      if (particlesRef.current.length > 24) {
        particlesRef.current.splice(0, particlesRef.current.length - 24);
      }

      triggerLoop();
    });

    return () => {
      disposable.dispose();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [editorInstance, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};
