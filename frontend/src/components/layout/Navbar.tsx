import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Contact Us", to: "/#contact" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleContactUs = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname === "/") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(95%, 1100px)",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <nav
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          borderRadius: "9999px",
          border: "1px solid rgba(0,0,0,0.10)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo */}
        <NavLink
          to="/"
          style={{
            fontFamily: "var(--font-instrument)",
            fontSize: "clamp(20px, 2.5vw, 26px)",
            letterSpacing: "-0.03em",
            color: "#1a1a1a",
            lineHeight: 1,
            userSelect: "none",
            textDecoration: "none",
            fontWeight: 400,
          }}
        >
          smartarch
        </NavLink>

        {/* Desktop links */}
        <ul
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(20px, 2.5vw, 36px)",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
          className="hidden md:flex"
        >
          {NAV_LINKS.map(({ label, to }) => {
            if (label === "Contact Us") {
              return (
                <li key={label}>
                  <a
                    href="#contact"
                    onClick={handleContactUs}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      color: "#1a1a1a",
                      textDecoration: "none",
                      paddingBottom: "2px",
                      opacity: 0.75,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {label}
                  </a>
                </li>
              );
            }
            return (
              <li key={label}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  style={({ isActive }) => ({
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    textDecoration: "none",
                    paddingBottom: "3px",
                    borderBottom: isActive
                      ? "1.5px solid #7c3aed"
                      : "1.5px solid transparent",
                    opacity: isActive ? 1 : 0.75,
                    transition: "opacity 0.2s, border-color 0.2s",
                    fontWeight: isActive ? 500 : 400,
                  })}
                >
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Right CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  color: "#1a1a1a",
                  textDecoration: "none",
                  opacity: 0.75,
                  padding: "8px 14px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(0,0,0,0.10)",
                  transition: "opacity 0.2s",
                }}
              >
                Dashboard
              </NavLink>
              <button
                onClick={handleLogout}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  color: "rgba(26,26,26,0.55)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 4px",
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink
              to="/dashboard"
              style={{
                position: "relative",
                background: "#7c3aed",
                borderRadius: "9999px",
                padding: "8px 22px",
                border: "none",
                cursor: "pointer",
                boxShadow: "inset 0 -4px 4px rgba(255,255,255,0.20)",
                outline: "1px solid #7c3aed",
                outlineOffset: "-1px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {/* Top glint */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: "10%",
                  top: "1px",
                  width: "80%",
                  height: "14px",
                  borderRadius: "12px",
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
                  pointerEvents: "none",
                }}
              />
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#fff",
                }}
              >
                Sign up
              </span>
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}
