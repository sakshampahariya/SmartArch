import { useState, useEffect } from "react";
import { useRoomStore } from "../../stores/roomStore";
import { boardsApi } from "../../services/api";

interface Props {
  onJoined: () => void;
  initialRoomId?: string;
}

export function JoinRoomModal({ onJoined, initialRoomId }: Props) {
  const store = useRoomStore();
  const [mode, setMode] = useState<"create" | "join">(initialRoomId ? "join" : "create");
  const [name, setName] = useState(store.myName);
  const [roomInput, setRoomInput] = useState(initialRoomId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialRoomId) {
      setMode("join");
      setRoomInput(initialRoomId);
    }
  }, [initialRoomId]);

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    localStorage.setItem("smartarch_name", name);
    try {
      const data = await boardsApi.create("Untitled Board", store.myUserId);
      store.setRoom(data.id, data.id);
      store.setMyRole("owner");
      onJoined();
    } catch (e) {
      setError("Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError("Enter your name");
    if (!roomInput.trim()) return setError("Enter room ID");
    setLoading(true);
    setError("");
    try {
      const data = await boardsApi.get(roomInput.trim());
      localStorage.setItem("smartarch_name", name);
      store.setRoom(data.id, data.id);
      store.setMyRole("collaborator"); // default, server may override
      onJoined();
    } catch {
      setError("Room not found. Check the ID.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,15,25,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        background: "#fff", padding: "32px", borderRadius: "24px",
        width: "90%", maxWidth: "400px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "28px", margin: "0 0 4px 0", color: "#1a1a1a" }}>
          SmartArch Board
        </h2>
        <p style={{ color: "rgba(26,26,26,0.6)", fontSize: "14px", margin: "0 0 24px 0" }}>
          Real-time collaborative system design
        </p>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: "rgba(26,26,26,0.04)", padding: "4px", borderRadius: "12px" }}>
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#1a1a1a" : "rgba(26,26,26,0.6)",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "create" ? "+ Create Board" : "→ Join Room"}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(26,26,26,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                border: "1px solid rgba(26,26,26,0.1)", background: "rgba(26,26,26,0.02)",
                fontSize: "15px", outline: "none", boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0871E7"}
              onBlur={(e) => e.target.style.borderColor = "rgba(26,26,26,0.1)"}
            />
          </div>

          {mode === "join" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(26,26,26,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Room ID</label>
              <input
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Paste room ID here"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  border: "1px solid rgba(26,26,26,0.1)", background: "rgba(26,26,26,0.02)",
                  fontSize: "15px", fontFamily: "monospace", outline: "none", boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#0871E7"}
                onBlur={(e) => e.target.style.borderColor = "rgba(26,26,26,0.1)"}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: "16px", padding: "10px 12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "8px", fontSize: "13px", fontWeight: 500 }}>
            {error}
          </div>
        )}

        <button
          onClick={mode === "create" ? handleCreate : handleJoin}
          disabled={loading}
          style={{
            width: "100%", marginTop: "24px", padding: "14px", borderRadius: "10px",
            background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
            color: "#fff", border: "none", fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 12px rgba(8,113,231,0.3)",
          }}
        >
          {loading ? "Loading..." : mode === "create" ? "Create My Board" : "Join Room"}
        </button>
      </div>
    </div>
  );
}
