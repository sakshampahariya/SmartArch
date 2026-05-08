import { create } from "zustand";

interface User {
  id: string;
  name: string;
  color: string;
  cursor: {
    x: number;
    y: number;
  };
}

interface RoomStore {
  roomId: string | null;
  users: User[];
  setRoomId: (id: string) => void;
  upsertUser: (user: User) => void;
  removeUser: (id: string) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  users: [],
  setRoomId: (id) => set({ roomId: id }),
  upsertUser: (user) =>
    set((state) => {
      const index = state.users.findIndex(
        (existingUser) => existingUser.id === user.id,
      );
      if (index >= 0) {
        const nextUsers = [...state.users];
        nextUsers[index] = user;
        return { users: nextUsers };
      }
      return { users: [...state.users, user] };
    }),
  removeUser: (id) =>
    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
    })),
}));
