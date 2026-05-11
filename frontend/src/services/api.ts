import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface Board {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  canvas_json: string;
  collaborators: string[];
}

// ── Board API ────────────────────────────────────────────────────────────────

export const boardsApi = {
  list: () => api.get<Board[]>("/api/boards").then((r) => r.data),

  create: (name: string, created_by = "guest") =>
    api.post<Board>("/api/boards", { name, created_by }).then((r) => r.data),

  get: (id: string) =>
    api.get<Board>(`/api/boards/${id}`).then((r) => r.data),

  update: (id: string, patch: { canvas_json?: string; name?: string }) =>
    api.patch<Board>(`/api/boards/${id}`, patch).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/boards/${id}`).then((r) => r.data),
};

// ── AI API ───────────────────────────────────────────────────────────────────

export interface AIResponse {
  type: "text" | "canvas";
  suggestion: string;
  elements?: CanvasElement[];
  title?: string;
}

export interface CanvasElement {
  kind: "rect" | "ellipse" | "diamond" | "arrow" | "text";
  // rect / diamond
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  label?: string;
  labelColor?: string;
  fontSize?: number;
  // ellipse
  cx?: number;
  cy?: number;
  rx2?: number;
  ry?: number;
  // arrow
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // text
  text?: string;
  color?: string;
}

export const aiApi = {
  suggest: (canvasDescription: string, question: string) =>
    api
      .post<AIResponse>("/api/ai/suggest", { canvasDescription, question })
      .then((r) => r.data),
};

export default api;
