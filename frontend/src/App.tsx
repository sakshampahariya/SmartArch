import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BoardPage from "./pages/BoardPage";
import DashboardPage from "./pages/DashboardPage";
import { StartupSplash } from "./components/ui/StartupSplash";
import { supabase } from "./services/supabase";
import type { Session } from "@supabase/supabase-js";

// Protected route – redirects to /dashboard (which shows login) if not authed
function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppInner({ session }: { session: Session | null }) {
  const location = useLocation();
  const isBoardPage = location.pathname.startsWith("/board");
  const hideNav = isBoardPage;
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Show splash only on very first load
  useEffect(() => {
    if (!splashDone && !sessionStorage.getItem("sa_splash_shown")) {
      setShowSplash(true);
    }
  }, [splashDone]);

  const playSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      const tempo = 0.15;
      playNote(659.25, now + tempo * 0, 0.1); playNote(587.33, now + tempo * 1, 0.1);
      playNote(369.99, now + tempo * 2, 0.2); playNote(415.30, now + tempo * 4, 0.2);
      playNote(554.37, now + tempo * 6, 0.1); playNote(493.88, now + tempo * 7, 0.1);
      playNote(293.66, now + tempo * 8, 0.2); playNote(329.63, now + tempo * 10, 0.2);
      playNote(493.88, now + tempo * 12, 0.1); playNote(440.00, now + tempo * 13, 0.1);
      playNote(277.18, now + tempo * 14, 0.2); playNote(329.63, now + tempo * 16, 0.2);
      playNote(440.00, now + tempo * 18, 0.4);
    } catch (e) {}
  };

  const onSplashComplete = () => {
    sessionStorage.setItem("sa_splash_shown", "1");
    setShowSplash(false);
    setSplashDone(true);
  };

  return (
    <>
      {showSplash && <StartupSplash onComplete={onSplashComplete} playSound={playSound} />}
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/board/:roomId"
          element={
            <ProtectedRoute session={session}>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board"
          element={
            <ProtectedRoute session={session}>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "#F3F4ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(0,189,125,0.2)", borderTopColor: "#00BD7D", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppInner session={session} />
    </BrowserRouter>
  );
}
