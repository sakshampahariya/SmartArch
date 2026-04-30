import { create } from "zustand"
import type { FabricObject } from "fabric"

type Tool = "select" | "rect" | "circle" | "text"
type CanvasObjectWithId = FabricObject & { objectId?: string }

interface CanvasStore {
  activeTool: Tool
  selectedObject: CanvasObjectWithId | null
  setActiveTool: (tool: Tool) => void
  setSelectedObject: (obj: CanvasObjectWithId | null) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: "select",
  selectedObject: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedObject: (obj) => set({ selectedObject: obj }),
}))
