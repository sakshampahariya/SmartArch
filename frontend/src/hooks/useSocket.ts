import { useCallback } from "react";
import { getSocket } from "../services/socket";
import { useRoomStore } from "../stores/roomStore";

export function useSocket() {
  const socket = getSocket();
  const roomId = useRoomStore((state) => state.roomId);

  const emit = useCallback(
    (event: string, data: Record<string, unknown> = {}) => {
      socket.emit(event, { ...data, roomId });
    },
    [roomId, socket],
  );

  const on = useCallback(
    (event: string, handler: (data: Record<string, unknown>) => void) => {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    [socket],
  );

  return { emit, on, socket };
}
