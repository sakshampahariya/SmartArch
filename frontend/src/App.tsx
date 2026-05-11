import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BoardPage from "./pages/BoardPage";
import DashboardPage from "./pages/DashboardPage";
import { StartupSplash } from "./components/ui/StartupSplash";

function setAuth(email: string) {
  localStorage.setItem("sa_user", JSON.stringify({ email, name: email.split("@")[0] }));
}
export function getAuth(): { email: string; name: string } | null {
  try {
    const raw = localStorage.getItem("sa_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setAuth(email);
    onLogin();
  };

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to your SmartArch Board account."
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && <p style={errorStyle}>{error}</p>}
        <AuthInput type="email" placeholder="Email address" value={email} onChange={setEmail} required />
        <AuthInput type="password" placeholder="Password" value={password} onChange={setPassword} required />
        <AuthSubmitBtn>Sign in →</AuthSubmitBtn>
        <p style={authLinkStyle}>
          No account?{" "}
          <Link to="/signup" style={{ color: "#0871E7", textDecoration: "none" }}>Sign up free</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function SignupPage({ onSignup }: { onSignup: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    setAuth(email);
    onSignup();
  };

  return (
    <AuthLayout
      title="Create an account."
      subtitle="Join SmartArch Board and start designing."
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && <p style={errorStyle}>{error}</p>}
        <AuthInput type="text" placeholder="Full name" value={name} onChange={setName} required />
        <AuthInput type="email" placeholder="Email address" value={email} onChange={setEmail} required />
        <AuthInput type="password" placeholder="Create password" value={password} onChange={setPassword} required />
        <AuthSubmitBtn>Sign up →</AuthSubmitBtn>
        <p style={authLinkStyle}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0871E7", textDecoration: "none" }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      background: "#F3F4ED",
      paddingTop: "80px",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(8px)",
        borderRadius: "20px",
        padding: "40px 36px",
        width: "min(90%, 420px)",
        boxShadow: "0 20px 50px rgba(16,35,58,0.12)",
        border: "1px solid rgba(255,255,255,0.62)",
      }}>
        <Link to="/" style={{ fontFamily: "var(--font-instrument)", fontSize: "22px", color: "#1a1a1a", textDecoration: "none", display: "block", marginBottom: "24px" }}>
          smartarch
        </Link>
        <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "30px", letterSpacing: "-0.02em", color: "#1a1a1a", marginTop: 0, marginBottom: "6px" }}>
          {title}
        </h2>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "rgba(26,26,26,0.6)", marginBottom: "28px" }}>
          {subtitle}
        </p>
        {children}
      </div>
    </div>
  );
}

function AuthInput({ type, placeholder, value, onChange, required }: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(26,26,26,0.12)",
        borderRadius: "10px",
        padding: "11px 14px",
        fontFamily: "var(--font-sans)",
        fontSize: "14px",
        color: "#1a1a1a",
        outline: "none",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(8,113,231,0.6)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(26,26,26,0.12)")}
    />
  );
}

function AuthSubmitBtn({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" style={{
      background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      padding: "12px",
      fontFamily: "var(--font-sans)",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 4px 20px rgba(8,113,231,0.35)",
      transition: "opacity 0.2s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

const errorStyle: React.CSSProperties = {
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#f87171",
  fontSize: "13px",
};

const authLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "13px",
  color: "rgba(26,26,26,0.6)",
  textAlign: "center",
};

function AppInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const isBoardPage = location.pathname.startsWith("/board");
  const hideNav = isBoardPage;
  const [showSplash, setShowSplash] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

  const handleStartApp = (path: string) => {
    setPendingPath(path);
    setShowSplash(true);
  };

  const onSplashComplete = () => {
    setShowSplash(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  return (
    <>
      {showSplash && <StartupSplash onComplete={onSplashComplete} playSound={playSound} />}
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/login" element={<LoginPage onLogin={() => handleStartApp("/dashboard")} />} />
        <Route path="/signup" element={<SignupPage onSignup={() => handleStartApp("/dashboard")} />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/board/:roomId" element={<BoardPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
