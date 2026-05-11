import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NokiaSplashProps {
  onComplete: () => void;
}

export const NokiaSplash: React.FC<NokiaSplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Play sound
    playNokiaTune();

    // Auto complete after 4 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Allow fade out
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(135deg, #9dad8f 0%, #8b9d7e 100%)", // Authentic greenish LCD
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            fontFamily: "'Nokia Cellphone FC Small', sans-serif",
          }}
        >
          {/* Scanlines Overlay for Retro Feel */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)",
            pointerEvents: "none",
            zIndex: 10,
          }} />
          
          {/* Vignette */}
          <div style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 150px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            zIndex: 11,
          }} />

          {/* Hands Animation Container */}
          <div style={{ position: "relative", width: "400px", height: "250px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Top Left Hand */}
            <motion.div
              initial={{ x: -300, y: -150, opacity: 0 }}
              animate={{ x: -20, y: -10, opacity: 1 }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ position: "absolute", zIndex: 5 }}
            >
              <DetailedHand side="left" />
            </motion.div>

            {/* Bottom Right Hand */}
            <motion.div
              initial={{ x: 300, y: 150, opacity: 0 }}
              animate={{ x: 20, y: 10, opacity: 1 }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ position: "absolute", zIndex: 5 }}
            >
              <DetailedHand side="right" />
            </motion.div>
            
            {/* Subtle shake on impact */}
            <motion.div
              animate={{ x: [0, -1, 1, -1, 1, 0] }}
              transition={{ delay: 2.4, duration: 0.3 }}
              style={{ position: "absolute", width: "100%", height: "100%" }}
            />
          </div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
            style={{
              marginTop: "40px",
              fontSize: "24px",
              color: "#2a3b2a",
              letterSpacing: "4px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            SmartArch
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 3 }}
            style={{
              position: "absolute",
              bottom: "40px",
              fontSize: "10px",
              color: "#2a3b2a",
            }}
          >
            Connecting People...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function DetailedHand({ side }: { side: "left" | "right" }) {
  const rotation = side === "left" ? "25deg" : "205deg";
  const scale = side === "left" ? "1.2" : "1";
  
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" style={{ 
      transform: `rotate(${rotation}) scale(${scale})`,
      filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.1))" 
    }}>
      {/* More detailed pixel-art style hand silhouette */}
      <path
        d="M20,60 C40,55 60,50 80,52 C100,54 130,60 140,70 C150,80 145,95 130,100 C110,105 80,100 60,90 C40,80 20,60 20,60 Z"
        fill="#2a3b2a"
      />
      {/* Thumb */}
      <path
        d="M65,55 C75,45 90,40 105,45 C115,50 115,60 105,65 L85,65"
        fill="#2a3b2a"
      />
      {/* Fingers Detail */}
      <path d="M110,58 L145,68" stroke="#9dad8f" strokeWidth="1" />
      <path d="M112,65 L148,75" stroke="#9dad8f" strokeWidth="1" />
      <path d="M110,72 L142,82" stroke="#9dad8f" strokeWidth="1" />
    </svg>
  );
}

// Synthetic Nokia-esque tune using Web Audio API
function playNokiaTune() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "square"; // Retro 8-bit sound
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Nokia Tune sequence (simplified but recognizable cadence)
    // E5, D5, F#4, G#4, C#5, B4, D4, E4, B4, A4, C#4, E4, A4
    const tempo = 0.15;
    playNote(659.25, now + tempo * 0, 0.1); // E5
    playNote(587.33, now + tempo * 1, 0.1); // D5
    playNote(369.99, now + tempo * 2, 0.2); // F#4
    playNote(415.30, now + tempo * 4, 0.2); // G#4
    
    playNote(554.37, now + tempo * 6, 0.1); // C#5
    playNote(493.88, now + tempo * 7, 0.1); // B4
    playNote(293.66, now + tempo * 8, 0.2); // D4
    playNote(329.63, now + tempo * 10, 0.2); // E4
    
    playNote(493.88, now + tempo * 12, 0.1); // B4
    playNote(440.00, now + tempo * 13, 0.1); // A4
    playNote(277.18, now + tempo * 14, 0.2); // C#4
    playNote(329.63, now + tempo * 16, 0.2); // E4
    playNote(440.00, now + tempo * 18, 0.4); // A4 (final long note)

  } catch (e) {
    console.warn("Audio Context failed to start:", e);
  }
}
