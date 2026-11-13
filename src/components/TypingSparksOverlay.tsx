import React, { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

interface TypingSparksOverlayProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const TypingSparksOverlay: React.FC<TypingSparksOverlayProps> = ({ textareaRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (textarea && canvas) {
        canvas.width = textarea.clientWidth;
        canvas.height = textarea.clientHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Spawn sparks near caret location on keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      const text = textarea.value.substring(0, textarea.selectionStart);
      const lines = text.split('\n');
      const currentLine = lines.length;
      const currentCol = lines[lines.length - 1].length;

      // Approximate font metrics for JetBrains Mono text-xs: charWidth ~ 7.2px, lineHeight ~ 18px
      const charWidth = 7.2;
      const lineHeight = 18;
      const paddingLeft = 16;
      const paddingTop = 16;

      const cursorX = Math.min(canvas.width - 20, paddingLeft + currentCol * charWidth);
      const cursorY = Math.min(canvas.height - 20, paddingTop + (currentLine - 1) * lineHeight - textarea.scrollTop + 8);

      // Spawn 3 micro-sparks
      for (let i = 0; i < 3; i++) {
        sparksRef.current.push({
          x: cursorX + (Math.random() - 0.5) * 4,
          y: cursorY + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -Math.random() * 1.8 - 0.5,
          alpha: 1,
          size: Math.random() * 1.5 + 0.8
        });
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.08; // subtle gravity
        s.alpha -= 0.045; // quick fade in ~300ms

        if (s.alpha <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [textareaRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20"
    />
  );
};
