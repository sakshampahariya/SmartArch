import { useState } from "react";
import { useRoomStore } from "../../stores/roomStore";
import { getSocket } from "../../services/socket";

export function RoomPanel() {
  const {
    roomId, myUserId, myRole, users, drawPermission,
    setDrawPermission,
  } = useRoomStore();
  const socket = getSocket();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const isOwner = myRole === "owner";

  const onlineUsers = users.filter((u) => u.isOnline);

  const copyRoomId = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl).catch(() =>
      navigator.clipboard.writeText(roomId ?? "")
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePermission = () => {
    const next = drawPermission === "everyone" ? "owner-only" : "everyone";
    socket.emit("permission_change", { roomId, userId: myUserId, drawPermission: next });
    setDrawPermission(next); // optimistic
  };

  const changeRole = (targetUserId: string, newRole: string) => {
    socket.emit("role_change", { roomId, requesterId: myUserId, targetUserId, newRole });
  };

  const badge = (role: string) => {
    if (role === "owner") return "👑";
    if (role === "collaborator") return "✏️";
    return "👁";
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", top: "76px", right: "12px", zIndex: 50,
          background: "#1a1a2e", color: "#fff",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "12px", padding: "8px 14px",
          display: "flex", alignItems: "center", gap: "8px",
          fontSize: "12px", fontFamily: "var(--font-sans)",
          cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
        {onlineUsers.length} online
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", top: "72px", right: "12px", zIndex: 50,
      width: "280px",
      background: "rgba(15,15,25,0.97)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      backdropFilter: "blur(20px)",
      fontFamily: "var(--font-sans)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a78bfa" }}>
          <span>👥</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Room</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px 6px" }}>✕</button>
      </div>

      {/* Room ID */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px 0" }}>Room ID — Share to invite</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <code style={{ flex: 1, fontSize: "11px", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.05)", padding: "6px 8px", borderRadius: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {roomId ?? "—"}
          </code>
          <button
            onClick={copyRoomId}
            style={{ background: copied ? "#10B981" : "rgba(124,58,237,0.3)", border: "none", borderRadius: "6px", padding: "6px 10px", color: "#fff", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
      </div>

      {/* Permission Toggle (owner only) */}
      {isOwner && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 8px 0" }}>Draw Permission</p>
          <button
            onClick={togglePermission}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: "10px", border: "1px solid",
              borderColor: drawPermission === "everyone" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
              background: drawPermission === "everyone" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: "#fff", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600 }}>
              {drawPermission === "everyone" ? "🎨 Everyone can draw" : "🔒 Only I can draw"}
            </span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>tap to toggle</span>
          </button>
          {drawPermission === "owner-only" && (
            <p style={{ fontSize: "11px", color: "#F59E0B", margin: "6px 0 0 0" }}>
              ⚠️ Others are in view-only mode
            </p>
          )}
        </div>
      )}

      {/* Users List */}
      <div style={{ padding: "12px 16px", maxHeight: "240px", overflowY: "auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 10px 0" }}>
          {onlineUsers.length} {onlineUsers.length === 1 ? "person" : "people"} online
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {users.map((user) => (
            <div key={user.userId} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: user.isOnline ? 1 : 0.4 }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: user.color, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, flexShrink: 0,
              }}>
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name} {user.userId === myUserId && <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>(you)</span>}
                </p>
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                  {badge(user.role)} {user.role}{!user.isOnline && " · offline"}
                </p>
              </div>

              {/* Role buttons (owner only, not for self) */}
              {isOwner && user.userId !== myUserId && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => changeRole(user.userId, "collaborator")}
                    title="Make collaborator (can draw)"
                    style={{
                      background: user.role === "collaborator" ? "#7c3aed" : "rgba(255,255,255,0.08)",
                      border: "none", borderRadius: "6px", padding: "4px 6px",
                      color: "#fff", cursor: "pointer", fontSize: "11px",
                    }}
                  >✏️</button>
                  <button
                    onClick={() => changeRole(user.userId, "viewer")}
                    title="Make viewer (read-only)"
                    style={{
                      background: user.role === "viewer" ? "#374151" : "rgba(255,255,255,0.08)",
                      border: "none", borderRadius: "6px", padding: "4px 6px",
                      color: "#fff", cursor: "pointer", fontSize: "11px",
                    }}
                  >👁</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
