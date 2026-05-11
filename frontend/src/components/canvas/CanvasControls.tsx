import type { MutableRefObject } from "react";
import { useState } from "react";
import { Circle, IText, Textbox, Line, Rect, Triangle, type Canvas } from "fabric";
import { useCanvasStore } from "../../stores/canvasStore";

interface CanvasControlsProps {
  fabricRef: MutableRefObject<Canvas | null>;
}

const genId = () => crypto.randomUUID();

type Tool = "select" | "rect" | "circle" | "arrow" | "text" | "triangle" | "line" | "pencil" | "eraser" | "sticky";

// Preset color palette
const COLOR_PALETTE = [
  "#00BD7D", // teal (default)
  "#7c3aed", // purple
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f1f5f9", // white-ish
  "#374151", // dark gray
  "#000000", // black
];

const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <SelectIcon /> },
  { id: "rect", label: "Rectangle", icon: <RectIcon /> },
  { id: "circle", label: "Circle", icon: <CircleIcon /> },
  { id: "triangle", label: "Triangle", icon: <TriangleIcon /> },
  { id: "line", label: "Line", icon: <LineIcon /> },
  { id: "text", label: "Text", icon: <TextIcon /> },
  { id: "pencil", label: "Freehand (Smart Draw)", icon: <PencilIcon /> },
  { id: "eraser", label: "Eraser", icon: <EraserIcon /> },
  { id: "sticky", label: "Sticky Note", icon: <StickyIcon /> },
];

