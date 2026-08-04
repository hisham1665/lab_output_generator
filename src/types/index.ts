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

export interface PdfDocumentState {
  file: File | null;
  numPages: number;
  currentPage: number;
  zoomScale: number;
  pageSizes: Array<{ width: number; height: number }>;
}
