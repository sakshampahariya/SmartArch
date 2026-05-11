import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Circle,
  Group,
  Line,
  Path,
  PencilBrush,
  Rect,
  Triangle,
  util,
  FabricText,
  Ellipse,
  type FabricObject,
  type Point,
  type TPointerEventInfo,
} from "fabric";
import { useFabric } from "./useFabric";
import CanvasControls from "./CanvasControls.tsx";
import { useCanvasStore } from "../../stores/canvasStore";
import { useSocket } from "../../hooks/useSocket";
import { useRoomStore } from "../../stores/roomStore";
import { recognizeShape } from "./ShapeRecognizer";
import type { CanvasElement } from "../../services/api";

export interface CanvasBoardHandle {
  drawAIElements: (elements: CanvasElement[]) => void;
}

type CanvasObjectWithId = FabricObject & { objectId?: string };
type CursorPayload = {
  userId?: string;
  x?: number;
  y?: number;
  color?: string;
};
type ObjectUpdatedPayload = { objectId?: string } & Record<string, unknown>;

export const CanvasBoard = forwardRef<CanvasBoardHandle>(function CanvasBoard(_props, ref) {
  const fabricRef = useFabric("main-canvas");
  const setSelectedObject = useCanvasStore((state) => state.setSelectedObject);
  const setCanvasJSON = useCanvasStore((state) => state.setCanvasJSON);
  const canvasJSON = useCanvasStore((state) => state.canvasJSON);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const activeColor = useCanvasStore((state) => state.activeColor);
  const pushHistory = useCanvasStore((state) => state.pushHistory);
  const roomId = useRoomStore((s) => s.roomId);
  const myUserId = useRoomStore((s) => s.myUserId);
  const myName = useRoomStore((s) => s.myName);
  const myRole = useRoomStore((s) => s.myRole);
  const upsertUser = useRoomStore((s) => s.upsertUser);
  const removeUser = useRoomStore((s) => s.removeUser);
  const updateCursor = useRoomStore((s) => s.updateCursor);
  const setMyRole = useRoomStore((s) => s.setMyRole);
  const setMyColor = useRoomStore((s) => s.setMyColor);
  const setDrawPermission = useRoomStore((s) => s.setDrawPermission);
  const setConnected = useRoomStore((s) => s.setConnected);
  const { emit, on, socket } = useSocket();
  const suppressSync = useRef(false);

  // Track previous tool to properly toggle drawing mode
  const prevToolRef = useRef<string>("select");
  // Panning state
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSpaceDownRef = useRef(false);

  // ── Pencil / drawing-mode effect ───────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const isPencil = activeTool === "pencil";

    if (isPencil) {
      // Fabric v7: must explicitly create and assign PencilBrush
      const brush = new PencilBrush(canvas);
      brush.width = 2;
      brush.color = activeColor;
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    } else {
      canvas.isDrawingMode = false;
    }

    prevToolRef.current = activeTool;
  }, [activeTool, activeColor, fabricRef]);

  // ── path:created → shape recognition ──────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const onPathCreated = (e: Record<string, unknown>) => {
      const path = e.path as Path & {
        path?: [string, ...number[]][];
      };
      if (!path) return;

      // Extract ENDPOINTS from each path command (not control points!)
      // Fabric.js v7 PencilBrush creates: M, Q (quadratic bezier), L commands
      //   M x y        → endpoint at [1],[2]
      //   L x y        → endpoint at [1],[2]
      //   Q cx cy x y  → endpoint at [3],[4]  (NOT [1],[2] which is control pt)
      //   C c1x c1y c2x c2y x y → endpoint at [5],[6]
      const rawPoints: { x: number; y: number }[] = [];
      for (const cmd of path.path ?? []) {
        const type = cmd[0];
        if (type === "M" || type === "L") {
          rawPoints.push({ x: Number(cmd[1]), y: Number(cmd[2]) });
        } else if (type === "Q") {
          rawPoints.push({ x: Number(cmd[3]), y: Number(cmd[4]) });
        } else if (type === "C") {
          rawPoints.push({ x: Number(cmd[5]), y: Number(cmd[6]) });
        }
      }

      canvas.remove(path);

      const result = recognizeShape(rawPoints);
      let shape: FabricObject | null = null;

      switch (result.type) {
        case "circle":
          shape = new Circle({
            left: result.cx - result.radius,
            top: result.cy - result.radius,
            radius: result.radius,
            fill: "transparent",
            stroke: activeColor,
            strokeWidth: 2,
          });
          break;

        case "arc": {
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const x1 = result.cx + result.radius * Math.cos(toRad(result.startAngle));
          const y1 = result.cy + result.radius * Math.sin(toRad(result.startAngle));
          const x2 = result.cx + result.radius * Math.cos(toRad(result.endAngle));
          const y2 = result.cy + result.radius * Math.sin(toRad(result.endAngle));
          const largeArc = result.largeArc ? 1 : 0;
          const sweep = result.clockwise ? 1 : 0;
          const d = `M ${x1} ${y1} A ${result.radius} ${result.radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
          shape = new Path(d, {
            fill: "transparent",
            stroke: activeColor,
            strokeWidth: 2,
            strokeLineCap: "round",
          });
          break;
        }

        case "rect":
          shape = new Rect({
            left: result.left,
            top: result.top,
            width: result.width,
            height: result.height,
            fill: "transparent",
            stroke: activeColor,
            strokeWidth: 2,
            rx: 6,
            ry: 6,
          });
          break;

        case "arrow": {
          const lineShape = new Line(
            [result.x1, result.y1, result.x2, result.y2],
            { stroke: activeColor, strokeWidth: 2 },
          );
          const angle =
            (Math.atan2(result.y2 - result.y1, result.x2 - result.x1) * 180) /
            Math.PI;
          const arrowHead = new Triangle({
            left: result.x2 - 8,
            top: result.y2 - 8,
            width: 12,
            height: 12,
            fill: activeColor,
            angle: angle + 90,
          });
          (lineShape as FabricObject & { objectId: string }).objectId =
            crypto.randomUUID();
          (arrowHead as FabricObject & { objectId: string }).objectId =
            crypto.randomUUID();
          canvas.add(lineShape, arrowHead);
          canvas.renderAll();
          return;
        }

        case "line":
          shape = new Line([result.x1, result.y1, result.x2, result.y2], {
            stroke: activeColor,
            strokeWidth: 2,
          });
          break;

        default:
          // Unknown — keep the original freehand path
          canvas.add(path);
          canvas.renderAll();
          return;
      }

      if (shape) {
        (shape as FabricObject & { objectId: string }).objectId =
          crypto.randomUUID();

        // Snap animation: briefly scale up then back to 1
        shape.set({ scaleX: 1.05, scaleY: 1.05 });
        canvas.add(shape);
        canvas.renderAll();
        setTimeout(() => {
          shape!.set({ scaleX: 1, scaleY: 1 });
          canvas.renderAll();
        }, 150);
      }
    };

    canvas.on("path:created", onPathCreated as (e: object) => void);
    return () => {
      canvas.off("path:created", onPathCreated as (e: object) => void);
    };
  }, [fabricRef, activeColor]);

  // ── Main canvas events (selection, socket sync, cursors) ───────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const onObjectModified = () => {
      const activeObject =
        canvas.getActiveObject() as CanvasObjectWithId | null;
      if (activeObject) {
        emit(
          "object:updated",
          activeObject.toObject(["objectId", "smartMeta"]) as Record<
            string,
            unknown
          >,
        );
      }
      const json = JSON.stringify(canvas.toObject(["objectId", "smartMeta"]));
      setCanvasJSON(json);
      pushHistory(json);
      emit("canvas:saved", { canvasJSON: json });
    };

    const handleSelection = () => {
      setSelectedObject(
        (canvas.getActiveObject() as CanvasObjectWithId) ?? null,
      );
    };

    const clearSelection = () => {
      setSelectedObject(null);
    };

    let isErasing = false;

    const onMouseDown = (event: TPointerEventInfo) => {
      if (useCanvasStore.getState().activeTool === "eraser") {
        isErasing = true;
        eraseObjectUnderCursor(event);
      }
    };

    const onMouseUp = () => {
      isErasing = false;
    };

    const onDoubleClick = (e: TPointerEventInfo) => {
      const target = e.target;
      if (target && (target.type === "textbox" || target.type === "itext")) {
        canvas.setActiveObject(target);
        (target as any).enterEditing();
        canvas.renderAll();
      }
    };

    const eraseObjectUnderCursor = (event: TPointerEventInfo) => {
      if (!event.target) return;
      canvas.remove(event.target);
      canvas.renderAll();
    };

    const onMouseMove = (event: TPointerEventInfo) => {
      // Handle eraser drag
      if (isErasing && useCanvasStore.getState().activeTool === "eraser") {
        eraseObjectUnderCursor(event);
      }

      if (!roomId) return;
      const pointer = (event as TPointerEventInfo & { scenePoint?: Point }).scenePoint;
      if (!pointer) return;
      emit("cursor_moved", {
        roomId,
        userId: myUserId,
        x: pointer.x,
        y: pointer.y,
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Space → enable pan mode
      if (e.code === "Space" && !e.repeat) {
        isSpaceDownRef.current = true;
        canvas.defaultCursor = "grab";
        canvas.selection = false;
        e.preventDefault();
        return;
      }

      // Ctrl+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const json = useCanvasStore.getState().undo();
        if (json) {
          void canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.renderAll());
        }
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z → Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        const json = useCanvasStore.getState().redo();
        if (json) {
          void canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.renderAll());
        }
        return;
      }

      // Delete / Backspace → remove selected objects
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj.type === "textbox" || activeObj.type === "itext") && (activeObj as any).isEditing) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
          canvas.remove(...activeObjects);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpaceDownRef.current = false;
        isPanningRef.current = false;
        panStartRef.current = null;
        canvas.defaultCursor = "default";
        canvas.selection = true;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Canvas Panning via Fabric.js mouse events ──
    // (Native mousedown on canvas.getElement() is blocked by upper-canvas)
    const onFabricMouseDown = (opt: TPointerEventInfo) => {
      const evt = opt.e as MouseEvent;
      if (isSpaceDownRef.current || evt.button === 1) {
        isPanningRef.current = true;
        panStartRef.current = { x: evt.clientX, y: evt.clientY };
        canvas.setCursor("grabbing");
        canvas.selection = false;
      }
    };
    const onFabricMouseMove = (opt: TPointerEventInfo) => {
      if (!isPanningRef.current || !panStartRef.current) return;
      const evt = opt.e as MouseEvent;
      const dx = evt.clientX - panStartRef.current.x;
      const dy = evt.clientY - panStartRef.current.y;
      panStartRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.relativePan({ x: dx, y: dy });
    };
    const onFabricMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        canvas.setCursor(isSpaceDownRef.current ? "grab" : "default");
        if (!isSpaceDownRef.current) canvas.selection = true;
      }
    };

    // ── Scroll wheel: pan + zoom via wrapper element ──
    const wrapperEl = canvas.getElement().parentElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom toward cursor
        const delta = e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(Math.max(zoom, 0.1), 10);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        canvas.zoomToPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top }, zoom);
      } else {
        // Pan
        canvas.relativePan({ x: -e.deltaX, y: -e.deltaY });
      }
    };
    if (wrapperEl) wrapperEl.addEventListener("wheel", onWheel, { passive: false });

    canvas.on("mouse:down", onFabricMouseDown);
    canvas.on("mouse:move", onFabricMouseMove);
    canvas.on("mouse:up", onFabricMouseUp);

    canvas.on("mouse:dblclick", onDoubleClick);
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:up", onMouseUp);
    canvas.on("mouse:move", onMouseMove);

    const cleanupObjectUpdated = on(
      "object:updated",
      (payload: Record<string, unknown>) => {
        if (suppressSync.current) return;
        const objectData = payload as ObjectUpdatedPayload;
        if (!objectData.objectId) return;
        void util.enlivenObjects<FabricObject>([objectData]).then((objects) => {
          const existing = canvas.getObjects().find(
            (object) => (object as CanvasObjectWithId).objectId === objectData.objectId,
          );
          if (existing) canvas.remove(existing);
          objects.forEach((object) => canvas.add(object));
          canvas.renderAll();
        });
      },
    );

    const cleanupCanvasState = on(
      "room:state",
      (payload: Record<string, unknown>) => {
        // Load canvas from server state
        const canvasJsonStr = payload.canvasJSON as string | undefined;
        if (canvasJsonStr && canvasJsonStr !== "{}") {
          try {
            void canvas.loadFromJSON(JSON.parse(canvasJsonStr)).then(() => canvas.renderAll());
          } catch { /* ignore */ }
        }
        // Hydrate users list
        const users = payload.users as any[];
        if (Array.isArray(users)) users.forEach((u) => upsertUser(u));
        // Set draw permission
        const dp = payload.drawPermission as string;
        if (dp) setDrawPermission(dp as "everyone" | "owner-only");
        // Update my role + color
        const myRoleFromServer = payload.myRole as string;
        if (myRoleFromServer) setMyRole(myRoleFromServer as any);
        const myColorFromServer = payload.myColor as string;
        if (myColorFromServer) setMyColor(myColorFromServer);
        setConnected(true);
      },
    );

    // Legacy canvas:state (reconnect)
    const cleanupLegacyState = on(
      "canvas:state",
      (payload: Record<string, unknown>) => {
        const canvasJsonStr = payload.canvasJSON as string | undefined;
        if (!canvasJsonStr || canvasJsonStr === "{}") return;
        try {
          void canvas.loadFromJSON(JSON.parse(canvasJsonStr)).then(() => canvas.renderAll());
        } catch { /* ignore */ }
      },
    );

    const cleanupCursorMoved = on(
      "cursor:moved",
      (payload: Record<string, unknown>) => {
        const { userId, x, y } = payload as { userId?: string; x?: number; y?: number };
        if (!userId || typeof x !== "number" || typeof y !== "number") return;
        if (userId === myUserId) return;
        updateCursor(userId, x, y);
      },
    );

    const cleanupPermChanged = on(
      "permission:changed",
      (payload: Record<string, unknown>) => {
        const dp = payload.drawPermission as string;
        if (!dp) return;
        setDrawPermission(dp as "everyone" | "owner-only");
        // Lock/unlock canvas for this user
        const canDraw = myRole === "owner" || (dp === "everyone" && myRole === "collaborator");
        canvas.selection = canDraw;
        canvas.getObjects().forEach((obj) => {
          (obj as any).selectable = canDraw;
          (obj as any).evented = canDraw;
        });
        canvas.renderAll();
      },
    );

    const cleanupRoleChanged = on(
      "role:changed",
      (payload: Record<string, unknown>) => {
        const { userId, newRole } = payload as { userId?: string; newRole?: string };
        if (!userId || !newRole) return;
        upsertUser({ userId, role: newRole as any });
        if (userId === myUserId) setMyRole(newRole as any);
      },
    );
    const cleanupUserJoined = on(
      "user:joined",
      (payload: Record<string, unknown>) => {
        upsertUser(payload as any);
      },
    );

    const cleanupUserLeft = on(
      "user:left",
      (payload: Record<string, unknown>) => {
        const userId = (payload.userId ?? payload.socketId) as string | undefined;
        if (userId) removeUser(userId);
      },
    );

    if (roomId) {
      emit("room_join", {
        roomId,
        userId: myUserId,
        name: myName,
        role: myRole,
      });
    }

    canvas.on("object:modified", onObjectModified);
    canvas.on("object:added", onObjectModified);
    canvas.on("object:removed", onObjectModified);
    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", clearSelection);

    // Initial history push
    const initialJson = JSON.stringify(canvas.toObject(["objectId", "smartMeta"]));
    setCanvasJSON(initialJson);
    pushHistory(initialJson);

    return () => {
      canvas.off("object:modified", onObjectModified);
      canvas.off("object:added", onObjectModified);
      canvas.off("object:removed", onObjectModified);
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", clearSelection);
      canvas.off("mouse:dblclick", onDoubleClick);
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:up", onMouseUp);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:dblclick", handleSelection);
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:up", onMouseUp);
      canvas.off("mouse:move", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.off("mouse:down", onFabricMouseDown);
      canvas.off("mouse:move", onFabricMouseMove);
      canvas.off("mouse:up", onFabricMouseUp);
      if (wrapperEl) wrapperEl.removeEventListener("wheel", onWheel);
      cleanupObjectUpdated();
      cleanupCanvasState();
      cleanupLegacyState();
      cleanupCursorMoved();
      cleanupPermChanged();
      cleanupRoleChanged();
      cleanupUserJoined();
      cleanupUserLeft();
    };
  }, [
    emit,
    fabricRef,
    myName,
    myRole,
    myUserId,
    on,
    removeUser,
    roomId,
    setCanvasJSON,
    setConnected,
    setDrawPermission,
    setMyColor,
    setMyRole,
    setSelectedObject,
    socket.id,
    updateCursor,
    upsertUser,
  ]);

  const isDarkMode = useCanvasStore((state) => state.isDarkMode);
  const isPencil = activeTool === "pencil" || activeTool === "eraser";

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.defaultCursor = isPencil ? "crosshair" : "default";
      fabricRef.current.renderAll();
    }
  }, [isPencil, fabricRef]);

  // Unused – suppress lint warning
  void canvasJSON;

  // Expose drawAIElements to parent via ref
  useImperativeHandle(ref, () => ({
    drawAIElements(elements: CanvasElement[]) {
      const canvas = fabricRef.current;
      if (!canvas) return;

      let startX = 250;
      let startY = 80;

      // Place elements at the center of the current viewport
      const vpt = canvas.viewportTransform;
      const zoom = canvas.getZoom();
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      if (vpt) {
        startX = (-vpt[4] + canvasWidth / 2) / zoom - 100;
        startY = (-vpt[5] + canvasHeight / 2) / zoom - 150;
      }

      const addLabel = (obj: FabricObject, label: string, color = "#1a1a1a", fontSize = 14) => {
        const text = new FabricText(label, {
          fontSize,
          fill: color,
          fontFamily: "Inter, sans-serif",
          originX: "center",
          originY: "center",
          left: (obj as any).left + ((obj as any).width ?? 0) / 2,
          top: (obj as any).top + ((obj as any).height ?? 0) / 2,
          selectable: true,
          evented: false,
        });
        canvas.add(text);
      };

      for (const el of elements) {
        const x = (el.left ?? startX);
        const y = (el.top ?? startY);

        if (el.kind === "rect") {
          const rect = new Rect({
            left: x, top: y,
            width: el.width ?? 160, height: el.height ?? 50,
            fill: el.fill ?? "#e3f2fd",
            stroke: el.stroke ?? "#1565C0",
            strokeWidth: el.strokeWidth ?? 2,
            rx: el.rx ?? 8, ry: el.rx ?? 8,
            selectable: true,
          });
          canvas.add(rect);
          if (el.label) addLabel(rect, el.label, el.labelColor, el.fontSize);
          startY += (el.height ?? 50) + 60;
        }
        else if (el.kind === "ellipse") {
          const cx = el.cx ?? x;
          const cy = el.cy ?? y;
          const rx = el.ry ?? 30;
          const ry = el.ry ?? 30;
          const ell = new Ellipse({
            left: cx - (el.ry ?? 90), top: cy - rx,
            rx: el.ry ?? 90, ry: rx,
            fill: el.fill ?? "#e8f5e9",
            stroke: el.stroke ?? "#2e7d32",
            strokeWidth: el.strokeWidth ?? 2,
            selectable: true,
          });
          canvas.add(ell);
          if (el.label) addLabel(ell, el.label, el.labelColor, el.fontSize);
          startY += ry * 2 + 60;
        }
        else if (el.kind === "diamond") {
          const w = el.width ?? 160;
          const h = el.height ?? 80;
          const path = new Path(
            `M ${x + w / 2} ${y} L ${x + w} ${y + h / 2} L ${x + w / 2} ${y + h} L ${x} ${y + h / 2} Z`,
            { fill: el.fill ?? "#fff8e1", stroke: el.stroke ?? "#f57f17", strokeWidth: el.strokeWidth ?? 2, selectable: true }
          );
          canvas.add(path);
          if (el.label) {
            const t = new FabricText(el.label, {
              left: x + w / 2, top: y + h / 2,
              fontSize: el.fontSize ?? 13,
              fill: el.labelColor ?? "#1a1a1a",
              fontFamily: "Inter, sans-serif",
              originX: "center", originY: "center",
            });
            canvas.add(t);
          }
          startY += h + 60;
        }
        else if (el.kind === "arrow") {
          const arrow = new Line([el.x1 ?? 0, el.y1 ?? 0, el.x2 ?? 0, el.y2 ?? 100], {
            stroke: el.stroke ?? "#555",
            strokeWidth: el.strokeWidth ?? 2,
            selectable: false,
            evented: false,
          });
          canvas.add(arrow);
        }
        else if (el.kind === "text") {
          const t = new FabricText(el.text ?? "", {
            left: el.left ?? startX,
            top: el.top ?? startY,
            fontSize: el.fontSize ?? 16,
            fill: el.color ?? "#1a1a1a",
            fontFamily: "Inter, sans-serif",
            selectable: true,
          });
          canvas.add(t);
          startY += 40;
        }
      }

      canvas.renderAll();
    },
  }), [fabricRef]);

  const bgStyle = {
    backgroundColor: isDarkMode ? "#0a0a10" : "#F3F4ED",
    backgroundImage: isDarkMode
      ? "radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)"
      : "radial-gradient(circle, rgba(26,26,26,0.14) 1.5px, transparent 1.5px)",
    backgroundSize: "20px 20px",
  };

  return (
    <section className="relative h-screen w-full overflow-hidden" style={bgStyle}>
      <CanvasControls fabricRef={fabricRef} />
      <canvas id="main-canvas" />
    </section>
  );
});
