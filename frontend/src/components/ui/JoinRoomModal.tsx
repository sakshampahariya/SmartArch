import { useState, useEffect } from "react";
import { useRoomStore } from "../../stores/roomStore";
import { supabase } from "../../services/supabase";

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

  // Pre-fill name from Supabase auth session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const displayName =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Anonymous";
        setName(displayName);
        store.myName !== displayName &&
          localStorage.setItem("smartarch_name", displayName);
      }
    });
  }, []);

  useEffect(() => {
    if (initialRoomId) {
      setMode("join");
      setRoomInput(initialRoomId);
    }
  }, [initialRoomId]);

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    setError("");
    localStorage.setItem("smartarch_name", name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Create board in Supabase
      const { data, error: dbErr } = await supabase
        .from("boards")
        .insert([{ name: "Untitled Board", created_by: user.id }])
        .select()
        .single();

      if (dbErr || !data) throw dbErr || new Error("Failed to create board");

      store.setRoom(data.id, data.id);
      store.setMyRole("owner");
      onJoined();
    } catch (e: any) {
      setError(e.message || "Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError("Enter your name");
    if (!roomInput.trim()) return setError("Enter room ID");
    setLoading(true);
    setError("");
    localStorage.setItem("smartarch_name", name);

    try {
      // Verify board exists in Supabase
      const { data, error: dbErr } = await supabase
        .from("boards")
        .select("id, created_by")
        .eq("id", roomInput.trim())
        .single();

      if (dbErr || !data) {
        setError("Room not found. Check the ID and try again.");
        setLoading(false);
        return;
      }

      // Determine role: owner if they created it, otherwise collaborator
      const { data: { user } } = await supabase.auth.getUser();
      const role = user && data.created_by === user.id ? "owner" : "collaborator";

      store.setRoom(data.id, data.id);
      store.setMyRole(role);
      onJoined();
    } catch {
      setError("Failed to join room. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,15,25,0.85)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        background: "#fff", padding: "36px", borderRadius: "24px",
        width: "90%", maxWidth: "420px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>
        <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "30px", margin: "0 0 4px 0", color: "#1a1a1a" }}>
          SmartArch Board
        </h2>
        <p style={{ color: "rgba(26,26,26,0.55)", fontSize: "14px", margin: "0 0 28px 0" }}>
          Real-time collaborative system design
        </p>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: "rgba(26,26,26,0.05)", padding: "4px", borderRadius: "12px" }}>
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "9px", borderRadius: "9px", border: "none",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#1a1a1a" : "rgba(26,26,26,0.55)",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "create" ? "＋ Create Board" : "→ Join Room"}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dhruv"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                border: "1.5px solid rgba(26,26,26,0.1)", background: "rgba(26,26,26,0.02)",
                fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0871E7")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.1)")}
            />
          </div>

          {mode === "join" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Room / Board ID</label>
              <input
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Paste the board ID or link here"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  border: "1.5px solid rgba(26,26,26,0.1)", background: "rgba(26,26,26,0.02)",
                  fontSize: "14px", fontFamily: "monospace", outline: "none", boxSizing: "border-box", transition: "border 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0871E7")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.1)")}
              />
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(26,26,26,0.4)" }}>
                Paste the full board URL or just the ID (UUID format)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", color: "#dc2626", borderRadius: "8px", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(239,68,68,0.2)" }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={mode === "create" ? handleCreate : handleJoin}
          disabled={loading}
          style={{
            width: "100%", marginTop: "24px", padding: "15px", borderRadius: "12px",
            background: loading ? "#94a3b8" : "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
            color: "#fff", border: "none", fontSize: "15px", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(8,113,231,0.3)",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? "Please wait…"
            : mode === "create"
            ? "Create My Board →"
            : "Enter Room →"}
        </button>
      </div>
    </div>
  );
}
