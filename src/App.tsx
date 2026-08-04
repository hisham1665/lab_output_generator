import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from './store/globalStore';
import { THEME_PRESETS } from './features/themes';
import { PageViewer } from './features/pdf-editor/components/PageViewer';
import { toPng, toBlob } from 'html-to-image';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { AnimatePresence, motion } from 'framer-motion';
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
  X,
  Settings2,
  Clipboard,
  Palette,
  List,
  Type,
  Search,
  Menu as MenuIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ═══════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  exiting?: boolean;
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, 2500);
  }, []);

  // Listen for global toast events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      showToast(e.detail.message, e.detail.type || 'info');
    };
    window.addEventListener('show-toast' as any, handler as any);
    return () => window.removeEventListener('show-toast' as any, handler as any);
  }, [showToast]);

  return { toasts, showToast };
}

// Toast Display Component
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : 'toast-info'} ${t.exiting ? 'toast-exit' : ''}`}
        >
          {t.type === 'success' && <span className="inline-flex mr-2">✓</span>}
          {t.type === 'error' && <span className="inline-flex mr-2">✕</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BOTTOM SHEET COMPONENT
// ═══════════════════════════════════════════════════════
function BottomSheet({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/60 rounded-t-2xl"
        style={{ maxHeight: '80vh', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto my-3" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-800/60">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 touch-btn-sm">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(80vh - 5rem)' }}>
          {children}
        </div>
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
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

  const { toasts, showToast } = useToast();

  // Mobile UI state
  const [bottomSheet, setBottomSheet] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  // Terminal preview scaling for mobile
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [mobileScale, setMobileScale] = useState(1);
  const [terminalHeight, setTerminalHeight] = useState(0);

  // Pinch-to-zoom & Pan state for mobile preview
  const [userZoom, setUserZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const lastTap = useRef(0);
  
  const gestureRef = useRef({
    startDist: 0,
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    startPoints: [] as { x: number; y: number }[],
    isDragging: false,
    isPinching: false,
  });

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
  };

  const getCenter = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    
    // Double tap to reset
    const now = Date.now();
    if (touches.length === 1) {
      if (now - lastTap.current < 300) {
        setUserZoom(1);
        setPanX(0);
        setPanY(0);
        showToast('Zoom/Pan Reset', 'info');
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      
      gestureRef.current.isDragging = true;
      gestureRef.current.isPinching = false;
      gestureRef.current.startPoints = [{ x: touches[0].clientX, y: touches[0].clientY }];
      gestureRef.current.startPan = { x: panX, y: panY };
    } else if (touches.length === 2) {
      gestureRef.current.isDragging = false;
      gestureRef.current.isPinching = true;
      
      const dist = getDistance(touches[0], touches[1]);
      gestureRef.current.startDist = dist;
      gestureRef.current.startZoom = userZoom;
      gestureRef.current.startPan = { x: panX, y: panY };
      
      gestureRef.current.startPoints = [
        { x: touches[0].clientX, y: touches[0].clientY },
        { x: touches[1].clientX, y: touches[1].clientY }
      ];
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touches = e.touches;
    
    if (gestureRef.current.isDragging && touches.length === 1) {
      const dx = touches[0].clientX - gestureRef.current.startPoints[0].x;
      const dy = touches[0].clientY - gestureRef.current.startPoints[0].y;
      
      if (userZoom > 1) {
        if (e.cancelable) e.preventDefault();
        setPanX(gestureRef.current.startPan.x + dx);
        setPanY(gestureRef.current.startPan.y + dy);
      }
    } else if (gestureRef.current.isPinching && touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      
      const dist = getDistance(touches[0], touches[1]);
      const factor = dist / gestureRef.current.startDist;
      const newZoom = Math.max(1, Math.min(gestureRef.current.startZoom * factor, 4));
      
      setUserZoom(newZoom);
      
      const currentCenter = getCenter(touches[0], touches[1]);
      const initialCenter = getCenter(
        { clientX: gestureRef.current.startPoints[0].x, clientY: gestureRef.current.startPoints[0].y } as any,
        { clientX: gestureRef.current.startPoints[1].x, clientY: gestureRef.current.startPoints[1].y } as any
      );
      const dx = currentCenter.x - initialCenter.x;
      const dy = currentCenter.y - initialCenter.y;
      
      setPanX(gestureRef.current.startPan.x + dx);
      setPanY(gestureRef.current.startPan.y + dy);
    }
  };

  const handleTouchEnd = () => {
    gestureRef.current.isDragging = false;
    gestureRef.current.isPinching = false;
  };

  // Measure container width and compute scale
  useEffect(() => {
    if (activeMode !== 'terminal') return;
    const container = terminalContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const terminalWidth = settings.customWidth;
      if (containerWidth < terminalWidth && containerWidth > 0) {
        setMobileScale(containerWidth / terminalWidth);
      } else {
        setMobileScale(1);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [settings.customWidth, activeMode]);

  // Measure actual terminal height for proper scaled layout
  useEffect(() => {
    if (activeMode !== 'terminal') return;
    const terminal = terminalRef.current;
    if (!terminal) return;

    const updateHeight = () => {
      const h = terminal.scrollHeight || terminal.offsetHeight;
      if (h > 0) {
        setTerminalHeight(h);
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(terminal);
    return () => observer.disconnect();
  }, [interactions, settings, activeMode]);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  const activeTheme = THEME_PRESETS[settings.themeId] || THEME_PRESETS.ubuntu;

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Auto-open element inspector on mobile when an element is selected
  useEffect(() => {
    if (selectedElement && window.innerWidth < 1024) {
      setBottomSheet('inspector');
    }
  }, [selectedElementId]);

  // ─── HANDLERS ──────────────────────────────────

  const handleAddDefaultInteraction = () => {
    addInteraction('ls -la', 'total 8\ndrwxr-xr-x  2 hisham hisham 4096 Aug  3 18:00 .\ndrwxr-xr-x 10 hisham hisham 4096 Aug  3 18:00 ..');
  };

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
      showToast('Failed to parse PDF document.', 'error');
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
        showToast('Terminal snapshot copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error copying image:', error);
      showToast('Failed to copy image. Check browser permissions.', 'error');
    }
    setFabOpen(false);
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
      showToast('PNG downloaded!', 'success');
    } catch (error) {
      console.error('Error downloading PNG:', error);
      showToast('Failed to generate PNG image.', 'error');
    }
    setFabOpen(false);
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
      showToast(`"${name}" saved! Switch to PDF Editor to place it.`, 'success');
    } catch (error) {
      console.error('Error saving snapshot:', error);
      showToast('Failed to capture terminal snapshot.', 'error');
    }
    setFabOpen(false);
  };

  // Quick insert: save snapshot then switch to PDF mode
  const handleInsertToPdf = async () => {
    if (!pdfDoc.file) {
      showToast('Upload a PDF file first!', 'info');
      setActiveMode('pdf');
      setFabOpen(false);
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
      showToast('Snapshot saved! Click "Place Snapshot" on any page.', 'success');
    } catch (error) {
      console.error('Error inserting to PDF:', error);
      showToast('Failed to capture terminal image.', 'error');
    }
    setFabOpen(false);
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
          
          // Support both PNG and JPEG
          let embeddedImage;
          if (dataUrlToEmbed.startsWith('data:image/jpeg') || dataUrlToEmbed.startsWith('data:image/jpg')) {
            embeddedImage = await pdfLibDoc.embedJpg(imageBytes);
          } else {
            embeddedImage = await pdfLibDoc.embedPng(imageBytes);
          }

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
      showToast('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('Error compiling PDF:', error);
      showToast('Failed to compile and export the PDF.', 'error');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Crop handlers — now uses visual crop overlay via custom events
  const handleStartCrop = () => {
    if (!selectedElement) return;
    window.dispatchEvent(new CustomEvent('crop-control', {
      detail: { elementId: selectedElement.id, action: 'start-crop' },
    }));
    setBottomSheet(null); // Close inspector on mobile to show the crop overlay
  };

  const handleResetCrop = () => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { crop: null });
    showToast('Crop reset', 'info');
  };

  // ─── RENDER ──────────────────────────────────

  // Sidebar content pieces (reusable for both desktop sidebar and mobile bottom sheets)
  const renderPromptTab = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Username</label>
        <input type="text" value={settings.username} onChange={(e) => updateSettings({ username: e.target.value })} className="w-full glass-input text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Hostname</label>
        <input type="text" value={settings.hostname} onChange={(e) => updateSettings({ hostname: e.target.value })} className="w-full glass-input text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Directory Path</label>
        <input type="text" value={settings.currentPath} onChange={(e) => updateSettings({ currentPath: e.target.value })} className="w-full glass-input text-sm" />
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Terminal Theme</label>
        <select value={settings.themeId} onChange={(e) => updateSettings({ themeId: e.target.value })} className="w-full glass-input text-sm bg-slate-950 cursor-pointer">
          {Object.values(THEME_PRESETS).map((t) => (
            <option key={t.id} value={t.id} className="bg-slate-950">{t.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Font Family</label>
        <select value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })} className="w-full glass-input text-sm bg-slate-950 cursor-pointer">
          <option value="Ubuntu Mono" className="bg-slate-950">Ubuntu Mono</option>
          <option value="JetBrains Mono" className="bg-slate-950">JetBrains Mono</option>
          <option value="Fira Code" className="bg-slate-950">Fira Code</option>
          <option value="monospace" className="bg-slate-950">System Monospace</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          <span>Font Size</span><span className="text-indigo-400">{settings.fontSize}px</span>
        </div>
        <input type="range" min={12} max={24} value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          <span>Window Padding</span><span className="text-indigo-400">{settings.padding}px</span>
        </div>
        <input type="range" min={8} max={48} value={settings.padding} onChange={(e) => updateSettings({ padding: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
      </div>

      <div className="flex items-center justify-between py-2 border-t border-slate-800/40">
        <span className="text-xs text-slate-300">Auto Height</span>
        <input type="checkbox" checked={settings.isAutoHeight} onChange={(e) => updateSettings({ isAutoHeight: e.target.checked })} className="w-5 h-5 rounded accent-indigo-500 cursor-pointer" />
      </div>

      {!settings.isAutoHeight && (
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <span>Window Height</span><span className="text-indigo-400">{settings.customHeight}px</span>
          </div>
          <input type="range" min={200} max={800} value={settings.customHeight} onChange={(e) => updateSettings({ customHeight: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
        </div>
      )}

      <div className="flex items-center justify-between py-2 border-t border-slate-800/40">
        <span className="text-xs text-slate-300">Window Controls</span>
        <input type="checkbox" checked={settings.showWindowControls} onChange={(e) => updateSettings({ showWindowControls: e.target.checked })} className="w-5 h-5 rounded accent-indigo-500 cursor-pointer" />
      </div>
    </div>
  );

  const renderInteractionsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Interactive Rows</span>
        <button onClick={handleAddDefaultInteraction} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all tap-bounce touch-btn-sm">
          <Plus className="h-3.5 w-3.5" /> Add Row
        </button>
      </div>
      <div className="space-y-3">
        {interactions.map((item, idx) => (
          <div key={item.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5 relative">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500">#{idx + 1}</span>
              <div className="flex items-center gap-0.5">
                <button disabled={idx === 0} onClick={() => reorderInteractions(idx, idx - 1)} className="p-2 hover:text-indigo-400 disabled:opacity-30 touch-btn-sm" title="Move Up"><MoveUp className="h-4 w-4" /></button>
                <button disabled={idx === interactions.length - 1} onClick={() => reorderInteractions(idx, idx + 1)} className="p-2 hover:text-indigo-400 disabled:opacity-30 touch-btn-sm" title="Move Down"><MoveDown className="h-4 w-4" /></button>
                <button onClick={() => duplicateInteraction(item.id)} className="p-2 hover:text-indigo-400 touch-btn-sm" title="Duplicate"><Copy className="h-4 w-4" /></button>
                <button onClick={() => deleteInteraction(item.id)} className="p-2 hover:text-red-400 touch-btn-sm" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <input type="text" placeholder="Command..." value={item.command} onChange={(e) => updateInteraction(item.id, e.target.value, item.output)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono" />
              <textarea placeholder="Output (optional)..." value={item.output || ''} onChange={(e) => updateInteraction(item.id, item.command, e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono h-20 resize-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderElementInspector = () => {
    if (!selectedElement) return <p className="text-sm text-slate-500 text-center py-4">No element selected</p>;
    return (
      <div className="space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })} className={`py-3 rounded-xl text-xs font-bold uppercase border transition-all flex flex-col items-center justify-center gap-1 tap-bounce ${selectedElement.isLocked ? 'bg-amber-600/10 border-amber-500/30 text-amber-400' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
            {selectedElement.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {selectedElement.isLocked ? 'Locked' : 'Unlocked'}
          </button>
          <button onClick={() => duplicateElement(selectedElement.id)} className="py-3 rounded-xl text-xs font-bold uppercase border bg-slate-950/40 border-slate-800 text-slate-400 transition-all flex flex-col items-center justify-center gap-1 tap-bounce">
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button onClick={() => { deleteElement(selectedElement.id); setBottomSheet(null); }} className="py-3 rounded-xl text-xs font-bold uppercase border bg-red-950/30 border-red-900/40 text-red-400 transition-all flex flex-col items-center justify-center gap-1 tap-bounce">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>

        {/* Layer controls */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => bringToFront(selectedElement.id)} className="py-2.5 rounded-xl text-xs font-bold uppercase border bg-slate-950/40 border-slate-800 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5 tap-bounce">
            <Layers className="h-4 w-4" /> Front
          </button>
          <button onClick={() => sendToBack(selectedElement.id)} className="py-2.5 rounded-xl text-xs font-bold uppercase border bg-slate-950/40 border-slate-800 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5 tap-bounce">
            <Layers className="h-4 w-4 rotate-180" /> Back
          </button>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase"><span>Opacity</span><span className="text-indigo-400">{Math.round(selectedElement.opacity * 100)}%</span></div>
          <input type="range" min={0.1} max={1.0} step={0.05} value={selectedElement.opacity} onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })} className="w-full accent-indigo-500 cursor-pointer" />
        </div>

        {/* Crop controls */}
        <div className="pt-3 border-t border-slate-800/40 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Crop className="h-3.5 w-3.5" /> Crop</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStartCrop}
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 transition-all flex items-center justify-center gap-1.5 tap-bounce"
            >
              <Crop className="h-4 w-4" /> {selectedElement.crop ? 'Adjust Crop' : 'Start Crop'}
            </button>
            {selectedElement.crop && (
              <button
                onClick={handleResetCrop}
                className="py-3 px-4 rounded-xl text-xs font-bold uppercase border bg-red-950/30 border-red-900/40 text-red-400 transition-all flex items-center justify-center gap-1.5 tap-bounce"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            )}
          </div>
          {selectedElement.crop && (
            <p className="text-[10px] text-slate-500">
              Cropped: {Math.round(selectedElement.crop.width)}×{Math.round(selectedElement.crop.height)}px from ({Math.round(selectedElement.crop.x)}, {Math.round(selectedElement.crop.y)})
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* ═══════ DESKTOP SIDEBAR (hidden on mobile) ═══════ */}
      <aside className="hidden lg:flex w-80 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex-col z-10">
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

        {/* ═══════ TERMINAL MODE DESKTOP SIDEBAR ═══════ */}
        {activeMode === 'terminal' && (
          <>
            <div className="flex border-b border-slate-800/80 text-xs px-2 pt-2">
              <button onClick={() => setBottomSheet('prompt')} className={`flex-1 pb-2 font-medium border-b-2 transition-all ${bottomSheet === 'prompt' || (!bottomSheet && true) ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Prompt</button>
              <button onClick={() => setBottomSheet('style')} className={`flex-1 pb-2 font-medium border-b-2 transition-all ${bottomSheet === 'style' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Style</button>
              <button onClick={() => setBottomSheet('interactions')} className={`flex-1 pb-2 font-medium border-b-2 transition-all ${bottomSheet === 'interactions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Interactions</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {(bottomSheet === 'style') ? renderStyleTab() :
               (bottomSheet === 'interactions') ? renderInteractionsTab() :
               renderPromptTab()}
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

        {/* ═══════ PDF MODE DESKTOP SIDEBAR ═══════ */}
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

                {/* Snapshot Gallery */}
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

                {/* Selected Element Inspector (desktop) */}
                {selectedElement && (
                  <div className="space-y-3 pt-4 border-t border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Element Inspector</span>
                      <button onClick={() => setSelectedElementId(null)} className="p-0.5 hover:text-red-400 text-slate-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    {renderElementInspector()}
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
                            <p className="text-xs text-slate-300 font-medium truncate">
                              {el.sourceType === 'upload' ? '📷 Image' : '💻 Snapshot'} #{idx + 1}
                            </p>
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

        {/* Header — Desktop only */}
        <header className="hidden lg:flex h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md items-center justify-between px-8 z-10 shrink-0">
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

        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center">
              <TerminalIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xs leading-none tracking-wide uppercase text-slate-200">
                {activeMode === 'terminal' ? 'Terminal' : 'PDF Editor'}
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Lab Studio</p>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            {activeMode === 'terminal' && (
              <>
                <button onClick={undo} disabled={history.past.length === 0} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-30 touch-btn-sm">
                  <Undo2 className="h-4 w-4" />
                </button>
                <button onClick={redo} disabled={history.future.length === 0} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-30 touch-btn-sm">
                  <Redo2 className="h-4 w-4" />
                </button>
              </>
            )}
            {activeMode === 'pdf' && pdfDoc.file && (
              <button onClick={handleExportPdf} disabled={isPdfLoading} className="py-2 px-3.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white tap-bounce touch-btn-sm">
                {isPdfLoading ? '...' : 'Export'}
              </button>
            )}
          </div>
        </header>

        {/* Workspace View */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-auto pb-20 lg:pb-8">
          {activeMode === 'terminal' ? (
            <div className="flex flex-col items-center w-full">
              {/* Info bar - desktop only */}
              <div className="hidden lg:flex mb-4 text-xs text-slate-500 font-semibold items-center gap-3">
                <span>Viewport: <strong className="text-slate-300">{settings.customWidth}px</strong></span>
                <span className="h-1.5 w-1.5 bg-slate-800 rounded-full" />
                <span>Font: <strong className="text-slate-300">{settings.fontFamily}</strong></span>
                <span className="h-1.5 w-1.5 bg-slate-800 rounded-full" />
                <span><strong className="text-emerald-400">{savedSnapshots.length}</strong> saved</span>
              </div>

              {/* Mobile scale indicator & interactive zoom controls */}
              {mobileScale < 1 && (
                <div className="lg:hidden mb-3 text-[10px] text-slate-400 font-medium flex flex-col items-center gap-1.5 select-none w-full px-2">
                  <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1.5 shadow-lg">
                    <button 
                      onClick={() => setUserZoom(Math.max(1, userZoom - 0.25))} 
                      className="p-1 hover:text-indigo-400 text-slate-300 touch-btn-sm"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-full text-indigo-300 font-semibold">
                      {Math.round(mobileScale * userZoom * 100)}%
                    </span>
                    <button 
                      onClick={() => setUserZoom(Math.min(4, userZoom + 0.25))} 
                      className="p-1 hover:text-indigo-400 text-slate-300 touch-btn-sm"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    {(userZoom > 1 || panX !== 0 || panY !== 0) && (
                      <button 
                        onClick={() => { setUserZoom(1); setPanX(0); setPanY(0); }} 
                        className="text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 hover:bg-amber-500/20 ml-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500">Pinch or tap +/- to zoom • Drag to pan • Double tap reset</span>
                </div>
              )}

              {/* Terminal scaling wrapper — measures available width and scales the 800px terminal to fit */}
              <div 
                ref={terminalContainerRef} 
                className={`w-full flex justify-center touch-none ${userZoom > 1 ? 'overflow-visible z-20' : 'overflow-hidden'}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  touchAction: 'none',
                  cursor: userZoom > 1 ? 'grab' : 'default',
                }}
              >
                <div
                  style={{
                    transform: `translate3d(${panX}px, ${panY}px, 0) scale(${mobileScale * userZoom})`,
                    transformOrigin: 'top center',
                    width: `${settings.customWidth}px`,
                    height: (terminalHeight > 0 && mobileScale < 1) ? `${terminalHeight * mobileScale * userZoom}px` : undefined,
                    transition: gestureRef.current.isDragging || gestureRef.current.isPinching ? 'none' : 'transform 0.15s ease-out, height 0.15s ease-out',
                  }}
                >
                  <div 
                    ref={terminalRef}
                    id="terminal-render-target"
                    className="rounded-xl shadow-2xl transition-all border overflow-hidden shrink-0"
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
                    {/* Terminal Header — Authentic GNOME Terminal Layout */}
                    {settings.showWindowControls && (
                      <div 
                        className="h-10 px-3 flex items-center justify-between border-b select-none" 
                        style={{ backgroundColor: activeTheme.headerBackground, borderColor: activeTheme.backgroundColor }}
                      >
                        {/* Left Controls: New Tab icon [+] */}
                        {activeTheme.buttonStyle === 'macos' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-6 w-6 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-200 cursor-pointer"
                              title="New Tab"
                            >
                              +
                            </div>
                          </div>
                        )}

                        {/* Title text */}
                        <span 
                          className="text-xs font-bold truncate max-w-[260px] sm:max-w-[420px] px-2 text-center" 
                          style={{ color: activeTheme.headerTextColor }}
                        >
                          {settings.username}@{settings.hostname}: {settings.currentPath}
                        </span>

                        {/* Right Controls: Search, Menu, Minimize, Maximize, Close */}
                        {activeTheme.buttonStyle === 'macos' ? (
                          <div className="w-12" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="h-6 w-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer transition-colors" title="Search">
                              <Search className="h-3 w-3" />
                            </div>
                            <div className="h-6 w-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer transition-colors" title="Menu">
                              <MenuIcon className="h-3 w-3" />
                            </div>
                            <div className="h-3 w-[1px] bg-slate-600/60 mx-1" />
                            <div className="h-6 w-6 rounded-full hover:bg-white/15 flex items-center justify-center text-slate-200 text-xs font-light cursor-pointer" title="Minimize">−</div>
                            <div className="h-6 w-6 rounded-full hover:bg-white/15 flex items-center justify-center text-slate-200 text-[10px] cursor-pointer" title="Maximize">▢</div>
                            <div className="h-6 w-6 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center text-slate-100 text-xs cursor-pointer transition-colors" title="Close">✕</div>
                          </div>
                        )}
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
              </div>
            </div>
          ) : (
            <PageViewer />
          )}
        </div>
      </main>

      {/* ═══════ MOBILE BOTTOM TAB BAR ═══════ */}
      <div className="lg:hidden bottom-tab-bar">
        <div className="flex items-stretch">
          {/* Tab: Terminal */}
          <button
            onClick={() => { setActiveMode('terminal'); setFabOpen(false); }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all tap-bounce ${
              activeMode === 'terminal' ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <TerminalIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Terminal</span>
          </button>

          {/* Tab: Settings / Controls */}
          <button
            onClick={() => {
              if (activeMode === 'terminal') {
                setBottomSheet(bottomSheet === 'terminal-settings' ? null : 'terminal-settings');
              } else {
                setBottomSheet(bottomSheet === 'pdf-settings' ? null : 'pdf-settings');
              }
              setFabOpen(false);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all tap-bounce ${
              bottomSheet ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <Settings2 className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Controls</span>
          </button>

          {/* Tab: PDF Editor */}
          <button
            onClick={() => { setActiveMode('pdf'); setFabOpen(false); }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all tap-bounce ${
              activeMode === 'pdf' ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
          </button>
        </div>
      </div>

      {/* ═══════ MOBILE FAB (Floating Action Button) ═══════ */}
      <div className="lg:hidden">
        {/* FAB Menu Items */}
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              className="fixed right-4 z-30 flex flex-col gap-2"
              style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {activeMode === 'terminal' ? (
                <>
                  <motion.button
                    onClick={handleInsertToPdf}
                    className="fab-menu-item"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.05 }}
                  >
                    <ArrowRight className="h-4 w-4 text-indigo-400" /> Insert to PDF
                  </motion.button>
                  <motion.button
                    onClick={handleSaveSnapshot}
                    className="fab-menu-item"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Camera className="h-4 w-4 text-emerald-400" /> Save Snapshot
                  </motion.button>
                  <motion.button
                    onClick={handleDownloadPng}
                    className="fab-menu-item"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Download className="h-4 w-4 text-slate-400" /> Download PNG
                  </motion.button>
                  <motion.button
                    onClick={handleCopyImage}
                    className="fab-menu-item"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Clipboard className="h-4 w-4 text-slate-400" /> Copy to Clipboard
                  </motion.button>
                </>
              ) : (
                pdfDoc.file && (
                  <motion.button
                    onClick={handleExportPdf}
                    className="fab-menu-item"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Download className="h-4 w-4 text-indigo-400" /> Export PDF
                  </motion.button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB backdrop */}
        {fabOpen && (
          <div className="fixed inset-0 z-20" onClick={() => setFabOpen(false)} />
        )}

        {/* FAB Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`fab fab-primary h-14 w-14 z-30 transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`}
          style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', right: '1rem' }}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* ═══════ MOBILE BOTTOM SHEETS ═══════ */}
      <AnimatePresence>
        {/* Terminal Settings Bottom Sheet */}
        {bottomSheet === 'terminal-settings' && activeMode === 'terminal' && (
          <BottomSheet
            isOpen={true}
            onClose={() => setBottomSheet(null)}
            title="Terminal Controls"
          >
            {/* Sub-tabs inside the sheet */}
            <div className="flex gap-2 mb-5 -mt-1">
              {[
                { id: 'prompt-sub', label: 'Prompt', icon: <Type className="h-3.5 w-3.5" /> },
                { id: 'style-sub', label: 'Style', icon: <Palette className="h-3.5 w-3.5" /> },
                { id: 'interactions-sub', label: 'Rows', icon: <List className="h-3.5 w-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBottomSheet(tab.id)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border transition-all flex items-center justify-center gap-1.5 tap-bounce ${
                    bottomSheet === tab.id ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            {renderPromptTab()}
          </BottomSheet>
        )}

        {bottomSheet === 'prompt-sub' && (
          <BottomSheet isOpen={true} onClose={() => setBottomSheet(null)} title="Prompt Settings">
            {renderPromptTab()}
          </BottomSheet>
        )}

        {bottomSheet === 'style-sub' && (
          <BottomSheet isOpen={true} onClose={() => setBottomSheet(null)} title="Style Settings">
            {renderStyleTab()}
          </BottomSheet>
        )}

        {bottomSheet === 'interactions-sub' && (
          <BottomSheet isOpen={true} onClose={() => setBottomSheet(null)} title="Interactions">
            {renderInteractionsTab()}
          </BottomSheet>
        )}

        {/* PDF Settings Bottom Sheet */}
        {bottomSheet === 'pdf-settings' && activeMode === 'pdf' && (
          <BottomSheet
            isOpen={true}
            onClose={() => setBottomSheet(null)}
            title="PDF Controls"
          >
            <div className="space-y-4">
              {!pdfDoc.file ? (
                <div className="text-center py-6">
                  <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No PDF loaded</p>
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 px-5 rounded-xl shadow-lg inline-block mt-3 tap-bounce">
                    Upload PDF
                    <input type="file" accept=".pdf" className="hidden" onChange={handleSidebarFileChange} />
                  </label>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 font-semibold truncate">{pdfDoc.file.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{(pdfDoc.file.size / 1024 / 1024).toFixed(2)} MB • {pdfDoc.numPages} Pages</p>
                      </div>
                      <button onClick={() => setPdfFile(null)} className="p-2 text-red-400 tap-bounce touch-btn-sm">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Snapshot Gallery */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">Snapshots ({savedSnapshots.length})</span>
                    {savedSnapshots.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No snapshots yet. Create them in Terminal mode.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {savedSnapshots.map((snap) => (
                          <div key={snap.id} className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                            <img src={snap.dataUrl} alt={snap.name} className="w-full h-16 object-contain rounded bg-slate-950 mb-1" />
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-slate-300 font-medium truncate flex-1">{snap.name}</p>
                              <button onClick={() => deleteSnapshot(snap.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Placed elements list */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Elements ({elements.length})</span>
                    {elements.length > 0 && (
                      <div className="space-y-1.5">
                        {elements.map((el, idx) => (
                          <button
                            key={el.id}
                            onClick={() => { setSelectedElementId(el.id); setBottomSheet('inspector'); }}
                            className={`w-full p-3 rounded-xl flex items-center justify-between transition-all text-left tap-bounce ${
                              el.id === selectedElementId
                                ? 'bg-indigo-600/10 border border-indigo-500/30'
                                : 'bg-slate-950/40 border border-slate-800/80'
                            }`}
                          >
                            <div>
                              <p className="text-xs text-slate-300 font-medium">
                                {el.sourceType === 'upload' ? '📷 Image' : '💻 Snapshot'} #{idx + 1}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Page {el.pageNumber} • {el.crop ? '✂️ Cropped' : 'Full'}</p>
                            </div>
                            <button onClick={(ev) => { ev.stopPropagation(); deleteElement(el.id); }} className="p-2 text-slate-500 hover:text-red-400 touch-btn-sm">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </BottomSheet>
        )}

        {/* Element Inspector Bottom Sheet (mobile) */}
        {bottomSheet === 'inspector' && selectedElement && (
          <BottomSheet
            isOpen={true}
            onClose={() => { setBottomSheet(null); setSelectedElementId(null); }}
            title="Element Inspector"
          >
            {renderElementInspector()}
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
