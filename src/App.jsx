import "./App.css";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getWeatherByCity,
  getForecastByCity,
  getAirQuality,
} from "./api/weather";
import { playWeatherSound } from "./utils/soundManager";

import TopBar from "./components/TopBar";
import ForecastBar from "./components/ForecastBar";
import EarthOrbit from "./components/EarthOrbit";
import WeatherScene from "./components/WeatherScene";

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [cityOffset, setCityOffset] = useState(0);
  const [localTime, setLocalTime] = useState(new Date());

  const timezoneOffset = useMemo(
    () => new Date().getTimezoneOffset() / -60,
    []
  );

  // 🕓 Live clock
  useEffect(() => {
    const timer = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🌤️ Fetch weather data
  const fetchWeatherByCityName = useCallback(async (name) => {
    setLoading(true);
    setError(null);
    try {
      const cur = await getWeatherByCity(name);
      const fc = await getForecastByCity(name);

      setCity(cur.name);
      setWeather(cur);
      setCityOffset(cur.timezone / 3600);

      // AQI fetch (non-blocking)
      getAirQuality(cur.coord.lat, cur.coord.lon)
        .then(setAirQuality)
        .catch(() => console.warn("⚠️ AQI fetch failed"));

      // Forecast conversion
      const list = fc.list.map((f) => ({
        ...f,
        local_dt: new Date((f.dt + cur.timezone) * 1000),
      }));
      setForecast(list.slice(0, 8));

      playWeatherSound(cur.weather[0].main);
      setTimeout(() => setIsSceneReady(true), 800);
    } catch (err) {
      console.error("❌ Weather fetch failed:", err);
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 🌍 Location fetch
  const fetchWeatherByCoords = useCallback(
    async (lat, lon) => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${
            import.meta.env.VITE_WEATHER_API_KEY
          }&units=metric`
        );
        const data = await res.json();
        fetchWeatherByCityName(data?.name || "Delhi");
      } catch {
        fetchWeatherByCityName("Delhi");
      } finally {
        setLoading(false);
      }
    },
    [fetchWeatherByCityName]
  );

  // 📍 Geolocation detection
  useEffect(() => {
    let didRespond = false;
    const fallback = (msg) => {
      if (!didRespond) {
        didRespond = true;
        console.warn(msg);
        setAlertMsg("📍 Location unavailable — showing Delhi by default.");
        fetchWeatherByCityName("Delhi");
        setTimeout(() => setAlertMsg(""), 4500);
      }
    };
    const timeout = setTimeout(() => fallback("⏳ Geolocation timeout"), 8000);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (didRespond) return;
        didRespond = true;
        clearTimeout(timeout);
        fetchWeatherByCoords(coords.latitude, coords.longitude);
      },
      () => fallback("❌ Geolocation denied")
    );

    return () => clearTimeout(timeout);
  }, [fetchWeatherByCityName, fetchWeatherByCoords]);

  // 🔍 City search
  const handleSearch = useCallback(
    (q) => {
      if (!q) return;
      setIsSceneReady(false);
      fetchWeatherByCityName(q);
    },
    [fetchWeatherByCityName]
  );

  // 📍 Manual locate
  const handleLocate = useCallback(() => {
    setAlertMsg("📍 Getting current location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchWeatherByCoords(coords.latitude, coords.longitude);
        setTimeout(() => setAlertMsg(""), 2500);
      },
      () => {
        setAlertMsg("Location access denied.");
        setTimeout(() => setAlertMsg(""), 2500);
      }
    );
  }, [fetchWeatherByCoords]);

  // 🕓 City time
  const cityTimeData = useMemo(() => {
    const utcNow =
      localTime.getTime() + localTime.getTimezoneOffset() * 60000;
    const cityNow = new Date(utcNow + cityOffset * 3600 * 1000);
    return {
      cityNow,
      dateStr: cityNow.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      timeStr: cityNow.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      diffLabel:
        Math.abs(cityOffset - timezoneOffset) < 0.1
          ? "(same as you)"
          : `(${cityOffset - timezoneOffset > 0 ? "+" : ""}${(
              cityOffset - timezoneOffset
            ).toFixed(1)}h from you)`,
    };
  }, [localTime, cityOffset, timezoneOffset]);

  // 🧭 AQI labels
  const AQI = useMemo(
    () => ({
      color: (a) =>
        a <= 50
          ? "bg-green-400"
          : a <= 100
          ? "bg-lime-400"
          : a <= 150
          ? "bg-yellow-400"
          : a <= 200
          ? "bg-orange-400"
          : "bg-red-500",
      label: (a) =>
        a <= 50
          ? "Good"
          : a <= 100
          ? "Fair"
          : a <= 150
          ? "Moderate"
          : a <= 200
          ? "Poor"
          : "Very Poor",
      tip: (a) =>
        a <= 50
          ? "Air is clean — perfect for outdoor activities 🌿"
          : a <= 100
          ? "Fair air — suitable for most 🚶"
          : a <= 150
          ? "Moderate — consider limiting outdoor exposure 😷"
          : a <= 200
          ? "Poor — wear a mask outdoors 🏙️"
          : "Very poor — avoid outdoor exertion ⚠️",
    }),
    []
  );

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden">
      {/* 🌅 Placeholder before load */}
      {!isSceneReady && (
        <div
          className="fixed inset-0 transition-bg"
          style={{
            background: "linear-gradient(180deg, #5C8DFF 0%, #A9D6FF 100%)",
            zIndex: -1,
          }}
        />
      )}

      {/* 🌌 Animated Background */}
      <AnimatePresence mode="wait">
        {weather && isSceneReady && (
          <WeatherScene
            key={weather.id || weather.name}
            weatherMain={weather.weather[0].main}
            weatherDesc={weather.weather[0].description}
            windSpeed={weather.wind.speed}
            currentTime={Math.floor(localTime.getTime() / 1000)}
            sunrise={weather.sys.sunrise}
            sunset={weather.sys.sunset}
            timezoneOffset={weather.timezone}
          />
        )}
      </AnimatePresence>

      {/* Overlay tint */}
      <div className="absolute inset-0 bg-black/35 z-0 pointer-events-none" />

      {/* 🧭 Top Bar */}
      <TopBar
        city={city}
        onSearch={handleSearch}
        onSelectFavorite={handleSearch}
        onLocate={handleLocate}
      />

      {/* ⚠️ Alert Message */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs sm:text-sm bg-white/12 backdrop-blur-xl border border-white/20 shadow-lg z-40 text-center w-[90%] sm:w-auto"
          >
            {alertMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌦️ Main Weather Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16">
        {/* Loader */}
        {loading && (
          <div className="flex flex-col items-center justify-center text-white/80 mt-24 sm:mt-32 space-y-6 animate-fadeIn">
            <motion.div
              className="relative w-12 h-12 sm:w-16 sm:h-16"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
            </motion.div>
            <p className="text-xs sm:text-sm tracking-wide font-light">
              Fetching Weather Data...
            </p>
          </div>
        )}

        {/* Error */}
        {error && <div className="text-center text-red-300">{error}</div>}

        {/* Weather Info Card */}
        {weather && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center text-center md:text-left"
          >
            {/* Left Section */}
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-light">
                {weather.weather[0].main}
              </div>
              <div className="text-base sm:text-lg text-white/75">{city}</div>
              <div className="mt-4 sm:mt-5 text-5xl sm:text-6xl md:text-7xl font-bold">
                {Math.round(weather.main.temp)}°C
              </div>
              <div className="mt-2 text-white/70 text-sm sm:text-base">
                Feels like {Math.round(weather.main.feels_like)}°C
              </div>

              {/* City Time */}
              <div className="mt-6 text-white/75 text-xs sm:text-sm leading-relaxed">
                {cityTimeData.dateStr} — {cityTimeData.timeStr}
                <div>
                  GMT {cityOffset >= 0 ? "+" : ""}
                  {cityOffset} {cityTimeData.diffLabel}
                </div>
              </div>
            </div>

            {/* Orbit */}
            <div className="flex justify-center items-center scale-90 sm:scale-100">
              <EarthOrbit
                timezoneOffset={weather.timezone}
                sunrise={weather.sys.sunrise}
                sunset={weather.sys.sunset}
                currentTime={Math.floor(localTime.getTime() / 1000)}
              />
            </div>

            {/* Right Section */}
            <div className="flex flex-col justify-between h-full md:text-right text-center space-y-4 sm:space-y-0">
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                {[
                  ["Humidity", `${weather.main.humidity}%`],
                  ["Pressure", `${weather.main.pressure} hPa`],
                  ["Clouds", `${weather.clouds?.all || 0}%`],
                  ["Wind", `${weather.wind.speed} m/s`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between md:justify-end gap-4 sm:gap-6"
                  >
                    <span className="text-white/75">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* AQI */}
              {airQuality && (
                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 flex flex-col items-center md:items-end">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-md ${AQI.color(
                        airQuality.aqiValue
                      )}`}
                    ></span>
                    <span className="text-xl sm:text-2xl font-bold tracking-tight">
                      {airQuality.aqiValue}
                    </span>
                    <span className="text-white/80 text-xs sm:text-sm font-semibold">
                      AQI
                    </span>
                  </div>

                  <span
                    className={`mt-2 text-xs sm:text-sm font-semibold ${AQI.color(
                      airQuality.aqiValue
                    ).replace("bg-", "text-")}`}
                  >
                    {AQI.label(airQuality.aqiValue)}
                  </span>

                  <p className="text-white/70 mt-2 sm:mt-3 text-xs sm:text-sm text-center md:text-right max-w-[220px] leading-relaxed">
                    {AQI.tip(airQuality.aqiValue)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Forecast Bar */}
        {!!forecast.length && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 sm:mt-8"
          >
            <ForecastBar forecast={forecast} current={weather} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
