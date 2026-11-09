import React, { useEffect, useRef } from 'react';

interface StreamLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  depth: number; // 0 to 1 (3D perspective)
  alpha: number;
  color: string;
}

export const F1SpeedStream: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for aerodynamic deflection
    let mouseX = -1000;
    let mouseY = -1000;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Create 40 aerodynamic streamlines with 3D depth
    const COLORS = ['rgba(225, 6, 0, ', 'rgba(255, 255, 255, ', 'rgba(245, 158, 11, '];
    const lines: StreamLine[] = Array.from({ length: 42 }, () => {
      const depth = Math.random(); // 0: far, 1: near
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        length: 40 + depth * 140,
        speed: 1.2 + depth * 3.8,
        depth,
        alpha: 0.08 + depth * 0.22,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    let lastTime = performance.now();

    const render = (time: number) => {
      if (time - lastTime < 1000 / 30) {
        animId = requestAnimationFrame(render);
        return;
      }
      const dt = Math.min(50, time - lastTime) / 16;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Aerodynamic cursor deflection
        let dyOffset = 0;
        if (mouseX > 0) {
          const dx = line.x - mouseX;
          const dy = line.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (1 - dist / 180) * 16 * (dy > 0 ? 1 : -1);
            dyOffset = force;
          }
        }

        // Draw streamline with gradient tail
        const startX = line.x;
        const endX = line.x + line.length;
        const startY = line.y + dyOffset;
        const endY = line.y + dyOffset;

        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, `${line.color}0)`);
        grad.addColorStop(0.7, `${line.color}${line.alpha})`);
        grad.addColorStop(1, `${line.color}${line.alpha * 1.5})`);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8 + line.depth * 1.6;
        ctx.lineCap = 'round';
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Advance line forward
        line.x += line.speed * dt;

        // Wrap around seamlessly
        if (line.x > width + 100) {
          line.x = -line.length - 20;
          line.y = Math.random() * height;
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] opacity-60 mix-blend-screen"
    />
  );
};
