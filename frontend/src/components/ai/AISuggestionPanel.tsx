import { useState } from "react";
import { aiApi } from "../../services/api";

interface Props {
  canvasJSON: string;
}

const SUGGESTIONS = [
  "How should I scale this architecture?",
  "What are the bottlenecks?",
  "Suggest a caching strategy.",
  "Review my microservices boundaries.",
];

export function AISuggestionPanel({ canvasJSON }: Props) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(q?: string) {
    const query = (q ?? question).trim();
    if (!query) return;

    setQuestion(query);
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const suggestion = await aiApi.suggest(canvasJSON, query);
      setResponse(suggestion);
    } catch (err) {
      setError("Failed to get AI suggestion. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Quick prompts */}
      <div>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          margin: "0 0 10px 0",
        }}>
          Quick prompts
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleAsk(s)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                lineHeight: 1.4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,58,237,0.15)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)";
                e.currentTarget.style.color = "#a78bfa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Custom question */}
      <div>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          margin: "0 0 10px 0",
        }}>
          Ask anything
        </p>
        <textarea
          rows={3}
          placeholder="Describe your architecture and ask a question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              void handleAsk();
            }
          }}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "none",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "10px",
            padding: "10px 12px",
            color: "rgba(255,255,255,0.85)",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            lineHeight: 1.5,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
        />
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          color: "rgba(255,255,255,0.2)",
          margin: "4px 0 0 0",
        }}>
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
            ? "rgba(124,58,237,0.2)"
            : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          color: loading ? "rgba(167,139,250,0.6)" : "#fff",
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
        {loading ? (
          <>
            <LoadingSpinner />
            Analysing…
          </>
        ) : (
          "Ask AI →"
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "8px",
          padding: "10px 12px",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "#f87171",
          lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#a78bfa",
            margin: "0 0 10px 0",
          }}>
            AI Response
          </p>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.7,
            margin: 0,
            whiteSpace: "pre-wrap",
          }}>
            {response}
          </p>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
