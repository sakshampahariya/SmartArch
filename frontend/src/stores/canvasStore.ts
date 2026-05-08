import { create } from "zustand";
import type { FabricObject } from "fabric";
import type { ObjectMeta } from "../types";

type Tool = "select" | "rect" | "circle" | "arrow" | "text";
type CanvasObjectWithId = FabricObject & { objectId?: string };

interface CanvasStore {
  activeTool: Tool;
  selectedObject: CanvasObjectWithId | null;
  canvasJSON: string;
  objectMeta: Record<string, ObjectMeta>;
  setActiveTool: (tool: Tool) => void;
  setSelectedObject: (obj: CanvasObjectWithId | null) => void;
  setCanvasJSON: (canvasJSON: string) => void;
  setMeta: (id: string, meta: Partial<ObjectMeta>) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: "select",
  selectedObject: null,
  canvasJSON: "{}",
  objectMeta: {},
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
}));
