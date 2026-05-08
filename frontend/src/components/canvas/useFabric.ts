import { useEffect, useRef } from "react";
import { Canvas } from "fabric";

const SIDEBAR_WIDTH = 320; // AI panel width
const HEADER_HEIGHT = 52; // Board header height

export function useFabric(canvasId: string) {
  const fabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    const canvas = new Canvas(canvasId, {
      width: window.innerWidth,
      height: window.innerHeight - HEADER_HEIGHT,
      backgroundColor: "transparent",
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    const onResize = () => {
      // If AI panel is open the canvas will be narrower; we just use full-width
      // and let the parent flex container clip it
      const aiPanel = document.querySelector("[data-ai-panel]");
      const sidebarOffset = aiPanel ? SIDEBAR_WIDTH : 0;
      canvas.setDimensions({
        width: window.innerWidth - sidebarOffset,
        height: window.innerHeight - HEADER_HEIGHT,
      });
      canvas.renderAll();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [canvasId]);

  return fabricRef;
}
