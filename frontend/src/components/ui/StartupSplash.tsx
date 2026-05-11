import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StartupSplashProps {
  onComplete: () => void;
  playSound: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({ onComplete, playSound }) => {
  const [phase, setPhase] = useState<"enter" | "touch" | "ripple" | "text" | "hold" | "exit">("enter");

  useEffect(() => {
    // Phase 1 is initial state
    
    // Phase 2: Touch at 700ms
    const tTouch = setTimeout(() => {
      setPhase("touch");
      playSound(); // Trigger sound exactly at 700ms
    }, 700);

    // Phase 3: Ripples at 900ms
    const tRipple = setTimeout(() => setPhase("ripple"), 900);

    // Phase 4: Text at 1400ms
    const tText = setTimeout(() => setPhase("text"), 1400);

    // Phase 5: Hold at 2000ms
    const tHold = setTimeout(() => setPhase("hold"), 2000);

    // Phase 6: Exit at 2800ms
    const tExit = setTimeout(() => setPhase("exit"), 2800);

    // Final complete at 3200ms
    const tComplete = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(tTouch);
      clearTimeout(tRipple);
      clearTimeout(tText);
      clearTimeout(tHold);
      clearTimeout(tExit);
      clearTimeout(tComplete);
    };
  }, [onComplete, playSound]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      overflow: "hidden",
      background: "linear-gradient(180deg, #0A0E1A 0%, #0D1B2A 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: phase === "exit" ? 0 : 1,
      transition: "opacity 400ms ease-out",
    }}>
      {/* Radial Glow */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(0, 189, 125, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Dot Grid Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        pointerEvents: "none",
      }} />

      {/* Hands Container */}
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "300px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        transform: "translateY(-10%)",
      }}>
        
        {/* Adult Left Hand */}
        <motion.div
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ 
            x: phase === "enter" ? "-70px" : (phase === "touch" ? "-66px" : "-70px"),
            opacity: 1 
          }}
          transition={{ 
            x: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: { duration: 0.4 }
          }}
          style={{ 
            position: "absolute",
            left: "calc(50% - 70px)",
            transform: "translateX(-100%)",
            filter: phase !== "enter" ? "drop-shadow(0 0 12px rgba(255,255,255,0.4))" : "none",
          }}
        >
          <AdultHand />
        </motion.div>

        {/* Child Right Hand */}
        <motion.div
          initial={{ x: "120%", opacity: 0 }}
          animate={{ 
            x: phase === "enter" ? "70px" : (phase === "touch" ? "66px" : "70px"),
            opacity: 1 
          }}
          transition={{ 
            x: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: { duration: 0.4 }
          }}
          style={{ 
            position: "absolute",
            right: "calc(50% - 70px)",
            transform: "translateX(100%)",
            filter: phase !== "enter" ? "drop-shadow(0 0 12px rgba(255,255,255,0.4))" : "none",
          }}
        >
          <ChildHand />
        </motion.div>

        {/* Spark at meeting point */}
        {phase === "touch" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              width: "8px",
              height: "8px",
              background: "#fff",
              borderRadius: "50%",
              zIndex: 10,
              boxShadow: "0 0 15px #fff",
            }}
          />
        )}

        {/* Ripples */}
        {(phase === "ripple" || phase === "text" || phase === "hold") && (
          <div style={{ position: "absolute", zIndex: 1 }}>
             <Ripple delay={0} />
             <Ripple delay={0.15} />
             <Ripple delay={0.3} />
          </div>
        )}
      </div>

      {/* Logo & Text Container */}
      <div style={{ 
        position: "absolute", 
        bottom: "22%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}>
        {(phase === "text" || phase === "hold") && (
          <>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: "32px",
                color: "#FFFFFF",
                letterSpacing: "0.15em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              SmartArch Board
            </motion.h1>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                color: "#00BD7D",
                letterSpacing: "0.3em",
                margin: 0,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Connecting Architects
            </motion.p>

            {/* Underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
              style={{
                width: "120px",
                height: "1px",
                background: "#00BD7D",
                transformOrigin: "center",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

function AdultHand() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <path
        d="M0 75 C 20 90, 60 95, 80 90 L 108 78 C 106 65, 108 45, 118 65 L 115 28 C 112 10, 98 10, 95 28 L 90 68 C 88 55, 90 35, 100 60 L 98 18 C 95 2, 78 2, 75 18 L 68 65 C 65 50, 70 30, 80 55 L 78 15 C 75 0, 58 0, 55 15 L 40 60 C 35 40, 40 20, 55 25 L 50 5 C 30 0, 10 20, 0 60 Z"
        fill="#F0EBE0"
        style={{ filter: "drop-shadow(inset 0 1px 2px rgba(0,0,0,0.1))" }}
      />
    </svg>
  );
}

function ChildHand() {
  return (
    <svg width="90" height="75" viewBox="0 0 120 100" fill="none" style={{ transform: "scaleX(-1)" }}>
      <path
        d="M0 75 C 20 90, 60 95, 80 90 L 108 78 C 106 65, 108 45, 118 65 L 115 28 C 112 10, 98 10, 95 28 L 90 68 C 88 55, 90 35, 100 60 L 98 18 C 95 2, 78 2, 75 18 L 68 65 C 65 50, 70 30, 80 55 L 78 15 C 75 0, 58 0, 55 15 L 40 60 C 35 40, 40 20, 55 25 L 50 5 C 30 0, 10 20, 0 60 Z"
        fill="#EDE8DD"
        style={{ filter: "drop-shadow(inset 0 1px 2px rgba(0,0,0,0.1))" }}
      />
    </svg>
  );
}

function Ripple({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: [1, 0] }}
      transition={{ 
        duration: 0.8, 
        delay, 
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "240px",
        height: "240px",
        marginLeft: "-120px",
        marginTop: "-120px",
        border: "1.5px solid #00BD7D",
        borderRadius: "50%",
        pointerEvents: "none",
      }}
    />
  );
}
