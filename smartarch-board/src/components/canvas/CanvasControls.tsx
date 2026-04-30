import type { MutableRefObject } from "react"
import { Circle, IText, Rect, type Canvas } from "fabric"

interface CanvasControlsProps {
  fabricRef: MutableRefObject<Canvas | null>
}

const generateObjectId = () => crypto.randomUUID()

export default function CanvasControls({ fabricRef }: CanvasControlsProps) {
  function addRect() {
    const canvas = fabricRef.current
    if (!canvas) return

    const rect = new Rect({
      left: 120,
      top: 120,
      width: 160,
      height: 80,
      fill: "#E6F9F2",
      stroke: "#00BD7D",
      strokeWidth: 2,
      rx: 8,
      ry: 8,
    })

    ;(rect as Rect & { objectId: string }).objectId = generateObjectId()
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  function addCircle() {
    const canvas = fabricRef.current
    if (!canvas) return

    const circle = new Circle({
      left: 220,
      top: 180,
      radius: 50,
      fill: "#EFF6FF",
      stroke: "#3B82F6",
      strokeWidth: 2,
    })

    ;(circle as Circle & { objectId: string }).objectId = generateObjectId()
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  function addText() {
    const canvas = fabricRef.current
    if (!canvas) return

    const text = new IText("Service Name", {
      left: 180,
      top: 140,
      fontFamily: "Poppins",
      fontSize: 14,
      fill: "#111827",
    })

    ;(text as IText & { objectId: string }).objectId = generateObjectId()
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  return (
    <div className="fixed left-4 top-4 z-20 flex gap-2 rounded-xl bg-surface p-2 shadow-perspective">
      <button
        onClick={addRect}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Add Rect
      </button>
      <button
        onClick={addCircle}
        className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
      >
        Add Circle
      </button>
      <button
        onClick={addText}
        className="rounded-lg border border-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
      >
        Add Text
      </button>
    </div>
  )
}
