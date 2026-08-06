import { useState, useEffect, useRef, useCallback } from 'react';

// Fake data generators
const hexChars = '0123456789ABCDEF';
const randomHex = (len: number) => Array.from({ length: len }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
const randomIp = () => `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
const randomPort = () => Math.floor(Math.random() * 65535);
const randomMac = () => Array.from({ length: 6 }, () => randomHex(2)).join(':');

const kernelMessages = [
  () => `[${(Math.random()*999).toFixed(6)}] kernel: TCP: ${randomIp()}:${randomPort()} -> ${randomIp()}:${randomPort()} SYN_SENT`,
  () => `[${(Math.random()*999).toFixed(6)}] audit: granted access uid=0 pid=${Math.floor(Math.random()*30000)} comm="sshd"`,
  () => `[${(Math.random()*999).toFixed(6)}] net: ARP who-has ${randomIp()} tell ${randomIp()} (${randomMac()})`,
  () => `[${(Math.random()*999).toFixed(6)}] fs: ext4_lookup: inode=${Math.floor(Math.random()*9999999)} name="shadow"`,
  () => `[${(Math.random()*999).toFixed(6)}] crypto: cipher aes-256-gcm key_id=${randomHex(8)} block=${Math.floor(Math.random()*4096)}`,
  () => `[${(Math.random()*999).toFixed(6)}] mem: page_fault addr=0x${randomHex(12)} flags=WRITE|USER`,
  () => `[${(Math.random()*999).toFixed(6)}] usb: new device connected vid=0x${randomHex(4)} pid=0x${randomHex(4)}`,
  () => `[${(Math.random()*999).toFixed(6)}] firewall: BYPASS rule #${Math.floor(Math.random()*200)} chain=INPUT src=${randomIp()}`,
  () => `[${(Math.random()*999).toFixed(6)}] sched: migration thread=${Math.floor(Math.random()*8)} cpu=${Math.floor(Math.random()*16)}`,
  () => `0x${randomHex(8)}: ${Array.from({length:8}, () => randomHex(4)).join(' ')}  |${Array.from({length:16}, () => String.fromCharCode(33 + Math.floor(Math.random()*93))).join('')}|`,
];

const phaseMessages = [
  { label: 'NETWORK SCAN', items: [
    'Scanning target network topology...',
    'Discovered 47 active hosts on subnet 10.0.0.0/24',
    'Identifying open ports via SYN stealth scan...',
    'Port 22 (SSH): OPEN | Port 443 (HTTPS): OPEN | Port 3306 (MySQL): OPEN',
    'Fingerprinting OS: Linux 6.8.0-45-generic #45-Ubuntu SMP',
    'CVE-2026-31337 vulnerability detected on target',
  ]},
  { label: 'FIREWALL BYPASS', items: [
    'Analyzing firewall ruleset...',
    'iptables -L -n: 23 rules in chain INPUT',
    'Crafting fragmented packet injection sequence...',
    'Fragment offset manipulation: SUCCESS',
    'Tunneling through DNS (port 53) exfiltration channel...',
    'Firewall rule #17 BYPASSED — ephemeral port 49152 accessible',
  ]},
  { label: 'CREDENTIAL EXTRACTION', items: [
    'Accessing /etc/shadow via privilege escalation...',
    'root:$6$rounds=656000$sSaLtV4Lu3$' + randomHex(64),
    'Dumping SSH authorized_keys...',
    'RSA key fingerprint: SHA256:' + randomHex(43),
    'Extracting session tokens from /tmp/.X11-unix...',
    'Database credentials located: mysql://root:***@localhost:3306/prod',
  ]},
  { label: 'DATA EXFILTRATION', items: [
    'Establishing encrypted tunnel via TOR circuit...',
    'Relay: ' + randomIp() + ' → ' + randomIp() + ' → ' + randomIp(),
    'Compressing target data: 2.7 GB → 891 MB (gzip -9)',
    'Transfer rate: 12.4 MB/s through covert channel...',
    'Checksum verification: SHA-512 match confirmed',
    'Exfiltration complete. Wiping forensic traces...',
  ]},
];

