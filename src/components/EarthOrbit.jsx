import { useEffect, useState } from "react";

export default function EarthOrbit({
  timezoneOffset = 0,
  sunrise,
  sunset,
  currentTime,
}) {
  const [sunPos, setSunPos] = useState({ x: 0, y: 0 });
  const [moonPos, setMoonPos] = useState({ x: 0, y: 0 });
  const radius = 70;

  useEffect(() => {
    const updatePositions = () => {
      if (!sunrise || !sunset || !currentTime) return;

      // Convert UTC timestamps to city local time
      const nowLocal = currentTime + timezoneOffset;
      const srLocal = sunrise + timezoneOffset;
      const ssLocal = sunset + timezoneOffset;

      // Day progress (0 at sunrise → 1 at sunset)
      let progress = (nowLocal - srLocal) / (ssLocal - srLocal);
      // Don’t clamp — let moon continue beyond day
      const angle = Math.PI * progress;

      // Sun moves along top semicircle
      const sunX = Math.cos(angle - Math.PI / 2) * radius;
      const sunY = Math.sin(angle - Math.PI / 2) * radius;

      // Moon opposite to Sun (always moves)
      const moonAngle = (angle + Math.PI) % (2 * Math.PI);
      const moonX = Math.cos(moonAngle - Math.PI / 2) * radius;
      const moonY = Math.sin(moonAngle - Math.PI / 2) * radius;

      setSunPos({ x: sunX, y: sunY });
      setMoonPos({ x: moonX, y: moonY });
    };

    updatePositions();
    const interval = setInterval(updatePositions, 1000 * 60);
    return () => clearInterval(interval);
  }, [timezoneOffset, sunrise, sunset, currentTime]);

  // Determine if it's currently day or night
  const isDaytime =
    currentTime >= sunrise && currentTime <= sunset;

  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center mx-auto">
      {/* Orbit circle */}
      <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/30 shadow-[inset_0_0_12px_rgba(255,255,255,0.15)]" />
      <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/15 blur-[2px]" />

      {/* ☀️ Sun */}
      <div
        className={`absolute w-6 h-6 rounded-full transition-all duration-700 ${
          isDaytime
            ? "bg-yellow-300 shadow-[0_0_15px_rgba(255,255,120,0.9)]"
            : "bg-yellow-200/10 shadow-none"
        }`}
        style={{
          transform: `translate(${sunPos.x}px, ${sunPos.y}px)`,
        }}
      />

      {/* 🌙 Moon */}
      <div
        className="absolute w-5 h-5 rounded-full bg-gray-300 shadow-[0_0_10px_rgba(190,190,255,0.8)] transition-all duration-700"
        style={{
          transform: `translate(${moonPos.x}px, ${moonPos.y}px)`,
          opacity: isDaytime ? 0.15 : 1,
        }}
      />

      {/* ✨ Center glow */}
      <div className="absolute w-6 h-6 bg-white/10 rounded-full blur-md" />
    </div>
  );
}
