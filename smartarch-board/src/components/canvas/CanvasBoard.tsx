import { useEffect } from "react"
import type { FabricObject } from "fabric"
import { useFabric } from "./useFabric"
import CanvasControls from "./CanvasControls.tsx"
import { useCanvasStore } from "../../stores/canvasStore"

type CanvasObjectWithId = FabricObject & { objectId?: string }

export function CanvasBoard() {
  const fabricRef = useFabric("main-canvas")
  const setSelectedObject = useCanvasStore((state) => state.setSelectedObject)

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handleSelection = () => {
      setSelectedObject((canvas.getActiveObject() as CanvasObjectWithId) ?? null)
    }

    const clearSelection = () => {
      setSelectedObject(null)
    }

    canvas.on("selection:created", handleSelection)
    canvas.on("selection:updated", handleSelection)
    canvas.on("selection:cleared", clearSelection)
    canvas.on("mouse:dblclick", handleSelection)

    return () => {
      canvas.off("selection:created", handleSelection)
      canvas.off("selection:updated", handleSelection)
      canvas.off("selection:cleared", clearSelection)
      canvas.off("mouse:dblclick", handleSelection)
    }
  }, [fabricRef, setSelectedObject])

  return (
    <section className="relative h-screen w-full overflow-hidden canvas-dot-grid">
      <CanvasControls fabricRef={fabricRef} />
      <canvas id="main-canvas" />
    </section>
  )
}