export default function CanvasControls({ fabricRef }: CanvasControlsProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeColor = useCanvasStore((s) => s.activeColor);
  const setActiveColor = useCanvasStore((s) => s.setActiveColor);
  const isDarkMode = useCanvasStore((s) => s.isDarkMode);
  const toggleTheme = useCanvasStore((s) => s.toggleTheme);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const historyIndex = useCanvasStore((s) => s.historyIndex);
  const historyLen = useCanvasStore((s) => s.history.length);

  const [showColorPicker, setShowColorPicker] = useState(false);

  // Ensure canvas background is always transparent so the grid shows through
  const canvas = fabricRef.current;
  if (canvas && canvas.backgroundColor !== "transparent") {
    canvas.backgroundColor = "transparent";
    canvas.renderAll();
  }

  function addShape(tool: Tool) {
    const cv = fabricRef.current;
    if (!cv) return;
    setActiveTool(tool as Parameters<typeof setActiveTool>[0]);

    let obj: Rect | Circle | Triangle | Line | IText | null = null;
    const cx = cv.getWidth() / 2;
    const cy = cv.getHeight() / 2;
    const stroke = activeColor;

    switch (tool) {
      case "rect":
        obj = new Rect({
          left: cx - 80, top: cy - 40,
          width: 160, height: 80,
          fill: `${stroke}22`,
          stroke, strokeWidth: 1.5, rx: 8, ry: 8,
        });
        break;
      case "circle":
        obj = new Circle({
          left: cx - 50, top: cy - 50, radius: 50,
          fill: `${stroke}22`,
          stroke, strokeWidth: 1.5,
        });
        break;
      case "triangle":
        obj = new Triangle({
          left: cx - 60, top: cy - 52,
          width: 120, height: 104,
          fill: `${stroke}22`,
          stroke, strokeWidth: 1.5,
        });
        break;
      case "line":
        obj = new Line([cx - 80, cy, cx + 80, cy], {
          stroke, strokeWidth: 2, strokeLineCap: "round",
        });
        break;
      case "text":
        obj = new IText("Click to edit", {
          left: cx - 60, top: cy - 12,
          fontFamily: "Inter, sans-serif",
          fontSize: 18,
          fill: isDarkMode ? "#f1f5f9" : "#1e1e2e",
        });
        break;
      case "sticky":
        const noteColor = activeColor;
        const stickyNote = new Textbox("Type here...", {
          left: cx - 75, top: cy - 75,
          width: 150,
          height: 150, // Note: Textbox height is usually dynamic but we can set it
          fontSize: 18,
          fontFamily: "var(--font-sans)",
          fill: "#000000",
          backgroundColor: noteColor,
          textAlign: "center",
          originX: "center",
          originY: "center",
          splitByGrapheme: true,
          padding: 20,
          editable: true,
          // Custom property to identify it's a sticky note
          // @ts-ignore
          isSticky: true,
        });
        obj = stickyNote as any;
        break;
      case "pencil":
      case "eraser":
        setActiveTool(tool);
        return;
      default:
        setActiveTool("select");
        return;
    }

    if (obj) {
      (obj as typeof obj & { objectId: string }).objectId = genId();
      cv.add(obj);
      cv.setActiveObject(obj);
      cv.renderAll();
    }
  }

  function deleteSelected() {
    const cv = fabricRef.current;
    if (!cv) return;
    const active = cv.getActiveObjects();
    if (!active.length) return;
    cv.remove(...active);
    cv.discardActiveObject();
    cv.renderAll();
  }

  function clearAll() {
    const cv = fabricRef.current;
    if (!cv) return;
    if (!window.confirm("Clear all objects from the board?")) return;
    cv.clear();
    cv.backgroundColor = isDarkMode ? "transparent" : "#ffffff";
    cv.renderAll();
  }

  function handleUndo() {
    const prevState = undo();
    if (prevState && fabricRef.current) {
      fabricRef.current.loadFromJSON(JSON.parse(prevState)).then(() => fabricRef.current?.renderAll());
    }
  }

  function handleRedo() {
    const nextState = redo();
    if (nextState && fabricRef.current) {
      fabricRef.current.loadFromJSON(JSON.parse(nextState)).then(() => fabricRef.current?.renderAll());
    }
  }

  function exportPNG() {
    const cv = fabricRef.current;
    if (!cv) return;
    // Save original bg
    const origBg = cv.backgroundColor;
    // Set explicit bg for export to avoid transparent pngs looking bad
    cv.backgroundColor = isDarkMode ? "#13131e" : "#ffffff";
    const dataURL = cv.toDataURL({ format: "png", multiplier: 2 }); // 2x resolution
    cv.backgroundColor = origBg;
    
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `smartarch-board-${Date.now()}.png`;
    a.click();
  }

  // Toolbar background adapts to theme
  const toolbarBg = isDarkMode
    ? "rgba(20,20,30,0.85)"
    : "rgba(255,255,255,0.85)";
  const toolbarBorder = isDarkMode
    ? "rgba(255,255,255,0.12)"
    : "rgba(26,26,26,0.15)";
  const toolbarShadow = isDarkMode
    ? "0 24px 80px rgba(0,0,0,0.6)"
    : "0 20px 60px rgba(16,35,58,0.15)";

  return (
    <>
      {/* ── Main toolbar ── */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "24px",
          transform: "translateX(-50%)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: toolbarBg,
          border: `1px solid ${toolbarBorder}`,
          borderRadius: "24px",
          padding: "8px 12px",
          boxShadow: toolbarShadow,
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Tool buttons */}
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            label={tool.label}
            active={activeTool === tool.id}
            isDark={isDarkMode}
            onClick={() => addShape(tool.id)}
          >
            {tool.icon}
          </ToolButton>
        ))}

        {/* Divider */}
        <div style={{ width: "1px", height: "30px", background: toolbarBorder, margin: "0 4px" }} />

        {/* Color swatch button */}
        <div style={{ position: "relative" }}>
          <button
            title="Stroke color"
            onClick={() => setShowColorPicker((v) => !v)}
            style={{
              width: "32px", height: "32px",
              borderRadius: "50%",
              border: showColorPicker
                ? "2px solid #7c3aed"
                : `2px solid ${toolbarBorder}`,
              background: activeColor,
              cursor: "pointer",
              transition: "border-color 0.15s, transform 0.15s",
              transform: showColorPicker ? "scale(1.15)" : "scale(1)",
            }}
          />

          {/* Color palette dropdown */}
          {showColorPicker && (
            <div
              style={{
                position: "absolute",
                top: "56px",
                left: "50%",
                transform: "translateX(-50%)",
                background: isDarkMode ? "#1e1e2e" : "#ffffff",
                border: `1px solid ${toolbarBorder}`,
                borderRadius: "12px",
                padding: "10px",
                display: "grid",
                gridTemplateColumns: "repeat(5, 28px)",
                gap: "6px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                zIndex: 50,
              }}
            >
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => { setActiveColor(c); setShowColorPicker(false); }}
                  style={{
                    width: "28px", height: "28px",
                    borderRadius: "50%",
                    background: c,
                    border: activeColor === c ? "2px solid #7c3aed" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                    transform: activeColor === c ? "scale(1.2)" : "scale(1)",
                    outline: c === "#000000" && !isDarkMode ? "1px solid #ccc" : "none",
                  }}
                />
              ))}
              {/* Custom color via native input */}
              <label
                title="Custom color"
                style={{
                  width: "28px", height: "28px",
                  borderRadius: "50%",
                  background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                  border: "2px solid transparent",
                }}
              >
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                />
                +
              </label>
            </div>
          )}
        </div>

        <div style={{ width: "1px", height: "30px", background: toolbarBorder, margin: "0 4px" }} />

        {/* Day / Night toggle */}
        <button
          title={isDarkMode ? "Switch to Light mode" : "Switch to Dark mode"}
          onClick={toggleTheme}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px",
            borderRadius: "8px",
            border: "1px solid transparent",
            background: "transparent",
            color: isDarkMode ? "#fbbf24" : "#6366f1",
            cursor: "pointer",
            transition: "all 0.15s",
            fontSize: "18px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDarkMode
              ? "rgba(251,191,36,0.12)"
              : "rgba(99,102,241,0.12)";
          }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "30px", background: toolbarBorder, margin: "0 4px" }} />

        {/* Undo / Redo */}
        <ToolButton label="Undo (Ctrl+Z)" isDark={isDarkMode} onClick={handleUndo} disabled={historyIndex === 0}>
          <UndoIcon />
        </ToolButton>
        <ToolButton label="Redo (Ctrl+Y)" isDark={isDarkMode} onClick={handleRedo} disabled={historyIndex === historyLen - 1}>
          <RedoIcon />
        </ToolButton>

        {/* Divider */}
        <div style={{ width: "1px", height: "30px", background: toolbarBorder, margin: "0 4px" }} />

        {/* Export to PNG */}
        <ToolButton label="Export to PNG" isDark={isDarkMode} onClick={exportPNG}>
          <DownloadIcon />
        </ToolButton>

        {/* Divider */}
        <div style={{ width: "1px", height: "30px", background: toolbarBorder, margin: "0 4px" }} />

        {/* Delete selected */}
        <ToolButton label="Delete selected" isDark={isDarkMode} onClick={deleteSelected} danger>
          <TrashIcon />
        </ToolButton>

        {/* Clear all */}
        <ToolButton label="Clear board" isDark={isDarkMode} onClick={clearAll} danger>
          <ClearIcon />
        </ToolButton>
      </div>
    </>
  );
}

