import { CanvasBoard } from "./components/canvas/CanvasBoard"
import { useCanvasStore } from "./stores/canvasStore"

function App() {
  const selectedObject = useCanvasStore((state) => state.selectedObject)
  const selectedId = selectedObject
    ? (selectedObject as { objectId?: string }).objectId ?? "Selected"
    : "None"

  return (
    <main className="relative min-h-screen">
      <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-100 bg-surface px-4 shadow-perspective">
        <h1 className="font-display text-xl text-neutral-900">SmartArch Board</h1>
        <span className="text-sm text-neutral-700">Selected: {selectedId}</span>
      </header>
      <div className="pt-16">
        <CanvasBoard />
      </div>
    </main>
  )
}

export default App
