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

// Set up pdf.js worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageRendererProps {
  pageNumber: number;
  pdfDocument: pdfjsLib.PDFDocumentProxy;
}

const PageRenderer: React.FC<PageRendererProps> = ({ pageNumber, pdfDocument }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomScale = useStore((state) => state.pdfDoc.zoomScale);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let renderTask: any = null;

    const renderPage = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: zoomScale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        setViewportSize({ width: viewport.width, height: viewport.height });

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
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
      className="relative shadow-2xl border border-slate-700/60 bg-white overflow-hidden rounded-b-lg"
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
        />
      )}
    </div>
  );
};

const BlankPageRenderer: React.FC<{ pageNumber: number; pageSize: { width: number; height: number } }> = ({ pageNumber, pageSize }) => {
  const zoomScale = useStore((state) => state.pdfDoc.zoomScale);
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
      />
    </div>
  );
};

export const PageViewer: React.FC = () => {
  const { 
    pdfDoc, 
    setPdfFile, 
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
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

      setPdfDocument(pdf);
      setPdfFile(file, pageSizes);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Loaded ${file.name} (${numPages} pages)`, type: 'success' } }));
    } catch (error) {
      console.error('Error loading PDF file:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to parse PDF file.', type: 'error' } }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceSnapshot = (snapshotId: string, pageNum: number) => {
    const snap = savedSnapshots.find((s) => s.id === snapshotId);
    if (!snap) return;

    const aspect = snap.width / snap.height;
    const placementWidth = 450;
    const placementHeight = placementWidth / aspect;

    addElement({
      snapshotId: snap.id,
      sourceType: 'snapshot',
      dataUrl: snap.dataUrl,
      x: 50,
      y: 50,
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
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Snapshot placed on page!', type: 'success' } }));
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
          const aspect = img.naturalWidth / img.naturalHeight;
          const placementWidth = Math.min(400, img.naturalWidth);
          const placementHeight = placementWidth / aspect;

          addElement({
            sourceType: 'upload',
            dataUrl,
            x: 50,
            y: 50,
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

          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Image placed on page ${pageNum}!`, type: 'success' } }));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addElement]);

  const handleZoom = (amount: number) => {
    setZoomScale(pdfDoc.zoomScale + amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400 font-semibold">Parsing document layout...</p>
      </div>
    );
  }

  const isBlankCanvas = !pdfDoc.file;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Viewer controls */}
      <div className="h-12 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xs flex items-center justify-between px-3 lg:px-6 select-none shrink-0 z-20 gap-2">
        <div className="flex gap-1 items-center">
          <button 
            onClick={() => handleZoom(-0.1)}
            className="p-2 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors touch-btn-sm text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-300 w-14 text-center">
            {Math.round(pdfDoc.zoomScale * 100)}%
          </span>
          <button 
            onClick={() => handleZoom(0.1)}
            className="p-2 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors touch-btn-sm text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            <strong className="text-slate-200">{pdfDoc.numPages}</strong> {pdfDoc.numPages === 1 ? 'Page' : 'Pages'}
            {isBlankCanvas ? ' (A4 Canvas)' : ' (PDF File)'}
          </span>

          {isBlankCanvas && (
            <button
              onClick={() => addBlankPage('a4_portrait')}
              className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10 tap-bounce"
            >
              <Plus className="h-3.5 w-3.5" /> Add Page
            </button>
          )}

          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] py-1.5 px-3 rounded-lg border border-slate-700 transition-all flex items-center gap-1 tap-bounce">
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{pdfDoc.file ? 'Replace PDF' : 'Import PDF'}</span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      {/* Pages Container */}
      <div className="flex-1 overflow-y-auto overflow-x-auto px-2 lg:px-4 bg-slate-950/20 pb-24">
        {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => {
          const pageSize = pdfDoc.pageSizes[pageNum - 1] || { width: 595, height: 842, preset: 'a4_portrait' };
          const currentPreset = pageSize.preset || 'a4_portrait';

          return (
            <div key={pageNum} className="relative mx-auto my-4 lg:my-8 max-w-fit flex flex-col items-center">
              {/* Page Header Bar */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-700/60 border-b-0 rounded-t-lg px-3 lg:px-4 py-2 select-none w-full gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    Page <strong className="text-slate-200">{pageNum}</strong> / {pdfDoc.numPages}
                  </span>

                  {/* Preset selector for blank canvas pages */}
                  {isBlankCanvas && (
                    <select
                      value={currentPreset}
                      onChange={(e) => updatePagePreset(pageNum, e.target.value as PagePreset)}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-indigo-300 font-medium rounded px-2 py-0.5 cursor-pointer outline-none focus:border-indigo-500"
                    >
                      {Object.entries(PAGE_PRESETS).map(([key, info]) => (
                        <option key={key} value={key} className="bg-slate-950 text-slate-200">
                          {info.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Upload Image button */}
                  <button
                    onClick={() => handleImageUpload(pageNum)}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-1.5 px-3 rounded-md transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-[0.97] tap-bounce"
                    title="Upload image"
                  >
                    <Upload className="h-3 w-3" />
                    <span className="hidden sm:inline">Upload Image</span>
                    <span className="sm:hidden">Image</span>
                  </button>

                  {/* Place Snapshot button */}
                  <button
                    onClick={() => setPickerPage(pickerPage === pageNum ? null : pageNum)}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider py-1.5 px-3 rounded-md transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 active:scale-[0.97] tap-bounce"
                  >
                    <ImagePlus className="h-3 w-3" />
                    <span className="hidden sm:inline">Place Snapshot</span>
                    <span className="sm:hidden">Snap</span>
                  </button>

                  {/* Delete page button if blank canvas and > 1 page */}
                  {isBlankCanvas && pdfDoc.numPages > 1 && (
                    <button
                      onClick={() => {
                        deletePage(pageNum);
                        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Deleted Page ${pageNum}`, type: 'info' } }));
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-800"
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
                    <button onClick={() => setPickerPage(null)} className="p-1 hover:text-red-400 text-slate-400 transition-colors touch-btn-sm">
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
                          className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-lg p-2 transition-all hover:shadow-lg hover:shadow-indigo-600/5 text-left tap-bounce"
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
                />
              ) : (
                <BlankPageRenderer
                  pageNumber={pageNum}
                  pageSize={pageSize}
                />
              )}
            </div>
          );
        })}

        {/* Add page bottom action card for blank canvas mode */}
        {isBlankCanvas && (
          <div className="mx-auto max-w-sm my-6 text-center">
            <button
              onClick={() => addBlankPage('a4_portrait')}
              className="w-full py-3 px-4 bg-slate-900/60 hover:bg-slate-900 border border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-center gap-2 transition-all shadow-lg tap-bounce"
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
