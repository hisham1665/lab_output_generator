import { useState, useEffect, useRef } from 'react';

const BINARY_SECRET = "01001000 01101001 01110011 01101000 01100001 01101101"; // "Hisham"
const DECODED_TEXT = "H I S H A M";

export function HiddenSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [decodedStage, setDecodedStage] = useState(0); // 0 to 6 letters
  const [frequency] = useState(1420.405); // Neutral hydrogen line in MHz
  const [isLocked, setIsLocked] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });

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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Matrix particles
    const columns = Math.floor(window.innerWidth / 20);
    const drops: number[] = Array(columns).fill(1);
    const matrixChars = '0101010101010101XYZASTRONODE';

    let t = 0;

    const animate = () => {
      t += 0.05;
      const { width, height } = canvas;

      // Dark background with trail
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Subtle Matrix rain in background
      ctx.fillStyle = 'rgba(0, 255, 180, 0.04)';
      ctx.font = '12px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);
        if (drops[i] * 20 > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      // Draw Main Oscilloscope Grid
      const cy = height / 2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 1;

      // Draw Waveform Signal
      ctx.beginPath();
      ctx.strokeStyle = isLocked ? '#38bdf8' : '#34d399';
      ctx.shadowColor = isLocked ? '#0284c7' : '#10b981';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;

      const targetX = mouseRef.current.x;
      const signalRatio = Math.max(0, 1 - Math.abs(targetX - width / 2) / (width / 2));
      setSignalStrength(Math.floor(signalRatio * 100));

      for (let x = 0; x < width; x += 3) {
        const distToMouse = Math.abs(x - mouseRef.current.x);
        const mouseFactor = Math.max(0, 1 - distToMouse / 200);

        const baseWave = Math.sin(x * 0.01 + t) * 20;
        const modWave = Math.sin(x * 0.05 - t * 2) * (10 + mouseFactor * 40);
        const carrierWave = isLocked
          ? Math.sin(x * 0.1 + t * 4) * 80 * Math.exp(-Math.pow((x - width / 2) / 120, 2))
          : Math.sin(x * 0.2 + t * 5) * (5 + mouseFactor * 30);

        const y = cy + baseWave + modWave + carrierWave;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Target Lock Reticle
      if (signalRatio > 0.85) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(width / 2, cy, 80 + Math.sin(t * 3) * 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isLocked]);

  const handleTune = () => {
    if (signalStrength > 80) {
      if (decodedStage < 6) {
        setDecodedStage((prev) => prev + 1);
        if (decodedStage + 1 === 6) {
          setIsLocked(true);
        }
      }
    }
  };

  return (
    <div
      onClick={handleTune}
      className="fixed inset-0 bg-slate-950 text-emerald-400 font-mono overflow-hidden select-none cursor-crosshair flex flex-col justify-between p-6"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Top HUD */}
      <div className="relative z-10 flex justify-between items-start border-b border-emerald-950/80 pb-4 backdrop-blur-sm bg-slate-950/40 p-4 rounded-xl">
        <div>
          <div className="text-xs text-emerald-600 uppercase tracking-widest font-bold">Deep Space Receiver // SETI-X</div>
          <div className="text-xl font-extrabold text-emerald-300 tracking-wider mt-0.5">
            FREQ: <span className="text-cyan-400">{(frequency + (signalStrength - 50) * 0.001).toFixed(4)} MHz</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-emerald-600 uppercase tracking-widest font-bold">Signal Lock</div>
          <div className="text-sm font-bold flex items-center justify-end gap-2 mt-1">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                signalStrength > 80 ? 'bg-cyan-400 animate-ping' : 'bg-emerald-800'
              }`}
            />
            <span className={signalStrength > 80 ? 'text-cyan-300' : 'text-emerald-700'}>
              {signalStrength}% {signalStrength > 80 ? '[RESONANCE DETECTED]' : '[SEARCHING...]'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Decoding UI */}
      <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6 pointer-events-none">
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900/80 border border-emerald-900/60 text-xs text-emerald-500 uppercase tracking-widest">
          {isLocked ? '/// TRANSMISSION FULLY DECODED ///' : 'Move cursor to center & Click to sync harmonics'}
        </div>

        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-md space-y-4">
          <div className="text-xs text-slate-500 tracking-widest uppercase">Raw Binary Pulse</div>
          <div className="text-xs md:text-sm font-mono text-cyan-400/80 tracking-widest break-all">
            {BINARY_SECRET}
          </div>

          <div className="h-px bg-slate-800/80 my-4" />

          <div className="text-xs text-slate-500 tracking-widest uppercase">Decrypted Payload</div>
          <div className="text-3xl md:text-5xl font-black tracking-[0.3em] text-white">
            {DECODED_TEXT.slice(0, decodedStage * 2)}
            <span className="animate-pulse text-cyan-500">
              {decodedStage < 6 ? '_' : ''}
            </span>
          </div>
        </div>

        {isLocked && (
          <div className="text-xs text-cyan-400 tracking-widest animate-bounce">
            "An origin signal broadcasted from the core system." — Creator Identified
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 flex justify-between items-center text-xs text-slate-600">
        <div>ORBITAL POS: 42° 18' N 71° 05' W</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            (window as any).__navigate?.('/');
          }}
          className="hover:text-emerald-400 text-slate-600 transition-colors uppercase tracking-widest"
        >
          [ ← RETURN TO BASE ]
        </button>
      </div>
    </div>
  );
}
