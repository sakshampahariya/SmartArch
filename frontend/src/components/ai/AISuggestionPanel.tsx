import { useState } from "react";
import { aiApi, type CanvasElement } from "../../services/api";
import { useCanvasStore } from "../../stores/canvasStore";

interface Props {
  canvasJSON: string;
  onDrawElements?: (elements: CanvasElement[], title: string) => void;
}

const SUGGESTIONS = [
  "Draw a login flowchart",
  "Draw a microservices architecture",
  "What are the bottlenecks?",
  "Suggest a caching strategy.",
];

export function AISuggestionPanel({ canvasJSON, onDrawElements }: Props) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [drawnTitle, setDrawnTitle] = useState("");
  const [responseType, setResponseType] = useState<"text" | "canvas">("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDarkMode = useCanvasStore((state) => state.isDarkMode);

  async function handleAsk(q?: string) {
    const query = (q ?? question).trim();
    if (!query) return;

    setQuestion(query);
    setLoading(true);
    setError("");
    setResponse("");
    setDrawnTitle("");

    try {
      const result = await aiApi.suggest(canvasJSON, query);
      setResponseType(result.type);
      setResponse(result.suggestion);

      if (result.type === "canvas" && result.elements && result.elements.length > 0) {
        setDrawnTitle(result.title ?? "Diagram");
        onDrawElements?.(result.elements, result.title ?? "Diagram");
      }
    } catch (err) {
      setError("Failed to get AI suggestion. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    fontFamily: "var(--font-sans)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(26,26,26,0.4)",
    margin: "0 0 10px 0",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Quick prompts */}
      <div>
        <p style={labelStyle}>Quick prompts</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleAsk(s)}
              style={{
                background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(26,26,26,0.03)",
                border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(26,26,26,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(26,26,26,0.6)",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                lineHeight: 1.4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? "rgba(124,58,237,0.15)" : "rgba(8,113,231,0.1)";
                e.currentTarget.style.borderColor = isDarkMode ? "rgba(124,58,237,0.35)" : "rgba(8,113,231,0.3)";
                e.currentTarget.style.color = isDarkMode ? "#a78bfa" : "#0871E7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(26,26,26,0.03)";
                e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(26,26,26,0.1)";
                e.currentTarget.style.color = isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(26,26,26,0.6)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Custom question */}
      <div>
        <p style={labelStyle}>Ask or describe what to draw</p>
        <textarea
          rows={3}
          placeholder="e.g. Draw a login flowchart, draw Doraemon, what are bottlenecks?…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void handleAsk();
          }}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "none",
            background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
            border: isDarkMode ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(26,26,26,0.12)",
            borderRadius: "10px",
            padding: "10px 12px",
            color: isDarkMode ? "rgba(255,255,255,0.85)" : "#1a1a1a",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            lineHeight: 1.5,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = isDarkMode ? "rgba(124,58,237,0.5)" : "rgba(8,113,231,0.5)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(26,26,26,0.12)")}
        />
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(26,26,26,0.35)", margin: "4px 0 0 0" }}>
          Ctrl + Enter to send
        </p>
      </div>

      <button
        onClick={() => handleAsk()}
        disabled={loading || !question.trim()}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
          border: "none",
          background: loading
            ? (isDarkMode ? "rgba(124,58,237,0.2)" : "rgba(8,113,231,0.1)")
            : (isDarkMode ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)"),
          color: loading ? (isDarkMode ? "rgba(167,139,250,0.6)" : "rgba(8,113,231,0.6)") : "#fff",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "opacity 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? (<><LoadingSpinner />Thinking…</>) : "Ask AI →"}
      </button>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 12px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "#f87171", lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      {/* Canvas drawn confirmation */}
      {responseType === "canvas" && drawnTitle && (
        <div style={{
          background: isDarkMode ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
          border: isDarkMode ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(16,185,129,0.25)",
          borderRadius: "10px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <span style={{ fontSize: "18px" }}>✅</span>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, color: "#10b981", margin: "0 0 2px 0" }}>
              Drawn on Canvas!
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(26,26,26,0.6)", margin: 0 }}>
              "{drawnTitle}" has been added to your board.
            </p>
          </div>
        </div>
      )}

      {/* Text response */}
      {response && responseType === "text" && (
        <div style={{
          background: isDarkMode ? "rgba(124,58,237,0.08)" : "rgba(8,113,231,0.06)",
          border: isDarkMode ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(8,113,231,0.15)",
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: isDarkMode ? "#a78bfa" : "#0871E7", margin: "0 0 10px 0" }}>
            AI Response
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: isDarkMode ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.75)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
            {response}
          </p>
        </div>
      )}

      {/* Canvas draw summary note */}
      {response && responseType === "canvas" && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(26,26,26,0.4)", margin: 0, fontStyle: "italic" }}>
          {response}
        </p>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