export function SystemBreach() {
  const [lines, setLines] = useState<{ text: string; type: string }[]>([]);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breached, setBreached] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [selfDestructCount, setSelfDestructCount] = useState(10);
  const [dissolved, setDissolved] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lineCountRef = useRef(0);

  const addLine = useCallback((text: string, type = 'normal') => {
    setLines(prev => {
      const next = [...prev, { text, type }];
      return next.length > 200 ? next.slice(-200) : next;
    });
    lineCountRef.current++;
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Main breach sequence
  useEffect(() => {
    if (breached) return;
    const timeouts: number[] = [];
    let delay = 0;

    // Initial boot sequence
    const bootLines = [
      { t: 'SHADOW_NET v4.2.0 — Unauthorized Access Framework', type: 'header' },
      { t: '════════════════════════════════════════════════════', type: 'dim' },
      { t: `Session ID: ${randomHex(16)}`, type: 'dim' },
      { t: `Timestamp: ${new Date().toISOString()}`, type: 'dim' },
      { t: `Operator: GHOST_${randomHex(4)}`, type: 'dim' },
      { t: '', type: 'normal' },
      { t: '> Initializing attack vector modules...', type: 'command' },
      { t: '[✓] nmap-stealth loaded', type: 'success' },
      { t: '[✓] exploit-db-2026 loaded', type: 'success' },
      { t: '[✓] credential-harvester loaded', type: 'success' },
      { t: '[✓] tor-tunnel loaded', type: 'success' },
      { t: '[✓] forensic-wiper loaded', type: 'success' },
      { t: '', type: 'normal' },
      { t: `> Target: ${randomIp()} (${randomMac()})`, type: 'target' },
      { t: '> STATUS: ENGAGING', type: 'warning' },
      { t: '', type: 'normal' },
    ];

    bootLines.forEach((line) => {
      timeouts.push(window.setTimeout(() => addLine(line.t, line.type), delay));
      delay += line.t === '' ? 100 : 80 + Math.random() * 120;
    });

    // Phase execution
    phaseMessages.forEach((phaseData, phaseIdx) => {
      timeouts.push(window.setTimeout(() => {
        setPhase(phaseIdx + 1);
        setProgress(0);
        addLine(`══════ PHASE ${phaseIdx + 1}: ${phaseData.label} ══════`, 'phase');
      }, delay));
      delay += 400;

      phaseData.items.forEach((item, itemIdx) => {
        timeouts.push(window.setTimeout(() => {
          addLine(`  ${item}`, itemIdx === phaseData.items.length - 1 ? 'success' : 'normal');
          setProgress(((itemIdx + 1) / phaseData.items.length) * 100);
        }, delay));
        delay += 200 + Math.random() * 400;

        // Inject random kernel/hex lines between items
        const extraCount = 2 + Math.floor(Math.random() * 4);
        for (let k = 0; k < extraCount; k++) {
          timeouts.push(window.setTimeout(() => {
            const gen = kernelMessages[Math.floor(Math.random() * kernelMessages.length)];
            addLine(`  ${gen()}`, 'kernel');
          }, delay));
          delay += 30 + Math.random() * 60;
        }
      });

      delay += 600;
    });

    // Final breach
    timeouts.push(window.setTimeout(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 500);
    }, delay));
    delay += 300;

    timeouts.push(window.setTimeout(() => {
      addLine('', 'normal');
      addLine('████████████████████████████████████████████████████', 'breach');
      addLine('██                                              ██', 'breach');
      addLine('██          ▓▓ ACCESS GRANTED ▓▓                ██', 'breach');
      addLine('██                                              ██', 'breach');
      addLine('████████████████████████████████████████████████████', 'breach');
      addLine('', 'normal');
      addLine('Welcome to the other side. — Hisham', 'secret');
      setBreached(true);
      setPhase(5);
      setProgress(100);
    }, delay));

    return () => timeouts.forEach(clearTimeout);
  }, [addLine, breached]);

  // Glitch effect periodically during breach
  useEffect(() => {
    if (breached) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 100 + Math.random() * 200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [breached]);

  // Self-destruct countdown after breach
  useEffect(() => {
    if (!breached) return;
    const timer = setTimeout(() => setSelfDestruct(true), 5000);
    return () => clearTimeout(timer);
  }, [breached]);

  useEffect(() => {
    if (!selfDestruct || dissolved) return;
    if (selfDestructCount <= 0) {
      setDissolved(true);
      return;
    }
    const timer = setTimeout(() => setSelfDestructCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [selfDestruct, selfDestructCount, dissolved]);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'header': return '#00ff41';
      case 'command': return '#00ff41';
      case 'success': return '#00ff41';
      case 'warning': return '#ffaa00';
      case 'target': return '#ff3333';
      case 'phase': return '#00ccff';
      case 'kernel': return '#444444';
      case 'breach': return '#ff0040';
      case 'secret': return '#ff0040';
      case 'dim': return '#555555';
      default: return '#00cc33';
    }
  };

  const phaseLabel = phase <= 0 ? 'INITIALIZING' : phase <= 4 ? phaseMessages[phase - 1].label : 'BREACH COMPLETE';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', overflow: 'hidden',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      filter: glitch ? `hue-rotate(${Math.random() * 60 - 30}deg) saturate(2) brightness(1.3)` : 'none',
      transition: dissolved ? 'opacity 3s ease' : 'filter 0.1s',
      opacity: dissolved ? 0 : 1,
    }}>
      {/* CRT Scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px)',
        mixBlendMode: 'multiply',
      }} />

      {/* Screen flicker */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 11,
        background: `rgba(0, 255, 65, ${0.01 + Math.random() * 0.02})`,
        animation: 'flicker 0.15s infinite',
      }} />

      {/* Glitch horizontal tear */}
      {glitch && (
        <div style={{
          position: 'absolute',
          top: `${Math.random() * 100}%`,
          left: 0, right: 0,
          height: `${2 + Math.random() * 20}px`,
          background: `rgba(0, 255, 0, ${0.1 + Math.random() * 0.3})`,
          transform: `translateX(${Math.random() * 40 - 20}px)`,
          zIndex: 12,
          pointerEvents: 'none',
        }} />
      )}

      {/* Header bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 36,
        background: 'rgba(0, 20, 0, 0.9)', borderBottom: '1px solid #003300',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 5, fontSize: 11,
      }}>
        <span style={{ color: '#00ff41' }}>SHADOW_NET v4.2.0</span>
        <span style={{ color: phase >= 5 ? '#ff0040' : '#00ff41' }}>
          {phaseLabel} {phase < 5 && `[${Math.round(progress)}%]`}
        </span>
        <span style={{ color: '#555' }}>{new Date().toLocaleTimeString()}</span>
      </div>

      {/* Progress bars */}
      <div style={{
        position: 'absolute', top: 36, left: 0, right: 0, height: 3,
        background: '#001100', zIndex: 5,
      }}>
        <div style={{
          height: '100%',
          width: `${(phase - 1 + progress / 100) / 4 * 100}%`,
          background: phase >= 5 ? '#ff0040' : '#00ff41',
          transition: 'width 0.3s ease, background 0.5s',
          boxShadow: phase >= 5 ? '0 0 10px #ff0040' : '0 0 10px #00ff41',
        }} />
      </div>

      {/* Terminal output */}
      <div
        ref={terminalRef}
        style={{
          position: 'absolute', top: 42, left: 0, right: 0, bottom: selfDestruct ? 60 : 0,
          overflowY: 'auto', padding: '12px 16px',
          fontSize: 12, lineHeight: 1.6, zIndex: 1,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{
            color: getLineColor(line.type),
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontWeight: line.type === 'breach' || line.type === 'secret' ? 700 : 400,
            fontSize: line.type === 'breach' ? 13 : line.type === 'secret' ? 14 : 12,
            textShadow: line.type === 'breach' ? '0 0 10px #ff0040' : 
                        line.type === 'secret' ? '0 0 20px #ff0040' :
                        line.type === 'success' ? '0 0 5px #00ff41' : 'none',
            letterSpacing: line.type === 'secret' ? '0.2em' : 'normal',
            animation: line.type === 'breach' || line.type === 'secret' ? 'glow-pulse 2s infinite' : 'none',
          }}>
            {line.text || '\u00A0'}
          </div>
        ))}
        <span style={{
          display: 'inline-block', width: 8, height: 14,
          background: '#00ff41', animation: 'blink-cursor 1s step-end infinite',
          verticalAlign: 'text-bottom', marginLeft: 2,
        }} />
      </div>

      {/* Self-destruct bar */}
      {selfDestruct && !dissolved && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
          background: 'rgba(40, 0, 0, 0.95)', borderTop: '1px solid #ff0040',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          zIndex: 20, animation: 'flash-red 1s infinite',
        }}>
          <span style={{ color: '#ff0040', fontSize: 13, fontWeight: 700, letterSpacing: '0.15em' }}>
            ⚠ SELF-DESTRUCT IN {selfDestructCount}s — ERASING ALL TRACES
          </span>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => { (window as any).__navigate?.('/'); }}
        style={{
          position: 'absolute', bottom: selfDestruct ? 64 : 12, right: 12,
          background: 'none', border: '1px solid #002200',
          color: '#003300', fontSize: 10, cursor: 'pointer',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          fontWeight: 400, padding: '4px 8px', fontFamily: 'inherit', zIndex: 20,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#00ff41'; e.currentTarget.style.borderColor = '#00ff41'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#003300'; e.currentTarget.style.borderColor = '#002200'; }}
      >
        abort
      </button>

      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.98; }
          50% { opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes flash-red {
          0%, 100% { background: rgba(40, 0, 0, 0.95); }
          50% { background: rgba(80, 0, 0, 0.95); }
        }
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-track { background: #000; }
        div::-webkit-scrollbar-thumb { background: #003300; }
      `}</style>
    </div>
  );
}
