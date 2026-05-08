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

export const aiApi = {
  suggest: (canvasDescription: string, question: string) =>
    api
      .post<{ suggestion: string }>("/api/ai/suggest", {
        canvasDescription,
        question,
      })
      .then((r) => r.data.suggestion),
};

export default api;
