import { useEffect } from "react";
import {
  util,
  type FabricObject,
  type Point,
  type TPointerEventInfo,
} from "fabric";
import { useFabric } from "./useFabric";
import CanvasControls from "./CanvasControls.tsx";
import { useCanvasStore } from "../../stores/canvasStore";
import { useSocket } from "../../hooks/useSocket";
import { useRoomStore } from "../../stores/roomStore";

type CanvasObjectWithId = FabricObject & { objectId?: string };
type CursorPayload = {
  userId?: string;
  x?: number;
  y?: number;
  color?: string;
};
type ObjectUpdatedPayload = { objectId?: string } & Record<string, unknown>;

export function CanvasBoard() {
  const fabricRef = useFabric("main-canvas");
  const setSelectedObject = useCanvasStore((state) => state.setSelectedObject);
  const setCanvasJSON = useCanvasStore((state) => state.setCanvasJSON);
  const canvasJSON = useCanvasStore((state) => state.canvasJSON);
  const roomId = useRoomStore((state) => state.roomId);
  const upsertUser = useRoomStore((state) => state.upsertUser);
  const removeUser = useRoomStore((state) => state.removeUser);
  const { emit, on, socket } = useSocket();

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
      // Persist canvas state via socket
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

    const onMouseMove = (event: TPointerEventInfo) => {
      if (!roomId) return;
      const pointer = (event as TPointerEventInfo & { scenePoint?: Point })
        .scenePoint;
      if (!pointer) return;
      emit("cursor:moved", {
        x: pointer.x,
        y: pointer.y,
        userId: socket.id,
      });
    };

    const cleanupObjectUpdated = on(
      "object:updated",
      (payload: Record<string, unknown>) => {
        const objectData = payload as ObjectUpdatedPayload;
        if (!objectData.objectId) return;

        void util.enlivenObjects<FabricObject>([objectData]).then((objects) => {
          const existing = canvas
            .getObjects()
            .find(
              (object) =>
                (object as CanvasObjectWithId).objectId === objectData.objectId,
            );

          if (existing) canvas.remove(existing);
          objects.forEach((object) => canvas.add(object));
          canvas.renderAll();
        });
      },
    );

    // Restore canvas state when joining a room
    const cleanupCanvasState = on(
      "canvas:state",
      (payload: Record<string, unknown>) => {
        const canvasJsonStr = payload.canvasJSON as string | undefined;
        if (!canvasJsonStr || canvasJsonStr === "{}") return;
        try {
          void canvas.loadFromJSON(JSON.parse(canvasJsonStr)).then(() => {
            canvas.renderAll();
          });
        } catch {
          // ignore
        }
      },
    );

    const cleanupCursorMoved = on(
      "cursor:moved",
      (payload: Record<string, unknown>) => {
        const { userId, x, y, color } = payload as CursorPayload;
        if (!userId || typeof x !== "number" || typeof y !== "number") return;
        if (userId === socket.id) return;

        let cursorElement = document.getElementById(`cursor-${userId}`);
        if (!cursorElement) {
          cursorElement = document.createElement("div");
          cursorElement.id = `cursor-${userId}`;
          cursorElement.style.cssText = [
            "position:absolute",
            "width:10px",
            "height:10px",
            "border-radius:50%",
            `background:${color ?? "#00BD7D"}`,
            "pointer-events:none",
            "z-index:999",
            "transition: transform 0.05s linear",
          ].join(";");
          document
            .querySelector(".canvas-dot-grid")
            ?.appendChild(cursorElement);
        }

        cursorElement.style.transform = `translate(${x}px, ${y}px)`;
      },
    );

    const cleanupUserJoined = on(
      "user:joined",
      (payload: Record<string, unknown>) => {
        const userId = payload.userId;
        const userName = payload.name;
        const userColor = payload.color;
        if (
          typeof userId !== "string" ||
          typeof userName !== "string" ||
          typeof userColor !== "string"
        ) {
          return;
        }
        upsertUser({
          id: userId,
          name: userName,
          color: userColor,
          cursor: { x: 0, y: 0 },
        });
      },
    );

    const cleanupUserLeft = on(
      "user:left",
      (payload: Record<string, unknown>) => {
        const socketId = payload.socketId;
        if (typeof socketId === "string") {
          removeUser(socketId);
        }
      },
    );

    if (roomId) {
      emit("room_join", {
        user: {
          id: socket.id ?? `local-${crypto.randomUUID()}`,
          name: "Guest User",
          color: "#7c3aed",
        },
      });
    }

    canvas.on("object:modified", onObjectModified);
    canvas.on("object:added", onObjectModified);
    canvas.on("object:removed", onObjectModified);
    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", clearSelection);
    canvas.on("mouse:dblclick", handleSelection);
    canvas.on("mouse:move", onMouseMove);

    setCanvasJSON(JSON.stringify(canvas.toObject(["objectId", "smartMeta"])));

    return () => {
      canvas.off("object:modified", onObjectModified);
      canvas.off("object:added", onObjectModified);
      canvas.off("object:removed", onObjectModified);
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", clearSelection);
      canvas.off("mouse:dblclick", handleSelection);
      canvas.off("mouse:move", onMouseMove);
      cleanupObjectUpdated();
      cleanupCanvasState();
      cleanupCursorMoved();
      cleanupUserJoined();
      cleanupUserLeft();
    };
  }, [
    emit,
    fabricRef,
    on,
    removeUser,
    roomId,
    setCanvasJSON,
    setSelectedObject,
    socket.id,
    upsertUser,
  ]);

  // Unused – suppress lint warning
  void canvasJSON;

  return (
    <section className="relative h-screen w-full overflow-hidden canvas-dot-grid">
      <CanvasControls fabricRef={fabricRef} />
      <canvas id="main-canvas" />
    </section>
  );
}
