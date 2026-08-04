import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TerminalSettings, TerminalInteraction, CanvasElement, PdfDocumentState, SavedSnapshot } from '../types';

export type ActiveMode = 'terminal' | 'pdf';

interface HistoryState {
  settings: TerminalSettings;
  interactions: TerminalInteraction[];
}

export interface AppState {
  // Mode Selection
  activeMode: ActiveMode;
  setActiveMode: (mode: ActiveMode) => void;

  // Terminal Settings
  settings: TerminalSettings;
  updateSettings: (updater: Partial<TerminalSettings>) => void;

  // Terminal Interactions Sequence
  interactions: TerminalInteraction[];
  addInteraction: (command: string, output?: string) => void;
  updateInteraction: (id: string, command: string, output?: string) => void;
  deleteInteraction: (id: string) => void;
  duplicateInteraction: (id: string) => void;
  reorderInteractions: (startIndex: number, endIndex: number) => void;

  // Undo/Redo History
  history: {
    past: HistoryState[];
    future: HistoryState[];
  };
  undo: () => void;
  redo: () => void;

  // Saved Snapshots Gallery
  savedSnapshots: SavedSnapshot[];
  addSnapshot: (snapshot: Omit<SavedSnapshot, 'id' | 'createdAt'>) => void;
  deleteSnapshot: (id: string) => void;
  renameSnapshot: (id: string, name: string) => void;

  // PDF Document Editor State
  pdfDoc: PdfDocumentState;
  setPdfFile: (file: File | null, pageSizes?: Array<{ width: number; height: number }>) => void;
  setCurrentPage: (page: number) => void;
  setZoomScale: (scale: number) => void;

