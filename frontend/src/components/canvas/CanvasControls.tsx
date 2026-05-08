import type { MutableRefObject } from "react";
import { Circle, IText, Line, Rect, Triangle, type Canvas } from "fabric";
import { useCanvasStore } from "../../stores/canvasStore";

interface CanvasControlsProps {
  fabricRef: MutableRefObject<Canvas | null>;
}

const genId = () => crypto.randomUUID();

type Tool = "select" | "rect" | "circle" | "arrow" | "text" | "triangle" | "line";

const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <SelectIcon /> },
  { id: "rect", label: "Rectangle", icon: <RectIcon /> },
  { id: "circle", label: "Circle", icon: <CircleIcon /> },
  { id: "triangle", label: "Triangle", icon: <TriangleIcon /> },
  { id: "line", label: "Line", icon: <LineIcon /> },
  { id: "text", label: "Text", icon: <TextIcon /> },
];

export default function CanvasControls({ fabricRef }: CanvasControlsProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  function addShape(tool: Tool) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setActiveTool(tool as Parameters<typeof setActiveTool>[0]);

    let obj: Rect | Circle | Triangle | Line | IText | null = null;

    const cx = canvas.getWidth() / 2;
    const cy = canvas.getHeight() / 2;

    switch (tool) {
      case "rect":
        obj = new Rect({
          left: cx - 80,
          top: cy - 40,
          width: 160,
          height: 80,
          fill: "rgba(99,102,241,0.15)",
          stroke: "#6366f1",
          strokeWidth: 1.5,
          rx: 8,
          ry: 8,
        });
        break;
      case "circle":
        obj = new Circle({
          left: cx - 50,
          top: cy - 50,
          radius: 50,
          fill: "rgba(16,185,129,0.15)",
          stroke: "#10b981",
          strokeWidth: 1.5,
        });
        break;
      case "triangle":
        obj = new Triangle({
          left: cx - 60,
          top: cy - 52,
          width: 120,
          height: 104,
          fill: "rgba(245,158,11,0.15)",
          stroke: "#f59e0b",
          strokeWidth: 1.5,
        });
        break;
      case "line":
        obj = new Line([cx - 80, cy, cx + 80, cy], {
          stroke: "#94a3b8",
          strokeWidth: 2,
          strokeLineCap: "round",
        });
        break;
      case "text":
        obj = new IText("Click to edit", {
          left: cx - 60,
          top: cy - 12,
          fontFamily: "Inter, sans-serif",
          fontSize: 18,
          fill: "#f1f5f9",
        });
        break;
      default:
        setActiveTool("select");
        return;
    }

    if (obj) {
      (obj as typeof obj & { objectId: string }).objectId = genId();
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  }

  function deleteSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (!active.length) return;
    canvas.remove(...active);
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function clearAll() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!window.confirm("Clear all objects from the board?")) return;
    canvas.clear();
    canvas.backgroundColor = "transparent";
    canvas.renderAll();
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "12px",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "#1e1e2e",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "12px",
        padding: "6px 8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        backdropFilter: "blur(12px)",
      }}
    >
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          label={tool.label}
          active={activeTool === tool.id}
          onClick={() => addShape(tool.id)}
        >
          {tool.icon}
        </ToolButton>
      ))}

      {/* Divider */}
      <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

      {/* Delete selected */}
      <ToolButton label="Delete selected" onClick={deleteSelected} danger>
        <TrashIcon />
      </ToolButton>

      {/* Clear all */}
      <ToolButton label="Clear board" onClick={clearAll} danger>
        <ClearIcon />
      </ToolButton>
    </div>
  );
}

// ── Reusable button ──────────────────────────────────────────────────────────

function ToolButton({
  children,
  label,
  active,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: active
          ? "1px solid rgba(124,58,237,0.6)"
          : "1px solid transparent",
        background: active
          ? "rgba(124,58,237,0.22)"
          : danger
          ? "transparent"
          : "transparent",
        color: active
          ? "#a78bfa"
          : danger
          ? "rgba(239,68,68,0.6)"
          : "rgba(255,255,255,0.55)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = danger
            ? "rgba(239,68,68,0.12)"
            : "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = danger ? "#ef4444" : "#fff";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = danger
            ? "rgba(239,68,68,0.6)"
            : "rgba(255,255,255,0.55)";
        }
      }}
    >
      {children}
    </button>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function SelectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l14 9-7 1-3 7z" />
    </svg>
  );
}

function RectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function TriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 3 21 21 3 21" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}
