import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useStore } from '../../../store/globalStore';
import { CanvasOverlay } from './CanvasOverlay';
import { FileText, ZoomIn, ZoomOut, Loader2, ImagePlus, X } from 'lucide-react';

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

export const PageViewer: React.FC = () => {
  const { pdfDoc, setPdfFile, setZoomScale, savedSnapshots, addElement } = useStore();
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerPage, setPickerPage] = useState<number | null>(null); // which page is showing the snapshot picker

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
    } catch (error) {
      console.error('Error loading PDF file:', error);
      alert('Failed to parse PDF document. Ensure the file is not corrupted.');
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
  };

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

  if (!pdfDoc.file || !pdfDocument) {
    return (
      <div className="flex flex-col items-center max-w-lg p-12 glass-panel rounded-2xl border border-slate-800 text-center">
        <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Interactive Lab PDF Workspace</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Upload a laboratory report PDF to activate canvas page rendering.
        </p>
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-5 rounded-lg shadow-lg shadow-indigo-600/10 transition-all mt-6 inline-block">
          Upload Lab PDF
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Viewer controls */}
      <div className="h-12 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center gap-4 px-6 select-none shrink-0 z-20">
        <div className="flex gap-1 items-center">
          <button 
            onClick={() => handleZoom(-0.1)}
            className="p-1.5 hover:text-indigo-400 rounded hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-300 w-14 text-center">
            {Math.round(pdfDoc.zoomScale * 100)}%
          </span>
          <button 
            onClick={() => handleZoom(0.1)}
            className="p-1.5 hover:text-indigo-400 rounded hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-slate-500 font-medium">|</span>
        <span className="text-xs text-slate-400">
          <strong className="text-slate-300">{pdfDoc.numPages}</strong> pages • <strong className="text-slate-300">{savedSnapshots.length}</strong> snapshots saved
        </span>
      </div>

      {/* Pages Container */}
      <div className="flex-1 overflow-y-auto px-4 bg-slate-950/20">
        {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
          <div key={pageNum} className="relative mx-auto my-8 max-w-fit flex flex-col items-center">
            {/* Page Header Bar */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-700/60 border-b-0 rounded-t-lg px-4 py-2 select-none w-full">
              <span className="text-xs font-semibold text-slate-400">
                Page <strong className="text-slate-200">{pageNum}</strong> / {pdfDoc.numPages}
              </span>
              <button
                onClick={() => setPickerPage(pickerPage === pageNum ? null : pageNum)}
                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white font-bold uppercase tracking-wider py-1.5 px-3.5 rounded-md transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 active:scale-[0.98]"
              >
                <ImagePlus className="h-3 w-3" />
                Place Snapshot
              </button>
            </div>

            {/* Snapshot Picker Dropdown */}
            {pickerPage === pageNum && (
              <div className="w-full bg-slate-900 border-x border-slate-700/60 px-4 py-3 z-30 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Choose a Snapshot</span>
                  <button onClick={() => setPickerPage(null)} className="p-0.5 hover:text-red-400 text-slate-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
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
                        className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-lg p-2 transition-all hover:shadow-lg hover:shadow-indigo-600/5 text-left"
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

            {/* Render Page */}
            <PageRenderer
              pageNumber={pageNum}
              pdfDocument={pdfDocument}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
export default PageViewer;
