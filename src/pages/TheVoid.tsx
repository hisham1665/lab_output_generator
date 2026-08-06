import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface Singularity {
  x: number;
  y: number;
  mass: number;
  born: number;
}

export function TheVoid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const singularitiesRef = useRef<Singularity[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const [showMessage, setShowMessage] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowMessage(true), 30000);
    const hintTimer = setTimeout(() => setShowHint(false), 5000);
    return () => { clearTimeout(timer); clearTimeout(hintTimer); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      for (let i = 0; i < 1500; i++) {
        particles.push(createParticle(canvas.width, canvas.height));
      }
      particlesRef.current = particles;
    };

    initParticles();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: MouseEvent) => {
      singularitiesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        mass: 800 + Math.random() * 1200,
        born: Date.now(),
      });
      // Limit to 5 singularities
      if (singularitiesRef.current.length > 5) {
        singularitiesRef.current.shift();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        mouseRef.current = { x: t.clientX, y: t.clientY };
        singularitiesRef.current.push({
          x: t.clientX,
          y: t.clientY,
          mass: 800 + Math.random() * 1200,
          born: Date.now(),
        });
        if (singularitiesRef.current.length > 5) {
          singularitiesRef.current.shift();
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouch, { passive: true });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });

    const animate = () => {
      frameRef.current++;
      const { width, height } = canvas;
      const mouse = mouseRef.current;
      const time = frameRef.current;

      // Fade trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // Draw accretion disk around mouse (main singularity)
      const pulsePhase = Math.sin(time * 0.02) * 0.3 + 0.7;
      const diskRadius = 80 * pulsePhase;
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, diskRadius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.15, 'rgba(20, 0, 40, 0.8)');
      grad.addColorStop(0.4, 'rgba(80, 0, 120, 0.3)');
      grad.addColorStop(0.7, 'rgba(120, 40, 200, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, diskRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw event horizon ring
      ctx.strokeStyle = `rgba(140, 80, 255, ${0.15 + pulsePhase * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 25 + Math.sin(time * 0.05) * 5, 0, Math.PI * 2);
      ctx.stroke();

      // Gravitational lensing rings
      for (let r = 0; r < 3; r++) {
        const lensRadius = 35 + r * 18 + Math.sin(time * 0.03 + r) * 4;
        ctx.strokeStyle = `rgba(100, 60, 200, ${0.05 - r * 0.015})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, lensRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw secondary singularities
      const now = Date.now();
      singularitiesRef.current = singularitiesRef.current.filter(s => now - s.born < 12000);
      for (const sing of singularitiesRef.current) {
        const age = (now - sing.born) / 12000;
        const alpha = 1 - age;
        const sRadius = 40 * alpha;
        const sGrad = ctx.createRadialGradient(sing.x, sing.y, 0, sing.x, sing.y, sRadius);
        sGrad.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
        sGrad.addColorStop(0.3, `rgba(60, 0, 80, ${alpha * 0.4})`);
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(sing.x, sing.y, sRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(160, 80, 255, ${alpha * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(sing.x, sing.y, 15 * alpha, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Update and draw particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Gravity towards mouse (main singularity)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const gravityStrength = 600;

        if (dist > 5) {
          const force = gravityStrength / (distSq + 100);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Gravity towards secondary singularities
        for (const sing of singularitiesRef.current) {
          const sdx = sing.x - p.x;
          const sdy = sing.y - p.y;
          const sdistSq = sdx * sdx + sdy * sdy;
          const sdist = Math.sqrt(sdistSq);
          const age = (now - sing.born) / 12000;
          const sMass = sing.mass * (1 - age);
          if (sdist > 5) {
            const sForce = sMass / (sdistSq + 200);
            p.vx += (sdx / sdist) * sForce;
            p.vy += (sdy / sdist) * sForce;
          }
        }

        // Orbital tangential force (prevents direct collapse)
        if (dist > 20 && dist < 300) {
          const tangentForce = 0.3;
          p.vx += (-dy / dist) * tangentForce;
          p.vy += (dx / dist) * tangentForce;
        }

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Decrease life
        p.life -= 0.3;

        // Consumed by singularity or expired
        if (dist < 8 || p.life <= 0 || p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
          particles[i] = createParticle(width, height);
          continue;
        }

        // Color based on velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const hue = (p.hue + speed * 8) % 360;
        const alpha = (p.life / p.maxLife) * Math.min(1, speed * 0.5 + 0.2);
        const size = p.size * (0.5 + (p.life / p.maxLife) * 0.5);

        ctx.fillStyle = `hsla(${hue}, 80%, ${50 + speed * 5}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw trail for fast particles
        if (speed > 3) {
          const trailAlpha = alpha * 0.3;
          ctx.strokeStyle = `hsla(${hue}, 70%, 40%, ${trailAlpha})`;
          ctx.lineWidth = size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.stroke();
        }
      }

      // Ambient deep-space glow
      if (time % 120 === 0) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        const starGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 2);
        starGrad.addColorStop(0, 'rgba(200, 200, 255, 0.8)');
        starGrad.addColorStop(1, 'rgba(200, 200, 255, 0)');
        ctx.fillStyle = starGrad;
        ctx.beginPath();
        ctx.arc(gx, gy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: '#000', cursor: 'none',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif"
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      
      {/* Hint */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(140, 80, 255, 0.5)', fontSize: 12, letterSpacing: '0.2em',
        textTransform: 'uppercase', fontWeight: 300,
        opacity: showHint ? 1 : 0, transition: 'opacity 2s ease',
        pointerEvents: 'none', textAlign: 'center',
      }}>
        move your cursor · click to create singularities
      </div>

      {/* Secret message after 30s */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(100, 60, 200, 0.15)', fontSize: 11, letterSpacing: '0.3em',
        textTransform: 'uppercase', fontWeight: 300, whiteSpace: 'nowrap',
        opacity: showMessage ? 1 : 0, transition: 'opacity 8s ease',
        pointerEvents: 'none',
      }}>
        You found the void. Not everyone looks into the darkness.
      </div>

      {/* Back button — extremely subtle */}
      <button
        onClick={() => { (window as any).__navigate?.('/'); }}
        style={{
          position: 'absolute', top: 12, left: 12,
          background: 'none', border: 'none',
          color: 'rgba(80, 60, 120, 0.2)', fontSize: 10,
          cursor: 'pointer', letterSpacing: '0.15em',
          textTransform: 'uppercase', fontWeight: 300,
          padding: '6px 10px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(140, 80, 255, 0.5)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(80, 60, 120, 0.2)')}
      >
        ← escape
      </button>
    </div>
  );
}

function createParticle(width: number, height: number): Particle {
  // Spawn from edges
  const edge = Math.random();
  let x: number, y: number;
  if (edge < 0.25) { x = 0; y = Math.random() * height; }
  else if (edge < 0.5) { x = width; y = Math.random() * height; }
  else if (edge < 0.75) { x = Math.random() * width; y = 0; }
  else { x = Math.random() * width; y = height; }

  const angle = Math.atan2(height / 2 - y, width / 2 - x) + (Math.random() - 0.5) * 1.5;
  const speed = 0.5 + Math.random() * 2;
  const maxLife = 200 + Math.random() * 400;

  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: maxLife,
    maxLife,
    size: 0.5 + Math.random() * 2,
    hue: 240 + Math.random() * 80, // Purple-blue spectrum
  };
}
