import React, { useState } from 'react';
import { 
  Terminal, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  ShieldCheck, 
  Download, 
  Palette, 
  Zap, 
  Cpu
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is Lab Output Generator and how does it help with lab reports?",
    answer: "Lab Output Generator is a free, web-based tool designed for students, computer science researchers, and developers to generate realistic Ubuntu and Linux terminal output screenshots. You can type commands, preview realistic terminal styling, and instantly export PNG images or embed them directly into lab report PDFs."
  },
  {
    question: "How do I create a fake Ubuntu terminal screenshot for my university lab manual?",
    answer: "Simply type or paste your command line output into the terminal editor, select your preferred theme (such as Ubuntu, Dracula, or One Dark), adjust fonts and window controls, and click 'Copy Image' or 'Download PNG'. You can also drag the generated screenshot onto a multi-page PDF canvas to compile a complete lab report."
  },
  {
    question: "Is Lab Output Generator free to use and safe for student data?",
    answer: "Yes, Lab Output Generator is 100% free and open source. All processing happens entirely within your web browser using client-side JavaScript—your terminal commands, uploaded PDFs, and code outputs are never uploaded to any remote server."
  },
  {
    question: "Can I embed terminal screenshots into a multi-page PDF lab report?",
    answer: "Yes! Lab Output Generator features a full PDF Editor mode. You can upload an existing PDF lab manual or start with blank A4/Letter pages, drag and drop terminal mockups onto pages, crop, rotate, resize, and compile a final downloadable PDF."
  },
  {
    question: "Which terminal themes and fonts are supported?",
    answer: "We support popular color schemes including Ubuntu Yaru, Dracula, One Dark Pro, Nord, Synthwave, Hacker Matrix Green, and Clean Light. Fonts include Ubuntu Mono, JetBrains Mono, Fira Code, Source Code Pro, and Courier Prime."
  },
  {
    question: "How can I ensure high resolution terminal screenshots for printing?",
    answer: "All generated screenshots use crisp 2x retina device pixel scaling. When exported as PNG or placed on PDF lab pages, terminal text remains pin-sharp even when printed on paper."
  }
];

export const SEOContentSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="w-full bg-slate-950/80 border-t border-slate-800/80 pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-slate-300 transition-all">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* ═══ HEADER & H1 ═══ */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            #1 Online Terminal Screenshot & Lab Report Generator
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Lab Output Generator — Create Fake Ubuntu Terminal Screenshots & PDF Mockups
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            Generate high-resolution Linux command line outputs, customize terminal themes & fonts, and compile ready-to-submit university lab report PDFs in seconds.
          </p>
        </div>

        {/* ═══ CORE FEATURES GRID ═══ */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-indigo-400" />
              Why Computer Science Students & Educators Choose Lab Output Generator
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Built specifically to solve the hassle of taking blurry terminal screenshots and pasting them into Word or PDF documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Authentic Terminal Styling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Realistic window headers, window buttons (close/minimize/maximize), custom user prompts (<code className="text-indigo-300">user@ubuntu:~$</code>), and realistic shell outputs.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">High-Res PNG & Clipboard Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export crisp 2x retina scaled terminal PNG images or copy directly to clipboard with a single click for instant pasting into lab reports.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Page PDF Compiler</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Import existing PDF lab sheets or start with blank A4 pages. Drag, resize, rotate, crop, and embed terminal screenshots into a complete PDF.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Popular Themes & Developer Fonts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose from Ubuntu Yaru, Dracula, One Dark, Nord, and Matrix color schemes paired with JetBrains Mono, Ubuntu Mono, or Fira Code.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">100% Client-Side Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your data stays strictly inside your browser. No server storage, no data tracking, and full offline-friendly operation.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast & Lightweight</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero installation required. Works on Windows, macOS, Linux, Chromebooks, Android, and iOS browsers instantly.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ HOW TO GUIDE (HOW-TO SCHEMA MATCHING) ═══ */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              How to Create Ubuntu Terminal Screenshots for Lab Reports (3 Easy Steps)
            </h2>
            <p className="text-xs text-slate-400">
              Follow this step-by-step tutorial to format command outputs and prepare lab submission files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="space-y-3 relative">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">1</span>
                <h3 className="font-semibold text-white text-base">Enter Commands & Output</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-11">
                Type or paste your Bash, C/C++, Python, Java, or networking command lines into the main terminal code editor above.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">2</span>
                <h3 className="font-semibold text-white text-base">Customize Theme & Font</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-11">
                Select your desired terminal header style, user host prompt, font family, padding, and theme colors to match your university guidelines.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">3</span>
                <h3 className="font-semibold text-white text-base">Export PNG or Compile PDF</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-11">
                Download the high-definition PNG mockup, or switch to PDF editor mode to drop screenshots onto a PDF page and download your complete assignment.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ FAQ ACCORDION SECTION ═══ */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-indigo-400" />
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Everything you need to know about generating fake terminal mockups and lab manual outputs.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full py-4 px-6 flex items-center justify-between text-left font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
                  aria-expanded={openFaq === index}
                >
                  <span className="text-sm font-semibold pr-4">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-indigo-400 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>

                {openFaq === index && (
                  <div className="px-6 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/50 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FOOTER & KEYWORD LINKS ═══ */}
        <div className="pt-8 border-t border-slate-900 text-center space-y-4">
          <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-slate-500">
            <span>Terminal Screenshot Generator</span> •
            <span>Ubuntu Terminal Mockup</span> •
            <span>Linux Command Line Screenshot</span> •
            <span>Lab Report PDF Compiler</span> •
            <span>Fake Terminal Output Creator</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Lab Output Generator. Designed for CS Students, Developers & Educators Worldwide.
          </p>
        </div>

      </div>
    </section>
  );
};
