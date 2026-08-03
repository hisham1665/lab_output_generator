import { useState, useEffect } from 'react';
import { useStore } from './store/globalStore';
import { THEME_PRESETS } from './features/themes';
import { PageViewer } from './features/pdf-editor/components/PageViewer';
import { toPng, toBlob } from 'html-to-image';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { 
  Terminal as TerminalIcon, 
  FileText, 
  Undo2, 
  Redo2, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  FilePlus,
  ArrowRight,
  Camera,
  Crop,
  RotateCcw,
  Lock,
  Unlock,
  Layers,
  X
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function App() {
  const {
    activeMode,
    setActiveMode,
    settings,
    updateSettings,
    interactions,
    addInteraction,
    updateInteraction,
    deleteInteraction,
    duplicateInteraction,
    reorderInteractions,
    undo,
    redo,
    history,
    pdfDoc,
    setPdfFile,
    elements,

    duplicateElement,
    deleteElement,
    selectedElementId,
    updateElement,
    setSelectedElementId,
    savedSnapshots,
    addSnapshot,
    deleteSnapshot,

    bringToFront,
    sendToBack,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'prompt' | 'style' | 'sequence'>('prompt');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const activeTheme = THEME_PRESETS[settings.themeId] || THEME_PRESETS.ubuntu;

  // Track natural image size for crop controls
  const [naturalSize, setNaturalSize] = useState({ width: 100, height: 100 });
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  useEffect(() => {
    if (selectedElement) {
      const img = new Image();
      img.src = selectedElement.dataUrl;
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
    }
  }, [selectedElementId, selectedElement?.dataUrl]);

  // ─── HANDLERS ──────────────────────────────────

  const handleAddDefaultInteraction = () => {
    addInteraction('ls -la', 'total 8\ndrwxr-xr-x  2 hisham hisham 4096 Aug  3 18:00 .\ndrwxr-xr-x 10 hisham hisham 4096 Aug  3 18:00 ..');
  };

  // Load PDF data
  const loadPdfData = async (file: File) => {
    setIsPdfLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const numPages = pdf.numPages;
      const pageSizes: Array<{ width: number; height: number }> = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        pageSizes.push({ width: viewport.width, height: viewport.height });
      }
      setPdfFile(file, pageSizes);
    } catch (error) {
      console.error('Error loading PDF file:', error);
      alert('Failed to parse PDF document. Ensure the file is not corrupted.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleSidebarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadPdfData(file);
  };

  // Copy terminal image to clipboard
  const handleCopyImage = async () => {
    const node = document.getElementById('terminal-render-target');
    if (!node) return;
    try {
      const blob = await toBlob(node, { pixelRatio: 2.5, backgroundColor: 'transparent' });
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        alert('Terminal snapshot copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying image:', error);
      alert('Failed to copy image. Check browser permissions.');
    }
  };

  // Download terminal as PNG
  const handleDownloadPng = async () => {
    const node = document.getElementById('terminal-render-target');
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2.5, backgroundColor: 'transparent' });
      const link = document.createElement('a');
      link.download = `terminal_${settings.username}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading PNG:', error);
      alert('Failed to generate PNG image.');
    }
  };

  // Save terminal snapshot to gallery
  const handleSaveSnapshot = async () => {
    const node = document.getElementById('terminal-render-target');
    if (!node) return;
    try {
      const rect = node.getBoundingClientRect();
      const dataUrl = await toPng(node, { pixelRatio: 2.5, backgroundColor: 'transparent' });
      const name = `Terminal ${savedSnapshots.length + 1}`;
      addSnapshot({
        name,
        dataUrl,
        width: rect.width,
        height: rect.height,
      });
      alert(`"${name}" saved to snapshot gallery! Switch to PDF Editor to place it.`);
    } catch (error) {
      console.error('Error saving snapshot:', error);
      alert('Failed to capture terminal snapshot.');
    }
  };

  // Quick insert: save snapshot then switch to PDF mode
  const handleInsertToPdf = async () => {
    if (!pdfDoc.file) {
      alert('Please upload a PDF file first in PDF Editor mode!');
      setActiveMode('pdf');
      return;
    }
    const node = document.getElementById('terminal-render-target');
    if (!node) return;
    try {
      const rect = node.getBoundingClientRect();
      const dataUrl = await toPng(node, { pixelRatio: 2.5, backgroundColor: 'transparent' });
      const name = `Terminal ${savedSnapshots.length + 1}`;
      addSnapshot({ name, dataUrl, width: rect.width, height: rect.height });
      setActiveMode('pdf');
      alert(`Snapshot saved! Now click "Place Snapshot" on any page to place it.`);
    } catch (error) {
      console.error('Error inserting to PDF:', error);
      alert('Failed to capture terminal image.');
    }
  };

  // Compile and export the edited PDF
  const handleExportPdf = async () => {
    if (!pdfDoc.file) return;
    setIsPdfLoading(true);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const arrayBuffer = await pdfDoc.file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfLibDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        const pageElements = elements.filter((el) => el.pageNumber === pageNum);
        if (pageElements.length === 0) continue;

        const page = pages[i];
        const { height: pagePdfHeight } = page.getSize();

        for (const el of pageElements) {
          let dataUrlToEmbed = el.dataUrl;

          // If cropped, draw the cropped region onto an offscreen canvas
          if (el.crop) {
            const img = new window.Image();
            img.src = el.dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = el.crop.width;
            cropCanvas.height = el.crop.height;
            const ctx = cropCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, el.crop.x, el.crop.y, el.crop.width, el.crop.height, 0, 0, el.crop.width, el.crop.height);
              dataUrlToEmbed = cropCanvas.toDataURL('image/png');
            }
          }

          const base64Data = dataUrlToEmbed.split(',')[1];
          const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const embeddedImage = await pdfLibDoc.embedPng(imageBytes);

          const x = el.x;
          const y = pagePdfHeight - el.y - el.height;

          page.drawImage(embeddedImage, {
            x, y,
            width: el.width,
            height: el.height,
            opacity: el.opacity,
            rotate: degrees(el.rotation),
          });
        }
      }

      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${pdfDoc.file.name}`;
      link.click();
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Error compiling PDF:', error);
      alert('Failed to compile and export the modified PDF.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Crop handlers
  const handleInitCrop = () => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, {
      crop: { x: 0, y: 0, width: naturalSize.width, height: naturalSize.height },
    });
  };

  const handleCropChange = (field: string, value: number) => {
    if (!selectedElement || !selectedElement.crop) return;
    const newCrop = { ...selectedElement.crop, [field]: value };
    // Clamp values
    newCrop.x = Math.max(0, Math.min(newCrop.x, naturalSize.width - 20));
    newCrop.y = Math.max(0, Math.min(newCrop.y, naturalSize.height - 20));
    newCrop.width = Math.max(20, Math.min(newCrop.width, naturalSize.width - newCrop.x));
    newCrop.height = Math.max(20, Math.min(newCrop.height, naturalSize.height - newCrop.y));
    updateElement(selectedElement.id, { crop: newCrop });
  };

  // ─── RENDER ──────────────────────────────────

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <aside className="w-80 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-col z-10">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TerminalIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none tracking-wide uppercase text-indigo-400">Lab Terminal</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">STUDIO</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="p-4 border-b border-slate-800/80 flex gap-2">
          <button
            onClick={() => setActiveMode('terminal')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all ${
              activeMode === 'terminal'
                ? 'bg-indigo-600/20 border border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/10'
                : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="h-4 w-4" />
            Terminal
          </button>
          <button
            onClick={() => setActiveMode('pdf')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all ${
              activeMode === 'pdf'
                ? 'bg-indigo-600/20 border border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/10'
                : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            PDF Editor
          </button>
        </div>

        {/* ═══════ TERMINAL MODE SIDEBAR ═══════ */}
        {activeMode === 'terminal' && (
          <>
            <div className="flex border-b border-slate-800/80 text-xs px-2 pt-2">
              <button onClick={() => setActiveTab('prompt')} className={`flex-1 pb-2 font-medium border-b-2 transition-all ${activeTab === 'prompt' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Prompt</button>
              <button onClick={() => setActiveTab('style')} className={`flex-1 pb-2 font-medium border-b-2 transition-all ${activeTab === 'style' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Style</button>
              <button onClick={() => setActiveTab('sequence')} className={`flex-1 pb-2 font-medium border-b-2 transition-all ${activeTab === 'sequence' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Interactions</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTab === 'prompt' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Username</label>
                    <input type="text" value={settings.username} onChange={(e) => updateSettings({ username: e.target.value })} className="w-full glass-input text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Hostname</label>
                    <input type="text" value={settings.hostname} onChange={(e) => updateSettings({ hostname: e.target.value })} className="w-full glass-input text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Directory Path</label>
                    <input type="text" value={settings.currentPath} onChange={(e) => updateSettings({ currentPath: e.target.value })} className="w-full glass-input text-sm" />
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Terminal Theme</label>
                    <select value={settings.themeId} onChange={(e) => updateSettings({ themeId: e.target.value })} className="w-full glass-input text-sm bg-slate-950 cursor-pointer">
                      {Object.values(THEME_PRESETS).map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-950">{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Font Family</label>
                    <select value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })} className="w-full glass-input text-sm bg-slate-950 cursor-pointer">
                      <option value="Ubuntu Mono" className="bg-slate-950">Ubuntu Mono</option>
                      <option value="JetBrains Mono" className="bg-slate-950">JetBrains Mono</option>
                      <option value="Fira Code" className="bg-slate-950">Fira Code</option>
                      <option value="monospace" className="bg-slate-950">System Monospace</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      <span>Font Size</span><span className="text-indigo-400">{settings.fontSize}px</span>
                    </div>
                    <input type="range" min={12} max={24} value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      <span>Window Padding</span><span className="text-indigo-400">{settings.padding}px</span>
                    </div>
                    <input type="range" min={8} max={48} value={settings.padding} onChange={(e) => updateSettings({ padding: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-slate-800/40">
                    <span className="text-xs text-slate-300">Auto Height</span>
                    <input type="checkbox" checked={settings.isAutoHeight} onChange={(e) => updateSettings({ isAutoHeight: e.target.checked })} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                  </div>

                  {!settings.isAutoHeight && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        <span>Window Height</span><span className="text-indigo-400">{settings.customHeight}px</span>
                      </div>
                      <input type="range" min={200} max={800} value={settings.customHeight} onChange={(e) => updateSettings({ customHeight: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-t border-slate-800/40">
                    <span className="text-xs text-slate-300">Window Controls</span>
                    <input type="checkbox" checked={settings.showWindowControls} onChange={(e) => updateSettings({ showWindowControls: e.target.checked })} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                  </div>
                </div>
              )}

              {activeTab === 'sequence' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Interactive Rows</span>
                    <button onClick={handleAddDefaultInteraction} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1 px-2 rounded-md flex items-center gap-1 transition-all">
                      <Plus className="h-3 w-3" /> Add Row
                    </button>
                  </div>
                  <div className="space-y-3">
                    {interactions.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2 relative group">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button disabled={idx === 0} onClick={() => reorderInteractions(idx, idx - 1)} className="p-1 hover:text-indigo-400 disabled:opacity-30" title="Move Up"><MoveUp className="h-3 w-3" /></button>
                            <button disabled={idx === interactions.length - 1} onClick={() => reorderInteractions(idx, idx + 1)} className="p-1 hover:text-indigo-400 disabled:opacity-30" title="Move Down"><MoveDown className="h-3 w-3" /></button>
                            <button onClick={() => duplicateInteraction(item.id)} className="p-1 hover:text-indigo-400" title="Duplicate"><Copy className="h-3 w-3" /></button>
                            <button onClick={() => deleteInteraction(item.id)} className="p-1 hover:text-red-400" title="Delete"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <input type="text" placeholder="Command..." value={item.command} onChange={(e) => updateInteraction(item.id, e.target.value, item.output)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono" />
                          <textarea placeholder="Output (optional)..." value={item.output || ''} onChange={(e) => updateInteraction(item.id, item.command, e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono h-16 resize-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-800/80 flex justify-between items-center gap-3">
              <div className="flex gap-1">
                <button disabled={history.past.length === 0} onClick={undo} className="p-2 bg-slate-950/40 border border-slate-800/80 hover:text-indigo-400 rounded-lg transition-all disabled:opacity-30" title="Undo"><Undo2 className="h-4 w-4" /></button>
                <button disabled={history.future.length === 0} onClick={redo} className="p-2 bg-slate-950/40 border border-slate-800/80 hover:text-indigo-400 rounded-lg transition-all disabled:opacity-30" title="Redo"><Redo2 className="h-4 w-4" /></button>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{history.past.length} History</span>
            </div>
          </>
        )}

        {/* ═══════ PDF MODE SIDEBAR ═══════ */}
        {activeMode === 'pdf' && (
          <div className="flex-1 p-5 space-y-5 flex flex-col justify-start overflow-y-auto">
            {isPdfLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center">
                <span className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
                <p className="text-xs text-slate-400">Loading document...</p>
              </div>
            ) : !pdfDoc.file ? (
              <div className="flex-grow flex flex-col justify-center items-center text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-300">Upload PDF document</h3>
                <p className="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">Import your laboratory records to place generated terminal outputs.</p>
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-lg shadow-indigo-600/10 transition-all mt-4">
                  Select File
                  <input type="file" accept=".pdf" className="hidden" onChange={handleSidebarFileChange} />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Loaded file info */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Loaded File</span>
                    <button onClick={() => setPdfFile(null)} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors">Clear</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-200 font-semibold truncate">{pdfDoc.file.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{(pdfDoc.file.size / 1024 / 1024).toFixed(2)} MB • {pdfDoc.numPages} Pages</p>
                    </div>
                  </div>
                </div>

                <label className="cursor-pointer bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all">
                  <FilePlus className="h-3.5 w-3.5" />Replace PDF
                  <input type="file" accept=".pdf" className="hidden" onChange={handleSidebarFileChange} />
                </label>

                {/* ─── Snapshot Gallery ─── */}
                <div className="space-y-2 pt-4 border-t border-slate-800/40">
                  <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Snapshot Gallery</span>
                  {savedSnapshots.length === 0 ? (
                    <div className="py-4 text-center">
                      <Camera className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 italic">No snapshots saved yet.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Go to Terminal mode → click <strong className="text-slate-400">"Save Snapshot"</strong></p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedSnapshots.map((snap) => (
                        <div key={snap.id} className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg space-y-2 group">
                          <img src={snap.dataUrl} alt={snap.name} className="w-full h-20 object-contain rounded bg-slate-950 border border-slate-800/40" />
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-300 font-semibold truncate flex-1">{snap.name}</p>
                            <button onClick={() => deleteSnapshot(snap.id)} className="p-1 hover:text-red-400 text-slate-500 transition-colors shrink-0" title="Delete"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Selected Element Inspector ─── */}
                {selectedElement && (
                  <div className="space-y-3 pt-4 border-t border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Element Inspector</span>
                      <button onClick={() => setSelectedElementId(null)} className="p-0.5 hover:text-red-400 text-slate-500"><X className="h-3.5 w-3.5" /></button>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-1">
                      <button onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${selectedElement.isLocked ? 'bg-amber-600/10 border-amber-500/30 text-amber-400' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
                        {selectedElement.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {selectedElement.isLocked ? 'Locked' : 'Unlocked'}
                      </button>
                      <button onClick={() => duplicateElement(selectedElement.id)} className="flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase border bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center gap-1">
                        <Copy className="h-3 w-3" /> Duplicate
                      </button>
                      <button onClick={() => deleteElement(selectedElement.id)} className="py-1.5 px-2 rounded-md text-[10px] font-bold uppercase border bg-red-950/30 border-red-900/40 text-red-400 hover:text-red-300 transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Layer controls */}
                    <div className="flex gap-1">
                      <button onClick={() => bringToFront(selectedElement.id)} className="flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase border bg-slate-950/40 border-slate-800 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-1">
                        <Layers className="h-3 w-3" /> Front
                      </button>
                      <button onClick={() => sendToBack(selectedElement.id)} className="flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase border bg-slate-950/40 border-slate-800 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-1">
                        <Layers className="h-3 w-3 rotate-180" /> Back
                      </button>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>Opacity</span><span className="text-indigo-400">{Math.round(selectedElement.opacity * 100)}%</span></div>
                      <input type="range" min={0.1} max={1.0} step={0.05} value={selectedElement.opacity} onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
                    </div>

                    {/* ─── CROP CONTROLS ─── */}
                    <div className="pt-3 border-t border-slate-800/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Crop className="h-3 w-3" /> Clip / Crop</span>
                        {selectedElement.crop ? (
                          <button onClick={() => updateElement(selectedElement.id, { crop: null })} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase transition-colors flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" /> Reset
                          </button>
                        ) : (
                          <button onClick={handleInitCrop} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors">Enable</button>
                        )}
                      </div>

                      {selectedElement.crop && (
                        <div className="space-y-2.5 pl-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500"><span>Clip Left</span><span>{Math.round(selectedElement.crop.x)}px</span></div>
                            <input type="range" min={0} max={naturalSize.width - 20} value={selectedElement.crop.x} onChange={(e) => handleCropChange('x', Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500"><span>Clip Top</span><span>{Math.round(selectedElement.crop.y)}px</span></div>
                            <input type="range" min={0} max={naturalSize.height - 20} value={selectedElement.crop.y} onChange={(e) => handleCropChange('y', Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500"><span>Clip Width</span><span>{Math.round(selectedElement.crop.width)}px</span></div>
                            <input type="range" min={20} max={naturalSize.width} value={selectedElement.crop.width} onChange={(e) => handleCropChange('width', Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500"><span>Clip Height</span><span>{Math.round(selectedElement.crop.height)}px</span></div>
                            <input type="range" min={20} max={naturalSize.height} value={selectedElement.crop.height} onChange={(e) => handleCropChange('height', Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Placed elements list */}
                <div className="space-y-2 pt-4 border-t border-slate-800/40">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Placed Elements ({elements.length})</span>
                  {elements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No elements placed yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {elements.map((el, idx) => (
                        <button
                          key={el.id}
                          onClick={() => setSelectedElementId(el.id)}
                          className={`w-full p-2.5 rounded-lg flex items-center justify-between gap-3 transition-all text-left ${
                            el.id === selectedElementId
                              ? 'bg-indigo-600/10 border border-indigo-500/30'
                              : 'bg-slate-950/40 border border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-slate-300 font-medium truncate">Snapshot #{idx + 1}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Page {el.pageNumber} • {el.isLocked ? '🔒' : '🔓'} • {el.crop ? '✂️ Cropped' : 'Full'}</p>
                          </div>
                          <button onClick={(ev) => { ev.stopPropagation(); deleteElement(el.id); }} className="p-1 hover:text-red-400 transition-colors text-slate-500 shrink-0" title="Delete">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ═══════ MAIN WORKSPACE ═══════ */}
      <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-slate-950/0 to-slate-950/0 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        {/* Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Workspace /</span>
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              {activeMode === 'terminal' ? 'Ubuntu GNOME Simulator' : 'PDF Record Editor'}
            </span>
          </div>

          <div className="flex gap-2">
            {activeMode === 'terminal' && (
              <>
                <button onClick={handleCopyImage} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:text-slate-200 text-xs font-medium text-slate-400 transition-all hover:bg-slate-900">
                  <ImageIcon className="h-3.5 w-3.5" /> Copy Image
                </button>
                <button onClick={handleDownloadPng} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:text-slate-200 text-xs font-medium text-slate-400 transition-all hover:bg-slate-900">
                  <Download className="h-3.5 w-3.5" /> PNG
                </button>
                <button onClick={handleSaveSnapshot} className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/10 transition-all">
                  <Camera className="h-3.5 w-3.5" /> Save Snapshot
                </button>
                <button onClick={handleInsertToPdf} className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/10 transition-all">
                  Insert to PDF <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {activeMode === 'pdf' && pdfDoc.file && (
              <button onClick={handleExportPdf} disabled={isPdfLoading} className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-50">
                <FileText className="h-3.5 w-3.5" /> {isPdfLoading ? 'Compiling...' : 'Export PDF'}
              </button>
            )}
          </div>
        </header>

        {/* Workspace View */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          {activeMode === 'terminal' ? (
            <div className="flex flex-col items-center">
              <div className="mb-4 text-xs text-slate-500 font-semibold flex items-center gap-3">
                <span>Viewport: <strong className="text-slate-300">{settings.customWidth}px</strong></span>
                <span className="h-1.5 w-1.5 bg-slate-800 rounded-full" />
                <span>Font: <strong className="text-slate-300">{settings.fontFamily}</strong></span>
                <span className="h-1.5 w-1.5 bg-slate-800 rounded-full" />
                <span><strong className="text-emerald-400">{savedSnapshots.length}</strong> saved</span>
              </div>

              {/* Simulated Ubuntu GNOME Window Frame */}
              <div 
                id="terminal-render-target"
                className="rounded-xl shadow-2xl transition-all border overflow-hidden"
                style={{
                  width: `${settings.customWidth}px`,
                  minHeight: settings.isAutoHeight ? 'auto' : `${settings.customHeight}px`,
                  backgroundColor: activeTheme.backgroundColor,
                  borderColor: activeTheme.headerBackground,
                  color: activeTheme.textColor,
                  fontFamily: `"${settings.fontFamily}", monospace`,
                  fontSize: `${settings.fontSize}px`,
                }}
              >
                {/* Terminal Header */}
                {settings.showWindowControls && (
                  <div className="h-9 px-4 flex items-center justify-between border-b" style={{ backgroundColor: activeTheme.headerBackground, borderColor: activeTheme.backgroundColor }}>
                    <div className="flex gap-2">
                      {activeTheme.buttonStyle === 'ubuntu' ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full bg-[#f1543f] flex items-center justify-center text-[8px] font-bold text-slate-900 cursor-pointer">×</div>
                          <div className="h-3.5 w-3.5 rounded-full bg-[#3d3d3d] flex items-center justify-center text-[8px] font-bold text-slate-400 cursor-pointer">-</div>
                          <div className="h-3.5 w-3.5 rounded-full bg-[#3d3d3d] flex items-center justify-center text-[8px] font-bold text-slate-400 cursor-pointer">▢</div>
                        </>
                      ) : activeTheme.buttonStyle === 'macos' ? (
                        <>
                          <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                          <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                          <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-slate-700" />
                          <div className="h-2 w-2 rounded-full bg-slate-700" />
                          <div className="h-2 w-2 rounded-full bg-slate-700" />
                        </>
                      )}
                    </div>
                    <span className="text-xs font-semibold select-none" style={{ color: activeTheme.headerTextColor }}>
                      {settings.username}@{settings.hostname}: {settings.currentPath}
                    </span>
                    <div className="w-10" />
                  </div>
                )}

                {/* Terminal Body */}
                <div className="text-left font-mono select-text" style={{ padding: `${settings.padding}px`, lineHeight: '1.5', backgroundColor: activeTheme.backgroundColor }}>
                  {interactions.map((item) => (
                    <div key={item.id}>
                      <div className="flex flex-wrap items-center">
                        <span style={{ color: activeTheme.promptUserHostColor }}>{settings.username}@{settings.hostname}</span>
                        <span style={{ color: activeTheme.promptSeparatorColor }}>:</span>
                        <span style={{ color: activeTheme.promptPathColor }}>{settings.currentPath}</span>
                        <span style={{ color: activeTheme.promptSymbolColor }} className="mr-2">$</span>
                        <span>{item.command}</span>
                      </div>
                      {item.output ? <div className="whitespace-pre pl-1 opacity-95">{item.output}</div> : null}
                    </div>
                  ))}
                  <div className="flex items-center">
                    <span style={{ color: activeTheme.promptUserHostColor }}>{settings.username}@{settings.hostname}</span>
                    <span style={{ color: activeTheme.promptSeparatorColor }}>:</span>
                    <span style={{ color: activeTheme.promptPathColor }}>{settings.currentPath}</span>
                    <span style={{ color: activeTheme.promptSymbolColor }} className="mr-2">$</span>
                    <span className={`inline-block w-2 h-4 ${settings.isBlinkingCursor ? 'animate-pulse' : ''}`} style={{ 
                      backgroundColor: activeTheme.cursorColor,
                      height: settings.cursorStyle === 'block' ? '1.1em' : '1px',
                      width: settings.cursorStyle === 'beam' ? '2px' : '8px',
                      marginTop: settings.cursorStyle === 'underline' ? '0.8em' : '0px',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PageViewer />
          )}
        </div>
      </main>
    </div>
  );
}
