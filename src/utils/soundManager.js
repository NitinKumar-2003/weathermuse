import rain_day from "../sounds/rain.mp3";
import rain_night from "../sounds/rain.mp3"; // softer night version if available
import thunder_day from "../sounds/thunder.mp3";
import thunder_night from "../sounds/thunder.mp3";
import wind_day from "../sounds/wind.mp3";
import wind_night from "../sounds/wind.mp3";
import birds_day from "../sounds/birds.mp3";
import crickets_night from "../sounds/crickets.mp3";

let currentAudio = null;
let isEnabled = true;
let lastWeather = null;
let lastIsNight = false;
let isFading = false;

// 🎵 Organized mapping
const sounds = {
  day: {
    Clear: birds_day,
    Clouds: wind_day,
    Cloudy: wind_day,
    Mist: wind_day,
    Fog: wind_day,
    Smoke: wind_day,
    Snow: wind_day,
    Rain: rain_day,
    Thunderstorm: thunder_day,
    Haze: rain_day,
  },
  night: {
    Clear: crickets_night,
    Clouds: wind_night,
    Cloudy: wind_night,
    Mist: wind_night,
    Fog: wind_night,
    Smoke: wind_night,
    Snow: wind_night,
    Rain: rain_night,
    Thunderstorm: thunder_night,
    Night: crickets_night,
  },
};

// ⏳ Fade helper
function fade(audio, from, to, duration, onComplete) {
  if (!audio) return;
  const steps = 25;
  const stepTime = duration / steps;
  const delta = (to - from) / steps;
  let volume = from;
  audio.volume = from;

  const interval = setInterval(() => {
    volume += delta;
    if ((delta > 0 && volume >= to) || (delta < 0 && volume <= to)) {
      audio.volume = to;
      clearInterval(interval);
      onComplete && onComplete();
    } else {
      audio.volume = volume;
    }
  }, stepTime);
}

// 🌙 Check current time
function isNightTime() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

// 🎧 Play weather sound
export function playWeatherSound(weather, forceNight = false) {
  if (!weather) return;

  const isNight = forceNight || isNightTime();
  lastWeather = weather;
  lastIsNight = isNight;

  if (!isEnabled) return;

  const timeKey = isNight ? "night" : "day";
  const soundSrc = sounds[timeKey][weather] || (isNight ? crickets_night : birds_day);
  if (!soundSrc) return;

  // prevent duplicate sound
  if (currentAudio && currentAudio.dataset?.src === soundSrc) return;

  const newAudio = new Audio(soundSrc);
  newAudio.dataset.src = soundSrc;
  newAudio.loop = true;
  newAudio.volume = 0;

  const startPlayback = () => {
    newAudio.play().catch(() => {
      console.warn("Autoplay blocked. Waiting for interaction...");
      document.addEventListener(
        "click",
        () => newAudio.play().catch(() => {}),
        { once: true }
      );
    });
    fade(newAudio, 0, 0.2, 2000);
  };

  const replaceCurrent = () => {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.src = ""; // full cleanup
      } catch {}
    }
    currentAudio = newAudio;
    startPlayback();
  };

  // crossfade if a sound is already playing
  if (currentAudio && !isFading) {
    isFading = true;
    fade(currentAudio, currentAudio.volume, 0, 1200, () => {
      replaceCurrent();
      isFading = false;
    });
  } else {
    replaceCurrent();
  }
}

// 🔇 Toggle on/off
export function setSoundEnabled(val) {
  isEnabled = val;
  if (!val && currentAudio) {
  fade(currentAudio, currentAudio.volume, 0, 300, () => {
    currentAudio.pause();
    currentAudio.src = "";
  });
}
 else if (val && lastWeather) {
    playWeatherSound(lastWeather, lastIsNight);
  }
}

// 🕓 Auto day-night updater (check every 10 mins)
setInterval(() => {
  if (lastWeather && isEnabled) {
    const nowNight = isNightTime();
    if (nowNight !== lastIsNight) {
      playWeatherSound(lastWeather, nowNight);
    }
  }
}, 600000);
