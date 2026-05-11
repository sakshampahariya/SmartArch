import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { CanvasBoard, type CanvasBoardHandle } from "../components/canvas/CanvasBoard";
import { RemoteCursors } from "../components/canvas/RemoteCursors";
import { AISuggestionPanel } from "../components/ai/AISuggestionPanel";
import { RoomPanel } from "../components/ui/RoomPanel";
import { JoinRoomModal } from "../components/ui/JoinRoomModal";
import { useRoomStore } from "../stores/roomStore";
import { useCanvasStore } from "../stores/canvasStore";
import { supabase } from "../services/supabase";
import type { CanvasElement } from "../services/api";

export default function BoardPage() {
  const { roomId: pathRoomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const queryRoomId = new URLSearchParams(location.search).get("room");
  const effectiveRoomId = pathRoomId || queryRoomId;

  const navigate = useNavigate();
  const storeRoomId = useRoomStore((state) => state.roomId);
  const myRole = useRoomStore((state) => state.myRole);
  const users = useRoomStore((state) => state.users);
  const canvasJSON = useCanvasStore((state) => state.canvasJSON);
  const isDarkMode = useCanvasStore((state) => state.isDarkMode);

  const [board, setBoard] = useState<any>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [boardName, setBoardName] = useState("Untitled Board");
  const [hasJoined, setHasJoined] = useState(false);
  const canvasBoardRef = useRef<CanvasBoardHandle>(null);

  const handleDrawElements = useCallback((elements: CanvasElement[]) => {
    canvasBoardRef.current?.drawAIElements(elements);
  }, []);

  const handleJoined = useCallback(() => {
    setHasJoined(true);
    const currentRoomId = useRoomStore.getState().roomId;
    if (currentRoomId && currentRoomId !== pathRoomId) {
      navigate(`/board/${currentRoomId}`, { replace: true });
    }
  }, [navigate, pathRoomId]);

  // Fetch board info once joined
  useEffect(() => {
    if (!hasJoined || !storeRoomId) return;
    supabase
      .from("boards")
      .select("*")
      .eq("id", storeRoomId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setBoard(data);
          setBoardName(data.name);
        } else {
          console.error("Could not fetch board", error);
        }
      });
  }, [hasJoined, storeRoomId]);

  // Auto-save board every 30s (owner only)
  useEffect(() => {
    if (!hasJoined || !storeRoomId || myRole !== "owner") return;
    
    const interval = setInterval(() => {
      const currentJson = useCanvasStore.getState().canvasJSON;
      if (currentJson && currentJson !== "{}") {
        supabase
          .from("boards")
          .update({ canvas_json: JSON.parse(currentJson), name: boardName })
          .eq("id", storeRoomId)
          .then(({ error }) => {
            if (error) console.error("Auto-save failed", error);
          });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hasJoined, storeRoomId, myRole, boardName]);

  const handleCopyLink = useCallback(() => {
    const shareUrl = `${window.location.origin}/board/${storeRoomId}`;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      navigator.clipboard.writeText(storeRoomId ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [storeRoomId]);

  const handleSaveName = useCallback(() => {
    if (!storeRoomId || !boardName.trim() || myRole !== "owner") return;
    setEditingName(false);
    supabase
      .from("boards")
      .update({ name: boardName })
      .eq("id", storeRoomId)
      .select()
      .single()
      .then(({ data, error }) => {
        if (data && !error) setBoard(data);
        else console.error("Failed to save name", error);
      });
  }, [storeRoomId, boardName, myRole]);

  if (!hasJoined) {
    return <JoinRoomModal onJoined={handleJoined} initialRoomId={effectiveRoomId ?? undefined} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: isDarkMode ? "#0f0f13" : "#F3F4ED" }}>
      {/* ── Top Header ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: "52px",
        background: isDarkMode ? "#16161e" : "#ffffff",
        borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(26,26,26,0.08)",
        flexShrink: 0,
        gap: "12px",
        zIndex: 30,
        boxShadow: isDarkMode ? "none" : "0 1px 10px rgba(0,0,0,0.02)",
      }}>
        {/* Left: Logo + Board Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
          <Link to="/" style={{
            fontFamily: "var(--font-instrument)",
            fontSize: "19px",
            color: isDarkMode ? "#fff" : "#1a1a1a",
            textDecoration: "none",
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}>
            smartarch
          </Link>
          <span style={{ color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(26,26,26,0.3)", fontSize: "18px" }}>/</span>
          {editingName ? (
            <input
              autoFocus
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              style={{
                background: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(26,26,26,0.04)",
                border: isDarkMode ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(26,26,26,0.12)",
                borderRadius: "6px",
                padding: "4px 10px",
                color: isDarkMode ? "#fff" : "#1a1a1a",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                outline: "none",
                width: "200px",
              }}
            />
          ) : (
            <button
              onClick={() => myRole === "owner" && setEditingName(true)}
              style={{
                background: "none",
                border: "none",
                color: isDarkMode ? "rgba(255,255,255,0.82)" : "rgba(26,26,26,0.85)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: myRole === "owner" ? "pointer" : "default",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => myRole === "owner" && (e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(26,26,26,0.04)")}
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
              key={u.userId}
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
              border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(26,26,26,0.15)",
              background: copied ? "rgba(0,189,125,0.18)" : (isDarkMode ? "rgba(255,255,255,0.06)" : "transparent"),
              color: copied ? "#00BD7D" : (isDarkMode ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.75)"),
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
              border: isDarkMode ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(8,113,231,0.4)",
              background: aiOpen ? (isDarkMode ? "rgba(124,58,237,0.22)" : "rgba(8,113,231,0.12)") : (isDarkMode ? "rgba(124,58,237,0.10)" : "transparent"),
              color: isDarkMode ? "#a78bfa" : "#0871E7",
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
          <CanvasBoard ref={canvasBoardRef} />
          <RemoteCursors />
        </div>

        {/* AI Side Panel */}
        {aiOpen && (
          <div style={{
            width: "320px",
            flexShrink: 0,
            background: isDarkMode ? "#16161e" : "#f8fafc",
            borderLeft: isDarkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(26,26,26,0.08)",
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
              borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(26,26,26,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDarkMode ? "#a78bfa" : "#0871E7" }}>
                <SparkleIcon />
                <span style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}>AI Assistant</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                style={{ background: "none", border: "none", color: isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(26,26,26,0.4)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
              >×</button>
            </div>

            {/* Room Info */}
            <div style={{ padding: "16px 20px", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(26,26,26,0.06)" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(26,26,26,0.4)", margin: "0 0 6px 0", fontWeight: 600 }}>
                Room ID
              </p>
              <p style={{ fontFamily: "monospace", fontSize: "11px", color: isDarkMode ? "rgba(255,255,255,0.55)" : "rgba(26,26,26,0.7)", margin: 0, wordBreak: "break-all", lineHeight: 1.5 }}>
                {storeRoomId}
              </p>
            </div>

            {/* AI Panel Content */}
            <div style={{ padding: "16px 20px", flex: 1 }}>
              <AISuggestionPanel canvasJSON={canvasJSON} onDrawElements={handleDrawElements} />
            </div>
          </div>
        )}
      </div>
      {/* Floating Room Panel */}
      <RoomPanel />
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
