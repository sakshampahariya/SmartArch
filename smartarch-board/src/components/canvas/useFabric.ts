import { useEffect, useRef } from "react"
import { Canvas } from "fabric"

const SIDEBAR_WIDTH = 320
const HEADER_HEIGHT = 64

export function useFabric(canvasId: string) {
  const fabricRef = useRef<Canvas | null>(null)

  useEffect(() => {
    const canvas = new Canvas(canvasId, {
      width: window.innerWidth - SIDEBAR_WIDTH,
      height: window.innerHeight - HEADER_HEIGHT,
      backgroundColor: "transparent",
      selection: true,
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas

    const onResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - SIDEBAR_WIDTH,
        height: window.innerHeight - HEADER_HEIGHT,
      })
      canvas.renderAll()
    }

    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [canvasId])

  return fabricRef
}
