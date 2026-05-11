import { create } from "zustand";
import type { FabricObject } from "fabric";
import type { ObjectMeta } from "../types";

type Tool = "select" | "rect" | "circle" | "arrow" | "text" | "pencil" | "eraser" | "sticky";
type CanvasObjectWithId = FabricObject & { objectId?: string };

interface CanvasStore {
  activeTool: Tool;
  selectedObject: CanvasObjectWithId | null;
  canvasJSON: string;
  objectMeta: Record<string, ObjectMeta>;
  activeColor: string;
  isDarkMode: boolean;
  history: string[];
  historyIndex: number;
  setActiveTool: (tool: Tool) => void;
  setSelectedObject: (obj: CanvasObjectWithId | null) => void;
  setCanvasJSON: (canvasJSON: string) => void;
  setMeta: (id: string, meta: Partial<ObjectMeta>) => void;
  setActiveColor: (color: string) => void;
  toggleTheme: () => void;
  pushHistory: (json: string) => void;
  undo: () => string | null;
  redo: () => string | null;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: "select",
  selectedObject: null,
  canvasJSON: "{}",
  objectMeta: {},
  activeColor: "#00BD7D",
  isDarkMode: true,
  history: ["{}"],
  historyIndex: 0,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedObject: (obj) => set({ selectedObject: obj }),
  setCanvasJSON: (canvasJSON) => set({ canvasJSON }),
  setMeta: (id, meta) =>
    set((state) => ({
      objectMeta: {
        ...state.objectMeta,
        [id]: {
          ...state.objectMeta[id],
          ...meta,
        } as ObjectMeta,
      },
    })),
  setActiveColor: (color) => set({ activeColor: color }),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  pushHistory: (json) => set((state) => {
    // Prevent duplicate pushes
    if (state.history[state.historyIndex] === json) return state;
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(json);
    // Keep max 50 states to prevent memory leaks
    if (newHistory.length > 50) newHistory.shift();
    return { history: newHistory, historyIndex: newHistory.length - 1, canvasJSON: json };
  }),
  undo: () => {
    let prev: string | null = null;
    set((state) => {
      if (state.historyIndex > 0) {
        const newIdx = state.historyIndex - 1;
        prev = state.history[newIdx];
        return { historyIndex: newIdx, canvasJSON: prev };
      }
      return state;
    });
    return prev;
  },
  redo: () => {
    let next: string | null = null;
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIdx = state.historyIndex + 1;
        next = state.history[newIdx];
        return { historyIndex: newIdx, canvasJSON: next };
      }
      return state;
    });
    return next;
  },
}));
