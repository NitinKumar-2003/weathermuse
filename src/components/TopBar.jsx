import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, MapPin, Menu, Plus } from "lucide-react";
import SoundToggle from "./SoundToggle";

export default function TopBar({ city, onSearch, onSelectFavorite, onLocate }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("weathermuse:favorites")) || []
  );
  const [showMore, setShowMore] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchWrapRef = useRef(null);

  // 🧠 Persist favorites
  useEffect(() => {
    localStorage.setItem("weathermuse:favorites", JSON.stringify(favorites));
  }, [favorites]);

  // 🔍 Fetch city suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        const [inRes, glRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
              query
            )},IN&limit=5&appid=${apiKey}`
          ),
          fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
              query
            )}&limit=5&appid=${apiKey}`
          ),
        ]);

        const [inData, glData] = await Promise.all([inRes.json(), glRes.json()]);
        const unique = [
          ...inData,
          ...glData.filter(
            (g) => !inData.some((i) => i.name === g.name && i.country === g.country)
          ),
        ];
        setSuggestions(unique);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  // 🖱️ Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSuggestions([]);
        setActiveIndex(-1);
      }
      if (!e.target.closest(".mobile-menu")) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 🔎 Search handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => (p + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => (p === 0 ? suggestions.length - 1 : p - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  };

  const selectSuggestion = (s) => {
    const name = `${s.name}${s.state ? `, ${s.state}` : ""}, ${s.country}`;
    onSearch(name);
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
  };

  // ⭐ Favorites
  const addFavorite = () => {
    if (city && !favorites.includes(city)) setFavorites([...favorites, city]);
  };
  const removeFavorite = (name) =>
    setFavorites((prev) => prev.filter((f) => f !== name));

  return (
    <div className="fixed top-4 left-0 w-full z-50 px-3 sm:px-6">
      {/* 📱 Mobile Layout */}
      <div className="sm:hidden flex items-center justify-between w-full px-2 py-2 gap-2">
        {/* 🔊 Compact SoundToggle */}
        <div className="flex-shrink-0">
          <SoundToggle compact />
        </div>

        {/* 🔍 Search Bar */}
        <div ref={searchWrapRef} className="flex-1 relative">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-2xl px-3 py-1.5 border border-white/20 shadow-sm"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full bg-transparent text-white placeholder-white/70 text-sm text-center outline-none"
            />
          </form>

          {/* 🌍 Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute mt-1 w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg text-sm overflow-hidden z-50"
              >
                {suggestions.map((s, i) => (
                  <motion.li
                    key={`${s.name}-${s.country}-${i}`}
                    onClick={() => selectSuggestion(s)}
                    className={`px-4 py-2 flex justify-between cursor-pointer ${
                      activeIndex === i ? "bg-white/30" : "hover:bg-white/20"
                    }`}
                  >
                    <span>
                      {s.name}
                      {s.state ? `, ${s.state}` : ""}{" "}
                      <span className="text-white/50">{s.country}</span>
                    </span>
                    {s.country === "IN" && (
                      <span className="text-orange-400 text-xs">🇮🇳</span>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* ☰ Menu Button */}
        <div className="relative flex-shrink-0 mobile-menu">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu((v) => !v)}
            className="p-[8px] rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl transition flex items-center justify-center"
            style={{ width: 36, height: 36 }}
          >
            <Menu size={18} className="text-white" />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-2 w-44 z-50"
              >
                <button
                  onClick={addFavorite}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 rounded-md transition"
                >
                  <Plus size={14} /> Add Favorite
                </button>

                <button
                  onClick={onLocate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 rounded-md transition"
                >
                  <MapPin size={14} /> Current Location
                </button>

                <div className="border-t border-white/10 my-2" />

                {favorites.length === 0 ? (
                  <p className="text-white/60 text-xs px-3">No favorites yet</p>
                ) : (
                  favorites.map((f, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-white/90 text-xs px-3 py-1 rounded-md hover:bg-white/20 cursor-pointer"
                      onClick={() => {
                        onSelectFavorite(f);
                        setShowMenu(false);
                      }}
                    >
                      <span>{f}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(f);
                        }}
                        className="text-white/60 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 💻 Desktop Layout — Centered Search Bar */}
      <div className="hidden sm:grid grid-cols-3 items-center w-full">
        {/* Left Section */}
        <div className="flex justify-start">
          <SoundToggle />
        </div>

        {/* Center Search */}
        <div ref={searchWrapRef} className="flex justify-center relative">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-md border border-white/20 w-[420px]"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search city..."
              className="w-full bg-transparent text-white placeholder-white/70 text-center outline-none text-base"
            />
          </form>

          {/* Centered dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute mt-2 w-[420px] bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg text-sm overflow-hidden z-50"
              >
                {suggestions.map((s, i) => (
                  <motion.li
                    key={`${s.name}-${s.country}-${i}`}
                    onClick={() => selectSuggestion(s)}
                    className={`px-4 py-2 flex justify-between cursor-pointer ${
                      activeIndex === i ? "bg-white/30" : "hover:bg-white/20"
                    }`}
                  >
                    <span>
                      {s.name}
                      {s.state ? `, ${s.state}` : ""}{" "}
                      <span className="text-white/50">{s.country}</span>
                    </span>
                    {s.country === "IN" && (
                      <span className="text-orange-400 text-xs">🇮🇳</span>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={addFavorite}
            className="px-3 py-1.5 text-sm rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
          >
            + Add
          </button>

          <button
            onClick={onLocate}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition flex items-center justify-center"
          >
            <MapPin className="text-white w-4 h-4" />
          </button>

          {favorites.slice(0, 3).map((f) => (
            <motion.div key={f} whileHover={{ scale: 1.05 }} className="relative group">
              <button
                onClick={() => onSelectFavorite(f)}
                className={`px-3 py-1 rounded-xl text-sm border transition ${
                  f === city
                    ? "bg-white/30 border-white/40 shadow-md"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                }`}
              >
                {f}
              </button>
              <motion.button
                onClick={() => removeFavorite(f)}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full px-[5px] h-3.5 opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </motion.button>
            </motion.div>
          ))}

          {favorites.length > 3 && (
            <div className="relative">
              <motion.button
                onClick={() => setShowMore((v) => !v)}
                animate={{ rotate: showMore ? 90 : 0 }}
                transition={{ duration: 0.3 }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
              >
                <MoreHorizontal size={18} className="text-white" />
              </motion.button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-3 w-52 z-50"
                  >
                    {favorites.map((f, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onSelectFavorite(f);
                          setShowMore(false);
                        }}
                        className="flex justify-between items-center text-white/90 text-sm px-2 py-1 rounded-md hover:bg-white/20 cursor-pointer"
                      >
                        <span>{f}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(f);
                          }}
                          className="text-white/60 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
