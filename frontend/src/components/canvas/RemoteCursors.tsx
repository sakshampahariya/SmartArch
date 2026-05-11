import { useRoomStore } from "../../stores/roomStore";

export function RemoteCursors() {
  const users = useRoomStore((s) => s.users);
  const myUserId = useRoomStore((s) => s.myUserId);

  const others = users.filter((u) => u.userId !== myUserId && u.isOnline);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {others.map((user) => (
        <div
          key={user.userId}
          style={{
            position: "absolute",
            left: user.cursor.x,
            top: user.cursor.y,
            transform: "translate(-2px, -2px)",
            transition: "left 0.05s linear, top 0.05s linear",
          }}
        >
          {/* Cursor dot */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill={user.color}>
            <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" />
          </svg>

          {/* Name label */}
          <div
            style={{
              marginTop: "2px",
              background: user.color,
              color: "#fff",
              borderRadius: "4px 12px 12px 12px",
              padding: "2px 8px",
              fontSize: "11px",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          >
            {user.name}
            {user.role === "owner" && " 👑"}
            {user.role === "viewer" && " 👁"}
          </div>
        </div>
      ))}
    </div>
  );
}
