import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CanvasBoard } from "../components/canvas/CanvasBoard";
import { AISuggestionPanel } from "../components/ai/AISuggestionPanel";
import { useRoomStore } from "../stores/roomStore";
import { useCanvasStore } from "../stores/canvasStore";
import { boardsApi, type Board } from "../services/api";

export default function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const setRoomId = useRoomStore((state) => state.setRoomId);
  const users = useRoomStore((state) => state.users);
  const canvasJSON = useCanvasStore((state) => state.canvasJSON);

  const [board, setBoard] = useState<Board | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [boardName, setBoardName] = useState("Untitled Board");

  // Auto-generate a room id if none is in the URL
  useEffect(() => {
    if (!roomId) {
      navigate(`/board/${crypto.randomUUID()}`, { replace: true });
    } else {
      setRoomId(roomId);
    }
  }, [roomId, setRoomId, navigate]);

  // Fetch or auto-create the board record via REST
  useEffect(() => {
    if (!roomId) return;
    boardsApi
      .get(roomId)
      .then((b) => {
        setBoard(b);
        setBoardName(b.name);
      })
      .catch(() => {
        // Board doesn't exist yet — create it
        boardsApi
          .create("Untitled Board", "guest")
          .then((b) => {
            setBoard(b);
            setBoardName(b.name);
          })
          .catch(console.error);
      });
  }, [roomId]);

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleSaveName = useCallback(() => {
    if (!roomId || !boardName.trim()) return;
    setEditingName(false);
    boardsApi.update(roomId, { name: boardName }).then(setBoard).catch(console.error);
  }, [roomId, boardName]);

  // Auto-save canvas JSON via REST every 10 s when changed
  useEffect(() => {
    if (!roomId || !canvasJSON || canvasJSON === "{}") return;
    const timer = setTimeout(() => {
      boardsApi.update(roomId, { canvas_json: canvasJSON }).catch(console.error);
    }, 10_000);
    return () => clearTimeout(timer);
  }, [canvasJSON, roomId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#0f0f13" }}>
      {/* ── Top Header ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: "52px",
        background: "#16161e",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
        gap: "12px",
        zIndex: 30,
      }}>
        {/* Left: Logo + Board Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
          <Link to="/" style={{
            fontFamily: "var(--font-instrument)",
            fontSize: "19px",
            color: "#fff",
            textDecoration: "none",
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}>
            smartarch
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "18px" }}>/</span>
          {editingName ? (
            <input
              autoFocus
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "6px",
                padding: "4px 10px",
                color: "#fff",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                outline: "none",
                width: "200px",
              }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.82)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "text",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {board ? boardName : "Loading…"}
            </button>
          )}
        </div>

        {/* Centre: Live collaborators */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {users.slice(0, 5).map((u, i) => (
            <div
              key={u.id}
              title={u.name}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: u.color,
                border: "2px solid #16161e",
                marginLeft: i > 0 ? "-8px" : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "#fff",
                zIndex: 5 - i,
              }}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 5 && (
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginLeft: "4px" }}>
              +{users.length - 5}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleCopyLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: copied ? "rgba(0,189,125,0.18)" : "rgba(255,255,255,0.06)",
              color: copied ? "#00BD7D" : "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? (
              <><CheckIcon />Copied!</>
            ) : (
              <><ShareIcon />Share</>
            )}
          </button>

          <button
            onClick={() => setAiOpen((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(124,58,237,0.4)",
              background: aiOpen ? "rgba(124,58,237,0.22)" : "rgba(124,58,237,0.10)",
              color: "#a78bfa",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <SparkleIcon />
            AI Assistant
          </button>
        </div>
      </header>

      {/* ── Main body: Canvas + optional AI panel ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <CanvasBoard />
        </div>

        {/* AI Side Panel */}
        {aiOpen && (
          <div style={{
            width: "320px",
            flexShrink: 0,
            background: "#16161e",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}>
            {/* Panel header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SparkleIcon />
                <span style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#a78bfa",
                }}>AI Assistant</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
              >×</button>
            </div>

            {/* Room Info */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "0 0 6px 0", fontWeight: 600 }}>
                Room ID
              </p>
              <p style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.55)", margin: 0, wordBreak: "break-all", lineHeight: 1.5 }}>
                {roomId}
              </p>
            </div>

            {/* AI Panel Content */}
            <div style={{ padding: "16px 20px", flex: 1 }}>
              <AISuggestionPanel canvasJSON={canvasJSON} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Icon Components ──────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
