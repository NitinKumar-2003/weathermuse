import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setSoundEnabled } from "../utils/soundManager";
import { Volume2, VolumeX } from "lucide-react";

export default function SoundToggle({ compact = false }) {
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

  // ✨ Animations
  const iconVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  // 🎛 Compact version (icon only, small square)
  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOn((v) => !v)}
        className="relative flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl transition"
        style={{
          width: 36,
          height: 36,
        }}
        title={on ? "Mute sound" : "Unmute sound"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {on ? (
            <motion.span
              key="on"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Volume2 size={18} className="text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="off"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <VolumeX size={18} className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // 🧩 Default (desktop) full version
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => setOn((v) => !v)}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-2.5 border shadow-md backdrop-blur-xl transition-all ${
        on
          ? "border-white/40 bg-white/10 hover:bg-white/20 text-white"
          : "border-white/20 bg-white/5 hover:bg-white/10 text-white/70"
      }`}
      title="Toggle sound effects"
    >
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
            <Volume2 size={18} className="text-white" />
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
            <VolumeX size={18} className="text-white/80" />
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {on ? (
          <motion.span
            key="on-label"
            variants={iconVariants}
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
            variants={iconVariants}
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
