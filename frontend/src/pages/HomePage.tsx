import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const MESSAGES = ["Are you here?", "Yes, I am.", "Let's design."];

function TypingMessages() {
  const messagesRef = useRef(MESSAGES);
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentMessage = messagesRef.current[messageIndex];
    const speed = isDeleting ? 50 : 100;

    if (!isDeleting && displayText === currentMessage) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && displayText === "") {
      const stepTimer = setTimeout(() => {
        setIsDeleting(false);
        setMessageIndex((prev) => (prev + 1) % messagesRef.current.length);
      }, speed);
      return () => clearTimeout(stepTimer);
    }

    const typeTimer = setTimeout(() => {
      setDisplayText((prev) =>
        isDeleting ? prev.slice(0, -1) : currentMessage.slice(0, prev.length + 1),
      );
    }, speed);
    return () => clearTimeout(typeTimer);
  }, [displayText, isDeleting, messageIndex]);

  return (
    <div className="absolute bottom-[23%] left-[48.5%] z-30 flex h-[80px] w-[140px] -translate-x-1/2 flex-col items-center justify-center overflow-hidden text-center sm:w-[160px] md:bottom-[24%] md:w-[180px] lg:bottom-[23%]">
      <span className="[font-family:var(--font-nokia)] text-[12px] leading-tight text-[#2A3616] sm:text-[16px]">
        {displayText}
      </span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="mt-1 inline-block h-3 w-1.5 shrink-0 bg-[#2A3616]"
      />
    </div>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

export function ContactSection() {
  return (
    <section
      id="contact"
      style={{
        padding: "100px 24px",
        background:
          "linear-gradient(180deg, rgba(236,245,251,0.94) 0%, rgba(220,236,246,0.92) 42%, rgba(236,230,209,0.90) 100%)",
        color: "#1a1a1a",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "60px", alignItems: "center" }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 style={{ fontFamily: "var(--font-instrument)", fontSize: "clamp(32px, 5vw, 56px)", marginBottom: "24px", lineHeight: 1.1 }}>
            Let's build something<br /><span style={{ color: "#7c3aed" }}>great together.</span>
          </h2>
          <p style={{ color: "rgba(26,26,26,0.72)", fontSize: "18px", lineHeight: 1.6, marginBottom: "32px" }}>
            Questions, partnerships, or just want to say hi? We'd love to hear from you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(8,113,231,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0871E7" }}>📍</div>
              <span>San Francisco, CA</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(8,113,231,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0871E7" }}>✉️</div>
              <span>hello@smartarch.com</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            background: "rgba(255,255,255,0.55)",
            padding: "40px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.62)",
            boxShadow: "0 20px 50px rgba(16,35,58,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <input type="text" placeholder="Name" required style={inputStyle} />
              <input type="email" placeholder="Email" required style={inputStyle} />
            </div>
            <input type="text" placeholder="Subject" required style={inputStyle} />
            <textarea placeholder="Message" rows={4} required style={{ ...inputStyle, resize: "none" }} />
            <button type="submit" style={submitStyle}>Send Message</button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(26,26,26,0.12)",
  borderRadius: "12px",
  padding: "14px 16px",
  color: "#1a1a1a",
  fontFamily: "var(--font-sans)",
  fontSize: "15px",
  outline: "none",
  transition: "border-color 0.2s",
};

const submitStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0871E7 0%, #0B5FCC 100%)",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "16px",
  fontFamily: "var(--font-sans)",
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ background: "#F3F4ED" }}>
      <section className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-[#F3F4ED] pt-32 pb-24 text-center md:pt-36">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-center"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4"
          />
          <div className="absolute inset-0 bg-white/5" />
        </div>

        <TypingMessages />

        <div className="absolute left-1/2 top-[18%] z-20 w-full -translate-x-1/2 px-4 text-center pointer-events-none md:top-[20%]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-instrument mx-auto mb-6 max-w-[95vw] text-[56px] leading-[0.9] tracking-tight text-[#1a1a1a] md:max-w-[1000px] md:text-[84px] lg:max-w-[1200px] lg:text-[116px]"
          >
            Your vision,
            <br />
            our digital reality.
          </motion.div>

        </div>
      </section>

      <ContactSection />

      {/* ── Footer ── */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <p style={{ color: "rgba(241,245,249,0.3)", fontSize: "14px" }}>
          © {new Date().getFullYear()} SmartArch Board. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
