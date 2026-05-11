import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useState, useEffect } from "react";

const SERVICES = [
  {
    icon: "🖊️",
    title: "Collaborative Canvas",
    desc: "Infinite real-time whiteboard shared across your entire team. Draw, annotate, and ideate together without lag.",
    tags: ["Real-time", "Multi-user", "Infinite canvas"],
  },
  {
    icon: "🤖",
    title: "AI Design Suggestions",
    desc: "Paste your canvas JSON and receive structured architectural improvement suggestions powered by AI.",
    tags: ["AI-powered", "Layout hints", "Smart feedback"],
  },
  {
    icon: "🏗️",
    title: "Architecture Templates",
    desc: "Start with pre-built architectural diagrams — floor plans, system architecture, workflow diagrams — and customise freely.",
    tags: ["Templates", "Quick start", "Customisable"],
  },
  {
    icon: "🔗",
    title: "Shape & Connector Library",
    desc: "A full suite of shapes, connector lines, and arrows to accurately represent any architectural system.",
    tags: ["Shapes", "Connectors", "Arrows"],
  },
  {
    icon: "📝",
    title: "Sticky Notes & Annotations",
    desc: "Add colour-coded sticky notes, labels, and call-out boxes to keep context alongside your designs.",
    tags: ["Notes", "Annotations", "Labels"],
  },
  {
    icon: "📁",
    title: "Project Rooms",
    desc: "Organise your boards into named rooms. Invite team members, control access, and keep each project neatly separated.",
    tags: ["Rooms", "Access control", "Team"],
  },
  {
    icon: "📤",
    title: "Export & Share",
    desc: "Export your board as a JSON snapshot or screenshot and share it with stakeholders in seconds.",
    tags: ["Export", "Share", "Screenshot"],
  },
  {
    icon: "🛡️",
    title: "Role-Based Access",
    desc: "Admins manage members and rooms; members can draw and collaborate. Clean permission boundaries keep work safe.",
    tags: ["RBAC", "Admin", "Permissions"],
  },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleServiceClick = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", paddingTop: "80px", background: "#F3F4ED", color: "#1a1a1a" }}>
      {/* ── Header ── */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(237,245,250,0.95) 0%, rgba(221,236,246,0.93) 52%, rgba(239,231,210,0.90) 100%)",
          padding: "clamp(60px, 10vw, 100px) clamp(16px, 6vw, 80px)",
          textAlign: "center",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#0871E7",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          What's included
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "var(--font-instrument)",
            fontSize: "clamp(36px, 6vw, 68px)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: "#1a1a1a",
            marginBottom: "20px",
            marginTop: 0,
          }}
        >
          Services & <span style={{ color: "#0871E7" }}>Features</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(26,26,26,0.68)",
            lineHeight: 1.7,
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          Explore the tools designed to empower your architectural workflow. From real-time collaboration to AI-driven insights.
        </motion.p>
      </section>

      {/* ── Service Cards Grid ── */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(237,245,250,0.90) 0%, rgba(221,236,246,0.88) 45%, rgba(239,231,210,0.86) 100%)",
          padding: "clamp(48px, 8vw, 100px) clamp(16px, 6vw, 80px)",
        }}
      >
        <div
          style={{
            maxWidth: "1040px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={handleServiceClick}
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.72)",
                borderRadius: "20px",
                padding: "28px 24px",
                cursor: "pointer",
                transition: "all 0.25s",
                boxShadow: "0 8px 24px rgba(15,36,58,0.1)",
              }}
              whileHover={{
                y: -8,
                borderColor: "rgba(8,113,231,0.3)",
                boxShadow: "0 20px 40px rgba(15,36,58,0.14)",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "rgba(8,113,231,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  marginBottom: "18px",
                  color: "#0871E7",
                }}
              >
                {svc.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "10px",
                  marginTop: 0,
                }}
              >
                {svc.title}
              </h3>

              {/* Desc */}
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  color: "rgba(26,26,26,0.68)",
                  lineHeight: 1.65,
                  marginBottom: "18px",
                  marginTop: 0,
                }}
              >
                {svc.desc}
              </p>

              {/* Tags */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {svc.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#0871E7",
                      background: "rgba(8,113,231,0.12)",
                      borderRadius: "9999px",
                      padding: "3px 10px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA section ── */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(214,233,245,0.9) 0%, rgba(236,229,206,0.9) 100%)",
          padding: "80px 24px",
          textAlign: "center",
          margin: "0 24px 60px",
          borderRadius: "32px",
          boxShadow: "0 20px 50px rgba(15,36,58,0.12)",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "clamp(28px, 4vw, 48px)", color: "#1a1a1a", marginBottom: "20px" }}>Ready to start designing?</h2>
        <button
          onClick={() => navigate(user ? "/dashboard" : "/signup")}
          style={{
            background: "#0871E7",
            color: "#fff",
            padding: "16px 40px",
            borderRadius: "9999px",
            fontSize: "18px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {user ? "Go to Dashboard" : "Create Free Account"}
        </button>
      </section>
    </div>
  );
}
