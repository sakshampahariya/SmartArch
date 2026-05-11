import { create } from "zustand";

export type UserRole = "owner" | "collaborator" | "viewer";
export type DrawPermission = "everyone" | "owner-only";

export interface RoomUser {
  userId: string;
  name: string;
  color: string;
  role: UserRole;
  cursor: { x: number; y: number };
  isOnline: boolean;
  joinedAt?: number;
}

interface RoomStore {
  roomId: string | null;
  boardId: string | null;
  myUserId: string;
  myName: string;
  myRole: UserRole;
  myColor: string;
  drawPermission: DrawPermission;
  users: RoomUser[];
  isConnected: boolean;

  setRoom: (roomId: string, boardId?: string) => void;
  setRoomId: (id: string) => void; // backwards compat
  setMyRole: (role: UserRole) => void;
  setMyColor: (color: string) => void;
  setDrawPermission: (p: DrawPermission) => void;
  upsertUser: (user: Partial<RoomUser> & { userId: string }) => void;
  removeUser: (userId: string) => void;
  updateCursor: (userId: string, x: number, y: number) => void;
  setConnected: (v: boolean) => void;
  canIDraw: () => boolean;
}

const getOrCreateUserId = () => {
  let id = localStorage.getItem("smartarch_uid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("smartarch_uid", id);
  }
  return id;
};

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  boardId: null,
  myUserId: getOrCreateUserId(),
  myName: localStorage.getItem("smartarch_name") ?? "Anonymous",
  myRole: "collaborator",
  myColor: "#3B82F6",
  drawPermission: "everyone",
  users: [],
  isConnected: false,

  setRoom: (roomId, boardId) => set({ roomId, boardId: boardId ?? null }),
  setRoomId: (id) => set({ roomId: id }), // backwards compat

  setMyRole: (myRole) => set({ myRole }),
  setMyColor: (myColor) => set({ myColor }),
  setDrawPermission: (drawPermission) => set({ drawPermission }),
  setConnected: (isConnected) => set({ isConnected }),

  upsertUser: (user) =>
    set((s) => ({
      users: s.users.some((u) => u.userId === user.userId)
        ? s.users.map((u) =>
            u.userId === user.userId ? ({ ...u, ...user } as RoomUser) : u
          )
        : [...s.users, user as RoomUser],
    })),

  removeUser: (userId) =>
    set((s) => ({ users: s.users.filter((u) => u.userId !== userId) })),

  updateCursor: (userId, x, y) =>
    set((s) => ({
      users: s.users.map((u) =>
        u.userId === userId ? { ...u, cursor: { x, y } } : u
      ),
    })),

  canIDraw: () => {
    const { myRole, drawPermission } = get();
    if (myRole === "owner") return true;
    if (drawPermission === "everyone" && myRole === "collaborator") return true;
    return false;
  },
}));
