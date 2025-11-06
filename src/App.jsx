import "./App.css";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getWeatherByCity,
  getForecastByCity,
  getAirQuality,
} from "./api/weather";
import { getBackground } from "./utils/backgrounds";
import { playWeatherSound } from "./utils/soundManager";
import TopBar from "./components/TopBar";
import ForecastBar from "./components/ForecastBar";
import EarthOrbit from "./components/EarthOrbit";

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [bg, setBg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localTime, setLocalTime] = useState(new Date());
  const [cityOffset, setCityOffset] = useState(0);
  const [timezoneOffset] = useState(new Date().getTimezoneOffset() / -60);
  const [alertMsg, setAlertMsg] = useState("");
  const [airQuality, setAirQuality] = useState(null);

  // 🕒 Live Clock
  useEffect(() => {
    const t = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 📍 Geolocate once
  useEffect(() => {
    let didRespond = false;
    const timeout = setTimeout(() => {
      if (!didRespond) {
        console.warn("⏳ Geolocation timeout — using Delhi");
        setAlertMsg("📍 Location detection timed out — showing Delhi by default.");
        fetchWeatherByCityName("Delhi");
        setTimeout(() => setAlertMsg(""), 4500);
        didRespond = true;
      }
    }, 8000); // Increased timeout for reliability

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (didRespond) return;
        didRespond = true;
        clearTimeout(timeout);
        console.log("✅ Got geolocation:", coords);
        fetchWeatherByCoords(coords.latitude, coords.longitude);
      },
      (err) => {
        console.warn("❌ Geolocation error:", err);
        if (didRespond) return;
        didRespond = true;
        clearTimeout(timeout);
        setAlertMsg("📍 Location access denied — showing Delhi by default.");
        fetchWeatherByCityName("Delhi");
        setTimeout(() => setAlertMsg(""), 4500);
      }
    );

    return () => clearTimeout(timeout);
  }, []);

  // 🌤️ Fetch Weather by City
  async function fetchWeatherByCityName(name) {
    setLoading(true);
    setError(null);
    try {
      const cur = await getWeatherByCity(name);
      const fc = await getForecastByCity(name);

      setCity(cur.name);
      setWeather(cur);
      setCityOffset(cur.timezone / 3600);

      // 🌫️ Fetch Air Quality (WAQI)
      try {
        const aq = await getAirQuality(cur.coord.lat, cur.coord.lon);
        setAirQuality(aq);
      } catch (err) {
        console.warn("⚠️ Failed to fetch AQI:", err);
        setAirQuality(null);
      }

      // Forecast conversion
      const list = fc.list.map((f) => ({
        ...f,
        local_dt: new Date((f.dt + cur.timezone) * 1000),
      }));
      setForecast(list.slice(0, 8)); // 24h (8x3h)

      // Background & sound
      const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;
      setBg(getBackground(cur.weather[0].main, isNight));
      playWeatherSound(cur.weather[0].main, isNight);
    } catch (e) {
      console.error("❌ Weather fetch failed:", e);
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }

  // 🌍 Fetch Weather by Coordinates
  async function fetchWeatherByCoords(lat, lon) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${
          import.meta.env.VITE_WEATHER_API_KEY
        }&units=metric`
      );
      const data = await res.json();
      if (data && data.name) {
        console.log("🌍 Resolved city:", data.name);
        await fetchWeatherByCityName(data.name);
      } else {
        console.warn("⚠️ No city name in response, using Delhi");
        await fetchWeatherByCityName("Delhi");
      }
    } catch (e) {
      console.error("❌ fetchWeatherByCoords failed:", e);
      await fetchWeatherByCityName("Delhi");
    } finally {
      setLoading(false);
    }
  }

  // 📍 Manual Location Button
  function handleLocate() {
    setAlertMsg("📍 Getting current location...");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log("📍 Manual location fetch:", coords);
        fetchWeatherByCoords(coords.latitude, coords.longitude);
        setTimeout(() => setAlertMsg(""), 2500);
      },
      (err) => {
        console.warn("❌ Manual geolocation error:", err);
        setAlertMsg("Location access denied. Unable to fetch current location.");
        setTimeout(() => setAlertMsg(""), 3000);
        setLoading(false);
      }
    );
  }

  // 🔍 Search Handler
  function handleSearch(q) {
    if (q) fetchWeatherByCityName(q);
  }

  // 🕓 Formatters
  const formatDate = (d) =>
    d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const formatClock = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 🧮 AQI Helpers
  const getAQIColor = (aqi) =>
    aqi <= 50
      ? "bg-green-400"
      : aqi <= 100
      ? "bg-lime-400"
      : aqi <= 150
      ? "bg-yellow-400"
      : aqi <= 200
      ? "bg-orange-400"
      : "bg-red-500";

  const getAQILabel = (aqi) =>
    aqi <= 50
      ? "Good"
      : aqi <= 100
      ? "Fair"
      : aqi <= 150
      ? "Moderate"
      : aqi <= 200
      ? "Poor"
      : "Very Poor";

  const getAQITip = (aqi) => {
    if (aqi <= 50) return "Air is clean — perfect for outdoor activities 🌿";
    if (aqi <= 100) return "Fair air — suitable for most, enjoy your day 🚶";
    if (aqi <= 150)
      return "Moderate — consider limiting long outdoor exposure 😷";
    if (aqi <= 200) return "Poor — wear a mask outdoors 🏙️";
    return "Very poor — avoid outdoor exertion ⚠️";
  };

  return (
    <div
      className="min-h-screen w-full text-white relative bg-cover bg-center"
      style={{
        backgroundImage: `url(${bg})`,
        transition: "background-image 800ms ease-in-out",
      }}
    >
      <div className="absolute inset-0 bg-black/45" />

      {/* 🌫️ TopBar */}
      <TopBar
        city={city}
        onSearch={handleSearch}
        onSelectFavorite={handleSearch}
        onLocate={handleLocate} // 📍 added prop
      />

      {/* 🪶 Alert */}
      {alertMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl text-sm bg-white/12 backdrop-blur-xl border border-white/20 shadow-lg z-40"
        >
          {alertMsg}
        </motion.div>
      )}

      {/* 🌦 Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-12">
        {loading && (
          <div className="flex flex-col items-center justify-center text-white/80 mt-32 space-y-6 animate-fadeIn">
            <motion.div
              className="relative w-16 h-16"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-sm tracking-wide font-light"
            >
              Fetching Weather Data...
            </motion.p>
          </div>
        )}

        {error && <div className="text-center text-red-300">{error}</div>}

        {/* Main Weather Card */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
          >
            {/* 🧭 Left Column — Weather Info */}
            <div className="flex flex-col justify-center text-center md:text-left">
              <div className="text-3xl md:text-4xl font-light">
                {weather.weather[0].main}
              </div>
              <div className="text-lg text-white/75">{city}</div>
              <div className="mt-5 text-6xl md:text-7xl font-bold">
                {Math.round(weather.main.temp)}°C
              </div>
              <div className="mt-2 text-white/70">
                Feels like {Math.round(weather.main.feels_like)}°C
              </div>
              <div className="mt-6 text-white/75 text-sm">
                <div>
                  {formatDate(localTime)} — {formatClock(localTime)}
                </div>
                <div>
                  GMT {cityOffset >= 0 ? "+" : ""}
                  {cityOffset} ({(cityOffset - timezoneOffset).toFixed(1)}h from you)
                </div>
              </div>
            </div>

            {/* 🌍 Middle Column — Earth Orbit */}
            <div className="flex justify-center items-center">
              <EarthOrbit timezoneOffset={weather.timezone} />
            </div>

            {/* 📊 Right Column — Stats + AQI */}
            <div className="flex flex-col justify-between h-full md:text-right text-center">
              {/* Weather Stats */}
              <div className="space-y-4">
                <div className="flex justify-between md:justify-end gap-6">
                  <span className="text-white/75">Humidity</span>
                  <span className="font-semibold">{weather.main.humidity}%</span>
                </div>
                <div className="flex justify-between md:justify-end gap-6">
                  <span className="text-white/75">Pressure</span>
                  <span className="font-semibold">{weather.main.pressure} hPa</span>
                </div>
                <div className="flex justify-between md:justify-end gap-6">
                  <span className="text-white/75">Clouds</span>
                  <span className="font-semibold">
                    {weather.clouds ? weather.clouds.all : 0}%
                  </span>
                </div>
                <div className="flex justify-between md:justify-end gap-6">
                  <span className="text-white/75">Wind</span>
                  <span className="font-semibold">{weather.wind.speed} km/h</span>
                </div>
              </div>

              {/* 🌫️ Air Quality */}
              {airQuality && (
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center md:items-end">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full shadow-md ${getAQIColor(
                        airQuality.aqiValue
                      )}`}
                    ></span>
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {airQuality.aqiValue}
                    </span>
                    <span className="text-white/80 text-sm font-semibold">
                      AQI
                    </span>
                  </div>

                  <span
                    className={`mt-2 text-sm font-semibold ${getAQIColor(
                      airQuality.aqiValue
                    ).replace("bg-", "text-")}`}
                  >
                    {getAQILabel(airQuality.aqiValue)}
                  </span>

                  <p className="text-white/70 mt-3 text-xs text-center md:text-right max-w-[200px] leading-relaxed">
                    {getAQITip(airQuality.aqiValue)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ⏰ Forecast */}
        {!!forecast.length && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6"
          >
            <ForecastBar forecast={forecast} current={weather} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
