import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useStore } from '../../../store/globalStore';
import { CanvasOverlay } from './CanvasOverlay';
import { PAGE_PRESETS, type PagePreset } from '../../../types';
import { 
  ZoomIn, 
  ZoomOut, 
  Loader2, 
  ImagePlus, 
  Upload, 
  X, 
  Plus, 
  Trash2
} from 'lucide-react';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up pdf.js worker URL using local bundled worker to prevent CDN 404 errors
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageRendererProps {
  pageNumber: number;
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  zoomScale: number;
  effectiveZoom: number;
}

const PageRenderer: React.FC<PageRendererProps> = ({ pageNumber, pdfDocument, zoomScale, effectiveZoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let renderTask: any = null;

    const renderPage = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        const page = await pdfDocument.getPage(pageNumber);
        
        // High-DPI canvas resolution (minimum 2x or devicePixelRatio)
        const outputScale = Math.max(2, window.devicePixelRatio || 1);
        const viewport = page.getViewport({ scale: zoomScale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        setViewportSize({ width: viewport.width, height: viewport.height });

        // Use PDF.js transform matrix for High-DPI scaling so PDF content fills 100% of page width
        const transform = outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : undefined;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          transform: transform,
          canvas: canvas,
        });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocument, pageNumber, zoomScale]);

  return (
    <div 
      className="relative shadow-2xl border border-slate-700/60 bg-white overflow-hidden rounded-b-lg transition-all"
      style={{ width: viewportSize.width || 'auto', height: viewportSize.height || 'auto' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      {isRendering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      )}
      {!isRendering && viewportSize.width > 0 && (
        <CanvasOverlay
          pageNumber={pageNumber}
          width={viewportSize.width}
          height={viewportSize.height}
          effectiveZoom={effectiveZoom}
        />
      )}
    </div>
  );
};

const BlankPageRenderer: React.FC<{ pageNumber: number; pageSize: { width: number; height: number }; zoomScale: number; effectiveZoom: number }> = ({ pageNumber, pageSize, zoomScale, effectiveZoom }) => {
  const scaledWidth = (pageSize?.width || 595) * zoomScale;
  const scaledHeight = (pageSize?.height || 842) * zoomScale;

  return (
    <div 
      className="relative shadow-2xl border border-slate-700/60 bg-white overflow-hidden rounded-b-lg transition-all"
      style={{ width: scaledWidth, height: scaledHeight }}
    >
      <CanvasOverlay
        pageNumber={pageNumber}
        width={scaledWidth}
        height={scaledHeight}
        effectiveZoom={effectiveZoom}
      />
    </div>
  );
};

