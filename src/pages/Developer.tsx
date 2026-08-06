import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Code2, 
  Cpu, 
  ExternalLink, 
  Sparkles, 
  ArrowLeft,
  Zap,
  CheckCircle2,
  Code
} from 'lucide-react';

export function Developer() {
  useEffect(() => {
    window.location.href = 'https://hishamkh.me';
  }, []);
  const skills = [
    { name: 'Full-Stack Web Engineering', level: 'Expert', desc: 'React 19, TypeScript, Next.js, Node.js, Zustand, Tailwind CSS' },
    { name: 'Systems & Canvas Engineering', level: 'Advanced', desc: 'HTML5 Canvas, Konva.js, WebGL2, Real-time Physics' },
    { name: 'Document Processing & PDF Specs', level: 'Advanced', desc: 'pdf-lib, pdfjs-dist, Binary Buffer Manipulations' },
    { name: 'Developer Tooling & UX', level: 'Expert', desc: 'Vite, OXlint, Web Audio API, Modern Web Animations' },
  ];

  const projects = [
    {
      title: 'Lab Terminal Studio',
      badge: 'Featured Project',
      desc: 'Professional Ubuntu & Linux terminal screenshot generator with embedded PDF report editor, custom canvas overlay tools, and one-click document compilation.',
      tags: ['React 19', 'TypeScript', 'Konva', 'pdf-lib', 'Tailwind CSS'],
      link: '/',
    },
    {
      title: 'Real-time Signal Physics Engine',
      badge: 'Lab Experiment',
      desc: 'Interactive audio-visual frequency decoder and gravitational particle simulation framework.',
      tags: ['HTML5 Canvas', 'Math Physics', 'TypeScript'],
      link: '/signal',
    },
    {
      title: 'Cyberpunk Breach Framework',
      badge: 'Interactive UI',
      desc: 'Ultra-realistic terminal breach simulation with live hex dump streams and multi-phase exfiltration visualizer.',
      tags: ['State Engine', 'Framer Motion', 'Web Audio'],
      link: '/breach',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-[128px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => (window as any).__navigate?.('/')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors tap-bounce"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Studio
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Dev Terminal // Online</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-24 relative z-10">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono uppercase tracking-wider">
            <Terminal className="h-3.5 w-3.5" /> Software Engineer & Systems Architect
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Crafting High-Performance <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Web Apps & Developer Tools
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed font-normal">
              Hi, I'm <strong className="text-slate-200">Hisham</strong>. I design and build modern, ultra-responsive web applications, developer productivity tools, and interactive visual engines with state-of-the-art UI craftsmanship.
            </p>
          </div>

          {/* Action links */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => (window as any).__navigate?.('/')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 tap-bounce"
            >
              <Zap className="h-4 w-4" /> Launch Terminal Studio
            </button>
            <button
              onClick={() => (window as any).__navigate?.('/void')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium text-sm rounded-xl transition-all flex items-center gap-2 tap-bounce"
            >
              <Code className="h-4 w-4 text-purple-400" /> Explore Secret Void
            </button>
          </div>
        </section>

        {/* Tech Stack Grid */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Cpu className="h-6 w-6 text-indigo-400" /> Core Technical Expertise
            </h2>
            <p className="text-sm text-slate-400">Architectural capabilities and specialized domains</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill, idx) => (
              <motion.div
                key={idx}
                className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 backdrop-blur-sm hover:border-slate-700/80 transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {skill.name}
                  </h3>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    {skill.level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">{skill.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Projects Showcase */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Code2 className="h-6 w-6 text-indigo-400" /> Featured Projects & Creations
            </h2>
            <p className="text-sm text-slate-400">Selected work built for performance and precision</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj, idx) => (
              <motion.div
                key={idx}
                className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4 backdrop-blur-sm flex flex-col justify-between hover:border-indigo-500/40 transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                      {proj.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-100">{proj.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{proj.desc}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800/60">
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tags.map((t, i) => (
                      <span key={i} className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => (window as any).__navigate?.(proj.link)}
                    className="w-full py-2 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    Open Experience <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Easter Eggs Hints Section for curious devs */}
        <section className="p-6 bg-slate-900/30 border border-purple-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" /> Hidden System Paths
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Curious engineers look beyond the obvious. There are 3 secret interactive experiences embedded directly into this platform at direct URL paths:
          </p>
          <div className="flex flex-wrap gap-3 pt-1 font-mono text-xs text-slate-300">
            <button onClick={() => (window as any).__navigate?.('/void')} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-purple-300 hover:border-purple-500 transition-colors">/void</button>
            <button onClick={() => (window as any).__navigate?.('/breach')} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-300 hover:border-emerald-500 transition-colors">/breach</button>
            <button onClick={() => (window as any).__navigate?.('/signal')} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 hover:border-cyan-500 transition-colors">/signal</button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} Hisham — Lab Terminal Studio. Built for engineers & researchers.</p>
        </footer>
      </main>
    </div>
  );
}
