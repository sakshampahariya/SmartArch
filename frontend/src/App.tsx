import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import BoardPage from "./pages/BoardPage";
import DashboardPage from "./pages/DashboardPage";

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

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setAuth(email);
    navigate("/dashboard");
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
          <Link to="/signup" style={{ color: "#7c3aed", textDecoration: "none" }}>Sign up free</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    setAuth(email);
    navigate("/dashboard");
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
          <Link to="/login" style={{ color: "#7c3aed", textDecoration: "none" }}>Sign in</Link>
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
      background: "linear-gradient(135deg, #0a0a10 0%, #13131e 100%)",
      paddingTop: "80px",
    }}>
      <div style={{
        background: "#14141f",
        borderRadius: "20px",
        padding: "40px 36px",
        width: "min(90%, 420px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <Link to="/" style={{ fontFamily: "var(--font-instrument)", fontSize: "22px", color: "#f1f5f9", textDecoration: "none", display: "block", marginBottom: "24px" }}>
          smartarch
        </Link>
        <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "30px", letterSpacing: "-0.02em", color: "#f1f5f9", marginTop: 0, marginBottom: "6px" }}>
          {title}
        </h2>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "rgba(241,245,249,0.4)", marginBottom: "28px" }}>
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
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "10px",
        padding: "11px 14px",
        fontFamily: "var(--font-sans)",
        fontSize: "14px",
        color: "#f1f5f9",
        outline: "none",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
    />
  );
}

function AuthSubmitBtn({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" style={{
      background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      padding: "12px",
      fontFamily: "var(--font-sans)",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
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
  color: "rgba(241,245,249,0.35)",
  textAlign: "center",
};

function AppInner() {
  const location = useLocation();
  const isBoardPage = location.pathname.startsWith("/board");
  const hideNav = isBoardPage;

  const [, setTick] = useState(0);
  useEffect(() => {
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
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