  // Canvas Overlay Elements State
  elements: CanvasElement[];
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  updateElement: (id: string, updater: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  clearWorkspace: () => void;
}

const initialSettings: TerminalSettings = {
  username: 'student',
  hostname: 'shr-cslab3-34',
  currentPath: '~/Desktop',
  themeId: 'ubuntu',
  fontFamily: 'Ubuntu Mono',
  fontSize: 15,
  padding: 16,
  showWindowControls: true,
  cursorStyle: 'block',
  isBlinkingCursor: true,
  customWidth: 800,
  customHeight: 450,
  isAutoHeight: true,
};

const initialInteractions: TerminalInteraction[] = [
  { id: '1', command: 'gcc main.c -o main', output: '' },
  { id: '2', command: './main', output: 'Enter number: 10\nSquare = 100' },
];

export const useStore = create<AppState>()(
  devtools((set) => {
    // Helper to push to history before mutation
    const pushHistory = (state: AppState) => {
      return {
        past: [...state.history.past, { settings: { ...state.settings }, interactions: [...state.interactions] }],
        future: [], // Clear redo stack on new action
      };
    };

    return {
      // Modes
      activeMode: 'terminal',
      setActiveMode: (mode) => set({ activeMode: mode }),

      // Terminal Settings
      settings: initialSettings,
      updateSettings: (updater) => set((state) => {
        const historyUpdate = pushHistory(state);
        return {
          settings: { ...state.settings, ...updater },
          history: historyUpdate,
        };
      }),

      // Terminal Interactions
      interactions: initialInteractions,
      addInteraction: (command, output) => set((state) => {
        const historyUpdate = pushHistory(state);
        const newInteraction: TerminalInteraction = {
          id: crypto.randomUUID(),
          command,
          output,
        };
        return {
          interactions: [...state.interactions, newInteraction],
          history: historyUpdate,
        };
      }),
      updateInteraction: (id, command, output) => set((state) => {
        const historyUpdate = pushHistory(state);
        const updated = state.interactions.map((item) =>
          item.id === id ? { ...item, command, output } : item
        );
        return {
          interactions: updated,
          history: historyUpdate,
        };
      }),
      deleteInteraction: (id) => set((state) => {
        const historyUpdate = pushHistory(state);
        return {
          interactions: state.interactions.filter((item) => item.id !== id),
          history: historyUpdate,
        };
      }),
      duplicateInteraction: (id) => set((state) => {
        const historyUpdate = pushHistory(state);
        const index = state.interactions.findIndex((item) => item.id === id);
        if (index === -1) return {};
        const source = state.interactions[index];
        const copy: TerminalInteraction = {
          id: crypto.randomUUID(),
          command: source.command,
          output: source.output,
        };
        const newList = [...state.interactions];
        newList.splice(index + 1, 0, copy);
        return {
          interactions: newList,
          history: historyUpdate,
        };
      }),
      reorderInteractions: (startIndex, endIndex) => set((state) => {
        const historyUpdate = pushHistory(state);
        const result = Array.from(state.interactions);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return {
          interactions: result,
          history: historyUpdate,
        };
      }),

      // History Undo/Redo
      history: {
        past: [],
        future: [],
      },
      undo: () => set((state) => {
        const { past, future } = state.history;
        if (past.length === 0) return {};
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        const newFuture = [
          { settings: { ...state.settings }, interactions: [...state.interactions] },
          ...future,
        ];
        return {
          settings: previous.settings,
          interactions: previous.interactions,
          history: { past: newPast, future: newFuture },
        };
      }),
      redo: () => set((state) => {
        const { past, future } = state.history;
        if (future.length === 0) return {};
        const next = future[0];
        const newFuture = future.slice(1);
        const newPast = [
          ...past,
          { settings: { ...state.settings }, interactions: [...state.interactions] },
        ];
        return {
          settings: next.settings,
          interactions: next.interactions,
          history: { past: newPast, future: newFuture },
        };
      }),

      // Saved Snapshots Gallery
      savedSnapshots: [],
      addSnapshot: (snapshot) => set((state) => ({
        savedSnapshots: [
          ...state.savedSnapshots,
          {
            ...snapshot,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
        ],
      })),
      deleteSnapshot: (id) => set((state) => ({
        savedSnapshots: state.savedSnapshots.filter((s) => s.id !== id),
      })),
      renameSnapshot: (id, name) => set((state) => ({
        savedSnapshots: state.savedSnapshots.map((s) =>
          s.id === id ? { ...s, name } : s
        ),
      })),

      // PDF State
      pdfDoc: {
        file: null,
        numPages: 0,
        currentPage: 1,
        zoomScale: 1.0,
        pageSizes: [],
      },
      setPdfFile: (file, pageSizes = []) => set((state) => ({
        pdfDoc: {
          file,
          numPages: pageSizes.length,
          currentPage: 1,
          zoomScale: 1.0,
          pageSizes,
        },
        elements: file === null ? [] : state.elements,
        selectedElementId: null,
      })),
      setCurrentPage: (page) => set((state) => {
        const clampedPage = Math.max(1, Math.min(page, state.pdfDoc.numPages));
        return {
          pdfDoc: { ...state.pdfDoc, currentPage: clampedPage }
        };
      }),
      setZoomScale: (scale) => set((state) => ({
        pdfDoc: { ...state.pdfDoc, zoomScale: Math.max(0.5, Math.min(scale, 3.0)) }
      })),

      // Canvas Overlay Elements
      elements: [],
      selectedElementId: null,
      setSelectedElementId: (id) => set({ selectedElementId: id }),
      addElement: (element) => set((state) => {
        const pageElements = state.elements.filter((el) => el.pageNumber === element.pageNumber);
        const nextZIndex = pageElements.length;
        const newElement: CanvasElement = {
          ...element,
          sourceType: element.sourceType || 'snapshot',
          id: crypto.randomUUID(),
          zIndex: nextZIndex,
        };
        return {
          elements: [...state.elements, newElement],
          selectedElementId: newElement.id,
        };
      }),
      updateElement: (id, updater) => set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, ...updater } : el
        )
      })),
      deleteElement: (id) => set((state) => {
        const deletedEl = state.elements.find((el) => el.id === id);
        if (!deletedEl) return {};

        const pageNumber = deletedEl.pageNumber;
        const remainingElements = state.elements
          .filter((el) => el.id !== id)
          .sort((a, b) => a.zIndex - b.zIndex);

        let zCounter = 0;
        const reindexed = remainingElements.map((el) => {
          if (el.pageNumber === pageNumber) {
            return { ...el, zIndex: zCounter++ };
          }
          return el;
        });

        return {
          elements: reindexed,
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        };
      }),
      duplicateElement: (id) => set((state) => {
        const source = state.elements.find((el) => el.id === id);
        if (!source) return {};
        const pageNumber = source.pageNumber;
        const pageElements = state.elements.filter((el) => el.pageNumber === pageNumber);

        const copy: CanvasElement = {
          ...source,
          id: crypto.randomUUID(),
          x: source.x + 20,
          y: source.y + 20,
          zIndex: pageElements.length,
          isLocked: false,
        };

        return {
          elements: [...state.elements, copy],
          selectedElementId: copy.id,
        };
      }),
      bringToFront: (id) => set((state) => {
        const target = state.elements.find((el) => el.id === id);
        if (!target) return {};

        const pageNumber = target.pageNumber;
        const pageElements = state.elements.filter((el) => el.pageNumber === pageNumber);
        const maxZIndex = pageElements.length - 1;

        if (target.zIndex === maxZIndex) return {};

        const updated = state.elements.map((el) => {
          if (el.pageNumber === pageNumber) {
            if (el.id === id) {
              return { ...el, zIndex: maxZIndex };
            }
            if (el.zIndex > target.zIndex) {
              return { ...el, zIndex: el.zIndex - 1 };
            }
          }
          return el;
        });

        return { elements: updated };
      }),
      sendToBack: (id) => set((state) => {
        const target = state.elements.find((el) => el.id === id);
        if (!target) return {};

        const pageNumber = target.pageNumber;
        if (target.zIndex === 0) return {};

        const updated = state.elements.map((el) => {
          if (el.pageNumber === pageNumber) {
            if (el.id === id) {
              return { ...el, zIndex: 0 };
            }
            if (el.zIndex < target.zIndex) {
              return { ...el, zIndex: el.zIndex + 1 };
            }
          }
          return el;
        });

        return { elements: updated };
      }),
      clearWorkspace: () => set({
        elements: [],
        selectedElementId: null,
      }),
    };
  })
);
