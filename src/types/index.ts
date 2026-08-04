export type CursorStyle = 'block' | 'underline' | 'beam';

export interface TerminalSettings {
  username: string;
  hostname: string;
  currentPath: string;
  themeId: string;
  fontFamily: string;
  fontSize: number;
  padding: number;
  showWindowControls: boolean;
  cursorStyle: CursorStyle;
  isBlinkingCursor: boolean;
  customWidth: number;
  customHeight: number;
  isAutoHeight: boolean;
}

export interface TerminalInteraction {
  id: string;
  command: string;
  output?: string;
}

/** A saved terminal screenshot that lives in the gallery */
export interface SavedSnapshot {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface CanvasElement {
  id: string;
  /** ID of the source snapshot (empty for user-uploaded images) */
  snapshotId?: string;
  /** Whether this element came from a terminal snapshot or a user upload */
  sourceType: 'snapshot' | 'upload';
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  shadowBlur: number;
  shadowColor: string;
  borderRadius: number;
  /** Crop in source-image pixel coordinates. Konva will clip to this region. */
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  isLocked: boolean;
  zIndex: number;
  pageNumber: number;
}

export type PagePreset = 'a4_portrait' | 'a4_landscape' | 'letter' | 'square';

export interface CanvasPageSize {
  width: number;
  height: number;
  preset?: PagePreset;
}

export const PAGE_PRESETS: Record<PagePreset, { name: string; width: number; height: number }> = {
  a4_portrait: { name: 'A4 Portrait (595 × 842)', width: 595, height: 842 },
  a4_landscape: { name: 'A4 Landscape (842 × 595)', width: 842, height: 595 },
  letter: { name: 'Letter (612 × 792)', width: 612, height: 792 },
  square: { name: 'Square (600 × 600)', width: 600, height: 600 },
};

export interface PdfDocumentState {
  file: File | null;
  numPages: number;
  currentPage: number;
  zoomScale: number;
  pageSizes: CanvasPageSize[];
}