// ── Reusable button ───────────────────────────────────────────────────────────

function ToolButton({
  children, label, active, danger, disabled, isDark, onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  isDark?: boolean;
  onClick: () => void;
}) {
  const darkText = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
  return (
    <button
      title={label}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "40px", height: "40px",
        borderRadius: "12px",
        border: active ? "1px solid rgba(124,58,237,0.6)" : "1px solid transparent",
        background: active ? "rgba(124,58,237,0.22)" : "transparent",
        color: active ? "#a78bfa" : danger ? "rgba(239,68,68,0.6)" : darkText,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = danger ? "rgba(239,68,68,0.12)" : "rgba(128,128,200,0.12)";
          e.currentTarget.style.color = danger ? "#ef4444" : (isDark ? "#fff" : "#000");
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = danger ? "rgba(239,68,68,0.6)" : darkText;
        }
      }}
    >
      {children}
    </button>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function SelectIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-7 1-3 7z" /></svg>;
}
function RectIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /></svg>;
}
function CircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>;
}
function TriangleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 3 21 21 3 21" /></svg>;
}
function LineIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="20" x2="20" y2="4" /></svg>;
}
function TextIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>;
}
function PencilIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}
function EraserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>;
}
function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
}
function ClearIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="3" x2="21" y2="21" /></svg>;
}
function UndoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>;
}
function RedoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>;
}
function DownloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}

function StickyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
      <path d="M15 3v6h6" />
      <line x1="7" y1="13" x2="17" y2="13" />
      <line x1="7" y1="17" x2="13" y2="17" />
    </svg>
  );
}
