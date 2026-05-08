export interface ObjectMeta {
  objectId: string;
  label: string;
  notes: string;
  codeSnippet: string;
  language: string;
  links: string[];
  tags: string[];
  createdBy: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  room_id: string;
  canvas_json: string;
  metadata: Record<string, ObjectMeta>;
  created_at: string;
  updated_at: string;
}

export interface SocketEvent {
  type: "object:updated" | "cursor:moved" | "user:joined" | "user:left";
  payload: unknown;
  userId: string;
  roomId: string;
  timestamp: number;
}
