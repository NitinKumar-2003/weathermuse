import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setSoundEnabled } from "../utils/soundManager";

export default function SoundToggle() {
  const [on, setOn] = useState(
    () => JSON.parse(localStorage.getItem("weathermuse:sound")) ?? true
  );

  // 🔊 Sync sound + storage
  useEffect(() => {
    localStorage.setItem("weathermuse:sound", JSON.stringify(on));
    setSoundEnabled(on);
  }, [on]);

  // 🔄 Cross-tab sync
  useEffect(() => {
    const syncState = (e) => {
      if (e.key === "weathermuse:sound" && e.newValue !== null) {
        setOn(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, []);

  // ✨ Animation variants
  const iconVariants = {
    initial: { opacity: 0, y: 8, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -8, scale: 0.9, transition: { duration: 0.2 } },
  };

  const labelVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, delay: 0.05 } },
    exit: { opacity: 0, y: -5, transition: { duration: 0.15 } },
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => setOn((v) => !v)}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center justify-center gap-2 overflow-hidden
                  rounded-2xl px-5 py-2.5 border shadow-md backdrop-blur-xl transition-all
                  ${
                    on
                      ? "border-white/40 bg-white/10 hover:bg-white/20 text-white"
                      : "border-white/20 bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
      title="Toggle sound effects"
    >
      {/* Soft glow when sound is ON */}
      <AnimatePresence>
        {on && (
          <motion.span
            key="glow"
            layoutId="soundGlow"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl bg-white/20 blur-md"
          />
        )}
      </AnimatePresence>

      {/* 🔊 / 🔇 Icon */}
      <AnimatePresence mode="wait" initial={false}>
        {on ? (
          <motion.span
            key="on-icon"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 text-lg"
          >
            🔊
          </motion.span>
        ) : (
          <motion.span
            key="off-icon"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 text-lg"
          >
            🔇
          </motion.span>
        )}
      </AnimatePresence>

      {/* Label */}
      <AnimatePresence mode="wait" initial={false}>
        {on ? (
          <motion.span
            key="on-label"
            variants={labelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 font-medium text-sm tracking-wide"
          >
            Sound On
          </motion.span>
        ) : (
          <motion.span
            key="off-label"
            variants={labelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 font-medium text-sm tracking-wide"
          >
            Sound Off
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
