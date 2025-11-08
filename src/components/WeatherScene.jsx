import React, { useEffect, useMemo, useState } from "react";
import Particles from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

function WeatherScene({
  weatherMain,
  weatherDesc,
  windSpeed = 0,
  currentTime,
  sunrise,
  sunset,
  timezoneOffset = 0,
}) {
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [flash, setFlash] = useState(false);
  const [clouds, setClouds] = useState([]);
  const [sunPosition, setSunPosition] = useState(0);

  const lowerMain = (weatherMain || "").toLowerCase();

  /* 🌀 Initialize tsparticles once */
  useEffect(() => {
    initParticlesEngine(async (engine) => await loadFull(engine)).then(() =>
      setEngineLoaded(true)
    );
  }, []);

  /* ⚡ Thunderstorm lightning */
  useEffect(() => {
    let interval;
    if (lowerMain.includes("thunder")) {
      interval = setInterval(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 120);
      }, Math.random() * 6000 + 3000);
    }
    return () => clearInterval(interval);
  }, [lowerMain]);

  /* 🌅 Determine day/night/sunrise/sunset */
  const phase = useMemo(() => {
    if (!sunrise || !sunset || !currentTime) return "day";

    const now = new Date((currentTime + timezoneOffset) * 1000);
    const sr = new Date((sunrise + timezoneOffset) * 1000);
    const ss = new Date((sunset + timezoneOffset) * 1000);

    const oneHour = 60 * 60 * 1000;
    const sunriseStart = new Date(sr.getTime() - oneHour);
    const sunriseEnd = new Date(sr.getTime() + oneHour);
    const sunsetStart = new Date(ss.getTime() - oneHour);
    const sunsetEnd = new Date(ss.getTime() + oneHour);

    if (now < sunriseStart || now > sunsetEnd) return "night";
    if (now >= sunriseStart && now <= sunriseEnd) return "sunrise";
    if (now >= sunsetStart && now <= sunsetEnd) return "sunset";
    return "day";
  }, [currentTime, sunrise, sunset, timezoneOffset]);

  const isNight = phase === "night";

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isNight ? "night" : "day"
    );
  }, [isNight]);

  /* ☀️ Sun position */
  useEffect(() => {
    if (!sunrise || !sunset || !currentTime) return;
    const adjusted = currentTime + timezoneOffset;
    const progress = Math.max(
      0,
      Math.min(1, (adjusted - sunrise) / (sunset - sunrise))
    );
    setSunPosition(progress * 100);
  }, [currentTime, sunrise, sunset, timezoneOffset]);

  /* ☁️ Clouds */
  useEffect(() => {
    if (!lowerMain.includes("cloud")) {
      setClouds([]);
      return;
    }
    const count = Math.min(8, 5 + Math.floor(windSpeed / 3));
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      img: `/clouds/cloud${(i % 3) + 1}.png`,
      top: 5 + Math.random() * 25,
      width: 300 + Math.random() * 200,
      speed: Math.max(35, 80 - windSpeed * 4),
      offset: Math.random() * 100,
    }));
    setClouds(generated);
  }, [lowerMain, windSpeed]);

  /* 🌇 Gradient background */
  const gradient = useMemo(() => {
    const base = {
      sunrise: "linear-gradient(180deg, #ffb347 0%, #ffd194 100%)",
      day: "linear-gradient(180deg, #87CEEB 0%, #E0FFFF 100%)",
      sunset: "linear-gradient(180deg, #ff9966 0%, #ff5e62 100%)",
      night: "linear-gradient(180deg, #060819 0%, #1a237e 100%)",
    };

    if (lowerMain.includes("snow"))
      return "linear-gradient(180deg, #e8f6ff 0%, #c3d8ef 100%)";
    if (lowerMain.includes("rain") || lowerMain.includes("drizzle"))
      return isNight
        ? "linear-gradient(180deg, #1b2330 0%, #0d1117 100%)"
        : "linear-gradient(180deg, #4b6584 0%, #2d3436 100%)";
    if (lowerMain.includes("cloud"))
      return isNight
        ? "linear-gradient(180deg, #242b3a 0%, #3b475b 100%)"
        : "linear-gradient(180deg, #a0b6cc 0%, #d5dee9 100%)";
    if (lowerMain.includes("thunder"))
      return "linear-gradient(180deg, #232526 0%, #414345 100%)";
    if (["fog", "haze", "mist", "smoke"].some((t) => lowerMain.includes(t)))
      return isNight
        ? "linear-gradient(180deg, #080a14 0%, #20242f 100%)"
        : "linear-gradient(180deg, #cfd8dc 0%, #9ea7aa 100%)";

    return base[phase];
  }, [lowerMain, isNight, phase]);

  /* 🌫️ Smog / Haze overlay (thicker, visible day & night) */
  const hazeOverlay = useMemo(() => {
    if (!["fog", "haze", "mist", "smoke"].some((t) => lowerMain.includes(t)))
      return null;

    const baseColor = isNight
      ? "rgba(160, 160, 180, 0.25)" // thicker for visibility
      : "rgba(200, 200, 190, 0.45)";

    const fogLayers = Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      top: `${i * 30}%`,
      opacity: 0.35 + Math.random() * 0.15,
      blur: 70 + i * 30,
      speed: 45 + i * 15 - windSpeed * 2,
    }));

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        {fogLayers.map((f) => (
          <div
            key={f.id}
            style={{
              position: "absolute",
              top: f.top,
              left: "-50%",
              width: "200%",
              height: "60%",
              background: baseColor,
              filter: `blur(${f.blur}px)`,
              opacity: f.opacity,
              animation: `smogDrift ${Math.max(f.speed, 25)}s linear infinite`,
            }}
          />
        ))}
      </div>
    );
  }, [lowerMain, isNight, windSpeed]);

  /* 🌠 Particle effects — stars, twinkles, shooting stars, snow, rain */
  const particleOptions = useMemo(() => {
    const cfg = {
      fullScreen: { enable: true, zIndex: 1 },
      detectRetina: true,
      fpsLimit: 60,
      particles: { number: { value: 0 } },
      interactivity: { events: {} },
    };

    // 🌌 Night sky with twinkling + shooting stars
    if (
      isNight &&
      (lowerMain.includes("clear") ||
        ["fog", "haze", "mist", "smoke"].some((t) => lowerMain.includes(t)))
    ) {
      return {
        ...cfg,
        particles: {
          number: { value: 120 },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          size: { value: { min: 0.6, max: 1.8 } },
          opacity: {
            value: { min: 0.4, max: 1 },
            animation: {
              enable: true,
              speed: 0.6,
              minimumValue: 0.3,
              sync: false,
            },
          },
          move: {
            enable: true,
            speed: 0.05,
            random: true,
            straight: false,
          },
        },
        emitters: {
          direction: "top-right",
          rate: { delay: 5, quantity: 1 }, // one shooting star every ~5s
          size: { width: 0, height: 0 },
          position: { x: 0, y: 30 },
          particles: {
            move: {
              direction: "top-right",
              speed: { min: 30, max: 60 },
              outModes: { default: "destroy" },
            },
            size: { value: { min: 0.5, max: 1.5 } },
            color: { value: "#fff" },
            life: { duration: { value: 0.8 }, count: 1 },
            opacity: {
              value: 1,
              animation: {
                enable: true,
                speed: 1.5,
                startValue: "max",
                destroy: "min",
              },
            },
            shape: { type: "circle" },
            number: { value: 1 },
          },
        },
      };
    }

    // ❄️ Snow
    if (lowerMain.includes("snow")) {
      return {
        ...cfg,
        particles: {
          number: { value: 350, density: { enable: true, area: 900 } },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          size: { value: { min: 1.5, max: 3 } },
          opacity: { value: 0.9, random: true },
          move: {
            enable: true,
            direction: "bottom",
            speed: 1.3,
            random: true,
            outModes: { default: "out" },
          },
        },
      };
    }

    // 🌧️ Rain
    if (lowerMain.includes("rain") || lowerMain.includes("drizzle")) {
      return {
        ...cfg,
        particles: {
          number: { value: 250, density: { enable: true, area: 800 } },
          color: { value: "#9ecfff" },
          shape: { type: "line" },
          size: { value: 1.2 },
          opacity: { value: 0.65 },
          move: {
            enable: true,
            direction: "bottom",
            speed: 20,
            straight: true,
            outModes: { default: "out" },
          },
        },
      };
    }

    return cfg;
  }, [lowerMain, isNight]);

  const showLeaves =
    !isNight &&
    lowerMain.includes("clear") &&
    !["rain", "snow", "cloud", "fog", "haze", "mist"].some((t) =>
      lowerMain.includes(t)
    );

  return (
    <>
      {/* 🌇 Background */}
      <div
        className="transition-bg fade-in"
        style={{
          position: "fixed",
          inset: 0,
          background: gradient,
          transition: "background 4s ease-in-out, opacity 1s ease-in-out",
          zIndex: 0,
        }}
      />

      {/* 🌫️ Haze / Smog Layer */}
      {hazeOverlay}

      {/* ☀️ Sun Glow */}
      {!isNight && (
        <div
          className="sun-glow"
          style={{
            position: "fixed",
            top: "10%",
            left: `${sunPosition}%`,
            transform: "translateX(-50%)",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,230,180,0.8), rgba(255,200,90,0.4), transparent 70%)",
            filter: "blur(100px)",
            pointerEvents: "none",
            zIndex: 2,
            transition: "left 60s linear, opacity 3s ease-in-out",
            animation: "sunPulse 8s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* 🌌 Particles (Stars / Rain / Snow / Shooting Stars) */}
      {engineLoaded && (
        <Particles
          id="weather-scene"
          options={particleOptions}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ☁️ Clouds */}
      {lowerMain.includes("cloud") && (
        <div className="clouds-wrapper">
          {clouds.map((cloud) => (
            <img
              key={cloud.id}
              src={cloud.img}
              alt="cloud"
              className="cloud-img"
              style={{
                top: `${cloud.top}%`,
                width: `${cloud.width}px`,
                animationDuration: `${cloud.speed}s`,
                animationDelay: `-${cloud.offset}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 🍃 Leaves */}
      {showLeaves && (
        <div className="leaf-layer pointer-events-none z-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="leaf" />
          ))}
        </div>
      )}

      {/* 🦉 Owl */}
      {isNight && (
        <div className="owl z-8">
          <div className="eye left" />
          <div className="eye right" />
          <div className="beak" />
        </div>
      )}

      {/* ⚡ Lightning Flash */}
      {flash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.85)",
            zIndex: 9,
            transition: "opacity .2s ease-out",
          }}
        />
      )}
    </>
  );
}

export default React.memo(WeatherScene, (prev, next) => {
  return (
    prev.weatherMain === next.weatherMain &&
    prev.weatherDesc === next.weatherDesc &&
    prev.windSpeed === next.windSpeed &&
    prev.sunrise === next.sunrise &&
    prev.sunset === next.sunset &&
    prev.timezoneOffset === next.timezoneOffset
  );
});
