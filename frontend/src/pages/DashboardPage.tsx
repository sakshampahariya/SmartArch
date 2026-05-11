import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "../services/supabase";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "recently";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Board = {
  id: string;
  name: string;
  created_at: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Board state
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBoards = useCallback(async () => {
    if (!session?.user) return;
    setLoadingBoards(true);
    const { data, error } = await supabase
      .from("boards")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Could not load boards.");
    } else {
      setBoards(data || []);
    }
    setLoadingBoards(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchBoards();
    }
  }, [session, fetchBoards]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the login link or just try logging in if auto-confirm is enabled!");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!session?.user) return;
    const name = newName.trim() || "Untitled Board";
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("boards")
        .insert([{ name, created_by: session.user.id }])
        .select()
        .single();
      
      if (error) throw error;
      if (data) {
        setBoards((prev) => [data, ...prev]);
        setShowCreate(false);
        setNewName("");
        navigate(`/board/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create board.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this board?")) return;
    try {
      const { error } = await supabase.from("boards").delete().eq("id", id);
      if (error) throw error;
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Failed to delete board.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) {
    return <div style={{ minHeight: "100dvh", background: "#F3F4ED", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  }

  if (!session) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#F3F4ED",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "var(--font-instrument)", fontSize: "32px", margin: "0 0 8px 0", color: "#1a1a1a" }}>smartarch</h1>
            <p style={{ margin: 0, color: "rgba(26,26,26,0.6)", fontSize: "14px" }}>
              {isSignUp ? "Create your account" : "Welcome back to your boards"}
            </p>
          </div>

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(26,26,26,0.1)",
                outline: "none",
                fontSize: "14px",
                background: "#F8F9F5",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(26,26,26,0.1)",
                outline: "none",
                fontSize: "14px",
                background: "#F8F9F5",
              }}
            />
            {authError && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{authError}</p>}
            
            <button
              type="submit"
              disabled={authLoading}
              style={{
                background: "#00BD7D",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: authLoading ? "not-allowed" : "pointer",
                marginTop: "8px",
                opacity: authLoading ? 0.7 : 1,
              }}
            >
              {authLoading ? "Please wait..." : (isSignUp ? "Sign Up" : "Log In")}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "rgba(26,26,26,0.6)" }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: "none",
                border: "none",
                color: "#00BD7D",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#F3F4ED",
      fontFamily: "var(--font-sans)",
      paddingTop: "80px",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px 0",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}
        >
          <div>
            <h1 style={{
              fontFamily: "var(--font-instrument)",
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.1,
            }}>
              Your Boards
            </h1>
            <p style={{ color: "rgba(26,26,26,0.6)", fontSize: "14px", margin: "8px 0 0" }}>
              {session.user.email} &bull; <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}>Log out</button>
            </p>
          </div>

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: "#00BD7D",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0, 189, 125, 0.25)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Board
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowCreate(false);
                }}
                placeholder="Board name..."
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(26,26,26,0.15)",
                  background: "#fff",
                  outline: "none",
                  fontSize: "15px",
                  fontFamily: "var(--font-sans)",
                }}
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  padding: "0 20px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: creating ? "default" : "pointer",
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? "..." : "Create"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: "transparent",
                  color: "rgba(26,26,26,0.6)",
                  border: "none",
                  padding: "0 12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </motion.div>

        {error && (
          <div style={{ padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "24px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Board Grid */}
        {loadingBoards ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "200px", background: "rgba(26,26,26,0.03)", borderRadius: "16px", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "rgba(26,26,26,0.02)",
            borderRadius: "24px",
            border: "1px dashed rgba(26,26,26,0.1)",
          }}>
            <div style={{
              width: "64px", height: "64px", background: "rgba(0,189,125,0.1)", color: "#00BD7D", borderRadius: "20px",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: "18px", margin: "0 0 8px 0", color: "#1a1a1a" }}>No boards yet</h3>
            <p style={{ margin: 0, color: "rgba(26,26,26,0.5)", fontSize: "15px" }}>Create your first board to start collaborating.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {boards.map((board, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "200px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  border: "1px solid rgba(26,26,26,0.04)",
                  position: "relative",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.02)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      fontFamily: "var(--font-sans)",
                    }}>
                      {board.name}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(board.id, e)}
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "none",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
                      className="delete-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(26,26,26,0.06)", paddingTop: "16px", marginTop: "auto" }}>
                  <span style={{ fontSize: "13px", color: "rgba(26,26,26,0.5)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {timeAgo(board.created_at)}
                  </span>
                </div>
                
                {/* Global style to show delete button on hover */}
                <style>{`
                  div:hover > div > div > .delete-btn {
                    opacity: 1 !important;
                  }
                `}</style>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
