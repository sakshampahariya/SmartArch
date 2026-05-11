import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { boardsApi, type Board } from "../services/api";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "recently";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const fetchBoards = useCallback(() => {
    setLoading(true);
    boardsApi
      .list()
      .then(setBoards)
      .catch(() => setError("Could not load boards. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = async () => {
    const name = newName.trim() || "Untitled Board";
    setCreating(true);
    try {
      const board = await boardsApi.create(name);
      setBoards((prev) => [board, ...prev]);
      setShowCreate(false);
      setNewName("");
      navigate(`/board/${board.id}`);
    } catch {
      setError("Failed to create board.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this board?")) return;
    try {
      await boardsApi.delete(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Failed to delete board.");
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#F3F4ED",
      fontFamily: "var(--font-sans)",
      paddingTop: "80px",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px 0",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}
        >
          <div>
            <h1 style={{
              fontFamily: "var(--font-instrument)",
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.1,
            }}>
              Your Boards
            </h1>
            <p style={{ color: "rgba(26,26,26,0.6)", fontSize: "14px", margin: "8px 0 0" }}>
              {boards.length} board{boards.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
              color: "#fff",
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(8,113,231,0.35)",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <PlusIcon /> New Board
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#f87171",
            fontSize: "14px",
            marginBottom: "24px",
          }}>
            {error}
          </div>
        )}

        {/* Create modal overlay */}
        {showCreate && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(26,26,26,0.1)",
                borderRadius: "20px",
                padding: "32px",
                width: "min(90%, 440px)",
                boxShadow: "0 24px 80px rgba(16,35,58,0.2)",
                backdropFilter: "blur(12px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "28px", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                New Board
              </h2>
              <p style={{ color: "rgba(26,26,26,0.6)", fontSize: "14px", margin: "0 0 24px" }}>
                Give your board a name to get started.
              </p>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Microservices Architecture"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(26,26,26,0.12)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "#1a1a1a",
                  fontFamily: "var(--font-sans)",
                  fontSize: "15px",
                  outline: "none",
                  marginBottom: "20px",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
                    color: "#fff",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: creating ? "not-allowed" : "pointer",
                    opacity: creating ? 0.6 : 1,
                  }}
                >
                  {creating ? "Creating…" : "Create Board →"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: "1px solid rgba(26,26,26,0.12)",
                    background: "rgba(255,255,255,0.5)",
                    color: "rgba(26,26,26,0.6)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Board grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(26,26,26,0.4)", fontSize: "14px" }}>
            Loading boards…
          </div>
        ) : boards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "80px 0",
              border: "1px dashed rgba(26,26,26,0.15)",
              borderRadius: "20px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🖊️</div>
            <p style={{ color: "rgba(26,26,26,0.5)", fontSize: "15px", margin: 0 }}>
              No boards yet. Create your first one!
            </p>
          </motion.div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
            paddingBottom: "60px",
          }}>
            {boards.map((board, i) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/board/${board.id}`)}
                style={{
                  background: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.62)",
                  borderRadius: "16px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  backdropFilter: "blur(8px)",
                }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 12px 40px rgba(16,35,58,0.12)",
                  borderColor: "rgba(8,113,231,0.4)",
                }}
              >
                {/* Preview area */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(236,245,251,0.94) 0%, rgba(220,236,246,0.92) 100%)",
                  borderRadius: "10px",
                  height: "120px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundImage: "radial-gradient(circle, rgba(26,26,26,0.06) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <span style={{ fontSize: "32px", opacity: 0.6 }}>🖊️</span>
                </div>

                <h3 style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  margin: "0 0 6px",
                }}>
                  {board.name}
                </h3>
                <p style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  color: "rgba(26,26,26,0.5)",
                  margin: "0 0 16px",
                }}>
                  Created {timeAgo(board.created_at)}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/board/${board.id}`); }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid rgba(8,113,231,0.3)",
                      background: "rgba(8,113,231,0.12)",
                      color: "#0871E7",
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Open
                  </button>
                  <button
                    onClick={(e) => handleDelete(board.id, e)}
                    title="Delete board"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(239,68,68,0.2)",
                      background: "rgba(239,68,68,0.07)",
                      color: "rgba(239,68,68,0.6)",
                      cursor: "pointer",
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