export const PageViewer: React.FC = () => {
  const { 
    pdfDoc, 
    setZoomScale, 
    savedSnapshots, 
    addElement, 
    addBlankPage, 
    deletePage, 
    updatePagePreset 
  } = useStore();

  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerPage, setPickerPage] = useState<number | null>(null);

  // Container width observer for Canva/Photoshop style mobile auto-fit
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadPdfDoc = async () => {
      if (!pdfDoc.file) {
        setPdfDocument(null);
        return;
      }
      setIsLoading(true);
      try {
        const arrayBuffer = await pdfDoc.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        setPdfDocument(pdf);
      } catch (err) {
        console.error('Error auto-loading PDF:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPdfDoc();
  }, [pdfDoc.file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    window.dispatchEvent(new CustomEvent('request-pdf-upload', { detail: { file } }));
  };

  const handlePlaceSnapshot = (snapshotId: string, pageNum: number) => {
    const snap = savedSnapshots.find((s) => s.id === snapshotId);
    if (!snap) return;

    const targetPageSize = pdfDoc.pageSizes[pageNum - 1] || { width: 595, height: 842 };
    const aspect = snap.width / snap.height;

    // Smart placement: 90% of page width, horizontally centered (5% margin left & right)
    const placementWidth = Math.round(targetPageSize.width * 0.90);
    const placementHeight = placementWidth / aspect;
    const x = Math.round((targetPageSize.width - placementWidth) / 2);
    const y = 35;

    addElement({
      snapshotId: snap.id,
      sourceType: 'snapshot',
      dataUrl: snap.dataUrl,
      x,
      y,
      width: placementWidth,
      height: placementHeight,
      rotation: 0,
      opacity: 1,
      shadowBlur: 6,
      shadowColor: 'rgba(0,0,0,0.2)',
      borderRadius: 6,
      crop: null,
      isLocked: false,
      pageNumber: pageNum,
    });

    setPickerPage(null);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Snapshot placed centered on page!', type: 'success' } }));
  };

  const handleImageUpload = useCallback((pageNum: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;

        const img = new window.Image();
        img.onload = () => {
          const targetPageSize = pdfDoc.pageSizes[pageNum - 1] || { width: 595, height: 842 };
          const aspect = img.naturalWidth / img.naturalHeight;

          // Smart placement: 90% of page width, horizontally centered
          const placementWidth = Math.round(targetPageSize.width * 0.90);
          const placementHeight = placementWidth / aspect;
          const x = Math.round((targetPageSize.width - placementWidth) / 2);
          const y = 35;

          addElement({
            sourceType: 'upload',
            dataUrl,
            x,
            y,
            width: placementWidth,
            height: placementHeight,
            rotation: 0,
            opacity: 1,
            shadowBlur: 0,
            shadowColor: 'rgba(0,0,0,0)',
            borderRadius: 0,
            crop: null,
            isLocked: false,
            pageNumber: pageNum,
          });

          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Image placed centered on page ${pageNum}!`, type: 'success' } }));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addElement, pdfDoc.pageSizes]);

  const handleZoom = (amount: number) => {
    setZoomScale(pdfDoc.zoomScale + amount);
  };

  const isBlankCanvas = !pdfDoc.file;

  // Strict Mobile Enclosure: On ALL screen sizes, constrain canvas width to fit inside the container
  const widestPageWidth = Math.max(...pdfDoc.pageSizes.map(p => p.width), 595);
  const isMobileViewport = containerWidth > 0 && containerWidth < 768;
  const maxAllowedWidth = containerWidth > 0 ? Math.max(280, containerWidth - 20) : 340;
  const fitToContainerScale = maxAllowedWidth / widestPageWidth;
  
  // On mobile screens, clamp effective zoom so page width NEVER exceeds device viewport width
  // On desktop, only clamp if user zoomed so far that pages overflow the container
  const effectiveZoom = isMobileViewport 
    ? Math.min(pdfDoc.zoomScale, fitToContainerScale)
    : pdfDoc.zoomScale;
  
  // Helper: compute per-page effective zoom (for pages wider than the widest, e.g. landscape)
  const getPageEffectiveZoom = (pageWidth: number) => {
    if (!isMobileViewport || containerWidth <= 0) return pdfDoc.zoomScale;
    const pageMaxScale = maxAllowedWidth / pageWidth;
    return Math.min(pdfDoc.zoomScale, pageMaxScale);
  };

  // Auto-fit on mobile: when containerWidth is first measured, set zoom to fit
  const hasAutoFitted = useRef(false);
  useEffect(() => {
    if (isMobileViewport && containerWidth > 0 && !hasAutoFitted.current) {
      hasAutoFitted.current = true;
      // Only auto-fit if current zoom would overflow
      if (pdfDoc.zoomScale > fitToContainerScale) {
        setZoomScale(fitToContainerScale);
      }
    }
  }, [isMobileViewport, containerWidth, fitToContainerScale, pdfDoc.zoomScale, setZoomScale]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400 font-semibold">Parsing document layout...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-x-hidden">
      {/* Viewer controls toolbar */}
      <div className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xs flex items-center justify-between px-3 lg:px-6 select-none shrink-0 z-20 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 items-center shrink-0">
          <button 
            onClick={() => handleZoom(-0.1)}
            className="p-2 hover:text-indigo-400 rounded-lg bg-slate-800/80 text-slate-300 touch-btn-sm cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-300 w-12 text-center select-none">
            {Math.round(effectiveZoom * 100)}%
          </span>
          <button 
            onClick={() => handleZoom(0.1)}
            className="p-2 hover:text-indigo-400 rounded-lg bg-slate-800/80 text-slate-300 touch-btn-sm cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {isMobileViewport && (
            <button
              onClick={() => setZoomScale(fitToContainerScale)}
              className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 rounded-md ml-1 tap-bounce cursor-pointer"
              title="Fit to Screen"
            >
              Fit
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">
            <strong className="text-slate-200">{pdfDoc.numPages}</strong> {pdfDoc.numPages === 1 ? 'Page' : 'Pages'}
          </span>

          {isBlankCanvas && (
            <button
              onClick={() => addBlankPage('a4_portrait')}
              className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10 tap-bounce cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> <span>Add Page</span>
            </button>
          )}

          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] py-1.5 px-3 rounded-lg border border-slate-700 transition-all flex items-center gap-1 tap-bounce">
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            <span>{pdfDoc.file ? 'Replace PDF' : 'Import PDF'}</span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      {/* Pages Container - overflow-x-hidden enforces ZERO horizontal scrolling on mobile */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 lg:px-4 bg-slate-950/20 pb-28 flex flex-col items-center w-full">
        {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => {
          const pageSize = pdfDoc.pageSizes[pageNum - 1] || { width: 595, height: 842, preset: 'a4_portrait' };
          const currentPreset = pageSize.preset || 'a4_portrait';
          const pageZoom = getPageEffectiveZoom(pageSize.width);
          const cardWidth = pageSize.width * pageZoom;

          return (
            <div 
              key={pageNum} 
              className="relative my-4 lg:my-8 flex flex-col items-center transition-all"
              style={{ width: cardWidth, maxWidth: '100%' }}
            >
              {/* Responsive Page Header Bar - Width Locked to Paper Canvas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-700/60 border-b-0 rounded-t-lg p-2 sm:px-3 py-2 select-none w-full gap-2 overflow-hidden">
                <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                    Page <strong className="text-slate-200">{pageNum}</strong>/{pdfDoc.numPages}
                  </span>

                  {/* Preset selector for blank canvas pages */}
                  {isBlankCanvas && (
                    <select
                      value={currentPreset}
                      onChange={(e) => updatePagePreset(pageNum, e.target.value as PagePreset)}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-indigo-300 font-medium rounded px-1.5 py-1 cursor-pointer outline-none focus:border-indigo-500 min-w-0 truncate"
                    >
                      {Object.entries(PAGE_PRESETS).map(([key, info]) => (
                        <option key={key} value={key} className="bg-slate-950 text-slate-200">
                          {info.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Mobile delete button */}
                  {isBlankCanvas && pdfDoc.numPages > 1 && (
                    <button
                      onClick={() => {
                        deletePage(pageNum);
                        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Deleted Page ${pageNum}`, type: 'info' } }));
                      }}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-800 sm:hidden ml-auto cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 w-full sm:w-auto justify-end shrink-0">
                  {/* Upload Image button */}
                  <button
                    onClick={() => handleImageUpload(pageNum)}
                    className="flex-1 sm:flex-initial text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10 active:scale-[0.97] tap-bounce cursor-pointer"
                    title="Upload image"
                  >
                    <Upload className="h-3 w-3" />
                    <span>+ Image</span>
                  </button>

                  {/* Place Snapshot button */}
                  <button
                    onClick={() => setPickerPage(pickerPage === pageNum ? null : pageNum)}
                    className="flex-1 sm:flex-initial text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 active:scale-[0.97] tap-bounce cursor-pointer"
                  >
                    <ImagePlus className="h-3 w-3" />
                    <span>+ Snapshot</span>
                  </button>

                  {/* Desktop delete button */}
                  {isBlankCanvas && pdfDoc.numPages > 1 && (
                    <button
                      onClick={() => {
                        deletePage(pageNum);
                        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Deleted Page ${pageNum}`, type: 'info' } }));
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-800 hidden sm:block cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Snapshot Picker Dropdown */}
              {pickerPage === pageNum && (
                <div className="w-full bg-slate-900 border-x border-slate-700/60 px-3 lg:px-4 py-3 z-30 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Choose a Snapshot</span>
                    <button onClick={() => setPickerPage(null)} className="p-1 hover:text-red-400 text-slate-400 transition-colors touch-btn-sm cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {savedSnapshots.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No snapshots saved yet. Go to Terminal Generator mode and click <strong className="text-slate-400">"Save Snapshot"</strong> first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {savedSnapshots.map((snap) => (
                        <button
                          key={snap.id}
                          onClick={() => handlePlaceSnapshot(snap.id, pageNum)}
                          className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-lg p-2 transition-all hover:shadow-lg hover:shadow-indigo-600/5 text-left tap-bounce cursor-pointer"
                        >
                          <img 
                            src={snap.dataUrl} 
                            alt={snap.name}
                            className="w-full h-16 object-contain rounded bg-slate-950 mb-1.5" 
                          />
                          <p className="text-[10px] text-slate-300 font-medium truncate group-hover:text-indigo-300 transition-colors">{snap.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Render Page Canvas */}
              {pdfDoc.file && pdfDocument ? (
                <PageRenderer
                  pageNumber={pageNum}
                  pdfDocument={pdfDocument}
                  zoomScale={pageZoom}
                  effectiveZoom={pageZoom}
                />
              ) : (
                <BlankPageRenderer
                  pageNumber={pageNum}
                  pageSize={pageSize}
                  zoomScale={pageZoom}
                  effectiveZoom={pageZoom}
                />
              )}
            </div>
          );
        })}

        {/* Add page bottom action card for blank canvas mode */}
        {isBlankCanvas && (
          <div className="mx-auto max-w-sm my-6 text-center w-full px-4">
            <button
              onClick={() => addBlankPage('a4_portrait')}
              className="w-full py-3 px-4 bg-slate-900/60 hover:bg-slate-900 border border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-center gap-2 transition-all shadow-lg tap-bounce cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Another Blank Page (A4)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default PageViewer;
