import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "../App";

const USPs = [
  {
    icon: "🧠",
    title: "AI-Powered Suggestions",
    desc: "Get intelligent design suggestions as you draw. SmartArch Board analyses your canvas in real time and offers layout improvements.",
  },
  {
    icon: "⚡",
    title: "Real-Time Collaboration",
    desc: "Work alongside your entire team simultaneously. Every stroke, shape, and annotation syncs instantly via WebSocket technology.",
  },
  {
    icon: "🎨",
    title: "Rich Design Tools",
    desc: "From freehand sketches to precise shapes, sticky notes to connector lines — a full toolkit built on Fabric.js for pixel-perfect control.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "Role-based access control keeps admin and member workspaces separated. Your architectural plans stay exactly where they should.",
  },
  {
    icon: "📱",
    title: "Works Everywhere",
    desc: "Fully responsive design means SmartArch Board is just as powerful on a tablet on-site as it is on a large desktop monitor.",
  },
  {
    icon: "🚀",
    title: "Built for Scale",
    desc: "Powered by a FastAPI backend and optimised WebSocket rooms, the board stays snappy whether you have 2 or 200 concurrent users.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create a Board",
    desc: "Open a named room and invite your team. No complex setup — just share the room link and start drawing.",
  },
  {
    step: "02",
    title: "Design Together",
    desc: "Use shapes, freehand tools, and text to lay out architectural ideas on a shared infinite canvas.",
  },
  {
    step: "03",
    title: "Get AI Feedback",
    desc: "Click the AI panel to receive instant structural suggestions based on your current layout.",
  },
  {
    step: "04",
    title: "Export & Ship",
    desc: "Save your board as JSON or screenshot and hand it off to engineering. From whiteboard to wireframe in minutes.",
  },
];

// Reusable section wrapper
function Section({
  children,
  bg = "linear-gradient(180deg, rgba(237,245,250,0.95) 0%, rgba(221,236,246,0.93) 52%, rgba(239,231,210,0.90) 100%)",
  style = {},
}: {
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        background: bg,
        padding: "clamp(60px, 10vw, 120px) clamp(16px, 6vw, 80px)",
        color: "#1a1a1a",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const user = getAuth();

  return (
    <div style={{ fontFamily: "var(--font-sans)", paddingTop: "80px", background: "#F3F4ED" }}>

      {/* ── Hero Banner ── */}
      <Section>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
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
            About SmartArch Board
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-instrument)",
              fontSize: "clamp(36px, 6vw, 68px)",
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              color: "#1a1a1a",
              marginBottom: "24px",
              marginTop: 0,
            }}
          >
            The collaborative canvas
            <br />
            for <span style={{ color: "#0871E7" }}>modern architects.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(15px, 1.8vw, 18px)",
              color: "rgba(26,26,26,0.68)",
              lineHeight: 1.7,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            SmartArch Board is an AI-enhanced, real-time whiteboard platform
            designed specifically for architectural teams. Sketch, collaborate,
            and ship — all in one place.
          </motion.p>
        </div>
      </Section>

      {/* ── What is it? (image + text) ── */}
      <Section>
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "clamp(32px, 6vw, 80px)",
            alignItems: "center",
          }}
        >
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#0871E7",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              What we built
            </p>
            <h2
              style={{
                fontFamily: "var(--font-instrument)",
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#1a1a1a",
                marginBottom: "18px",
                marginTop: 0,
              }}
            >
              A smarter way to design together.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                color: "rgba(26,26,26,0.72)",
                lineHeight: 1.75,
                marginBottom: "14px",
              }}
            >
              Traditional tools force architects to email screenshots or jump
              between disconnected apps. SmartArch Board brings everyone onto a
              single, live canvas — with AI assistance built right in.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                color: "rgba(26,26,26,0.72)",
                lineHeight: 1.75,
              }}
            >
              Built with <strong>React 19</strong>, <strong>Fabric.js</strong>,{" "}
              <strong>FastAPI</strong>, and <strong>WebSockets</strong>, the
              platform delivers sub-100ms sync between collaborators anywhere
              in the world.
            </p>
          </motion.div>

          {/* Image placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: "20px",
              overflow: "hidden",
              aspectRatio: "4/3",
              background: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(219,236,246,0.72) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 20px 40px rgba(15,36,58,0.12)",
            }}
          >
            <span style={{ fontSize: "56px" }}>🖊️</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "#0871E7",
                fontWeight: 500,
              }}
            >
              Live canvas preview
            </span>
          </motion.div>
        </div>
      </Section>

      {/* ── USPs ── */}
      <Section>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#0871E7",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              Why SmartArch Board
            </p>
            <h2
              style={{
                fontFamily: "var(--font-instrument)",
                fontSize: "clamp(28px, 4vw, 48px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Everything you need. Nothing you don't.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {USPs.map((usp, i) => (
              <motion.div
                key={usp.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  background: "rgba(255,255,255,0.48)",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  border: "1px solid rgba(255,255,255,0.72)",
                  boxShadow: "0 10px 30px rgba(15,36,58,0.08)",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "14px" }}>
                  {usp.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "8px",
                    marginTop: 0,
                  }}
                >
                  {usp.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    color: "rgba(26,26,26,0.68)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {usp.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── How it works ── */}
      <Section>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#0871E7",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontFamily: "var(--font-instrument)",
                fontSize: "clamp(28px, 4vw, 48px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              From zero to deployed in four steps.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
            }}
          >
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                style={{ textAlign: "center", padding: "8px" }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
                    color: "#fff",
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: "0 10px 20px rgba(8,113,231,0.24)",
                  }}
                >
                  {step.step}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "8px",
                    marginTop: 0,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    color: "rgba(26,26,26,0.68)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA Section ── */}
      <Section style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "clamp(32px, 5vw, 56px)", marginBottom: "24px" }}>Ready to design your next masterpiece?</h2>
        <button
          onClick={() => navigate(user ? "/dashboard" : "/signup")}
          style={{
            padding: "16px 40px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
            color: "#fff",
            fontSize: "18px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(8,113,231,0.24)",
          }}
        >
          {user ? "Go to Dashboard" : "Get Started Now"}
        </button>
      </Section>
    </div>
  );
}
