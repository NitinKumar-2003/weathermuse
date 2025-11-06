import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function EarthOrbit({ timezoneOffset = 0 }) {
  const [sunAngle, setSunAngle] = useState(0);
  const [moonAngle, setMoonAngle] = useState(180);

  useEffect(() => {
    const updateAngles = () => {
      const nowUTC = new Date(Date.now() + timezoneOffset * 1000);
      const hours = nowUTC.getUTCHours() + nowUTC.getUTCMinutes() / 60;

      const sunDeg = (hours / 24) * 360;
      const moonDeg = (sunDeg + 180 + hours * 0.5) % 360;

      setSunAngle(sunDeg);
      setMoonAngle(moonDeg);
    };

    updateAngles();
    const interval = setInterval(updateAngles, 30000);
    return () => clearInterval(interval);
  }, [timezoneOffset]);

  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center mx-auto">
      {/* 🌍 White 3D-like sphere outline */}
      <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/40 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]" />
      <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/20 blur-[2px]" />

      {/* ☀️ Sun orbit */}
      <motion.div
        animate={{ rotate: sunAngle }}
        transition={{ duration: 2, ease: "linear" }}
        className="absolute w-full h-full flex items-start justify-center"
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(255,255,100,0.8)] translate-y-3" />
      </motion.div>

      {/* 🌙 Moon orbit */}
      <motion.div
        animate={{ rotate: moonAngle }}
        transition={{ duration: 2, ease: "linear" }}
        className="absolute w-full h-full flex items-start justify-center"
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-300 shadow-[0_0_8px_rgba(200,200,255,0.7)] translate-y-3.5" />
      </motion.div>

      {/* ✨ Center glow */}
      <div className="absolute w-6 h-6 bg-white/10 rounded-full blur-md" />
    </div>
  );
}
