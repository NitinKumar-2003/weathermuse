import { memo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function itemVariants(i) {
  return {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.3 } },
  };
}

function ForecastBar({ forecast = [], timezone = 0 }) {
  if (!forecast.length) return null;

  // 🕒 Convert forecast UTC → city-local time
  const allTimes = forecast.map((f) => ({
    ...f,
    local_dt: new Date((f.dt + timezone) * 1000),
  }));

  allTimes.sort((a, b) => a.local_dt - b.local_dt);

  // Define target anchors for visual flow (5 AM → 2 AM)
  const targetHours = [5, 8, 11, 14, 17, 20, 23, 2];

  // 🧭 Build timeline from closest forecast points
  const cityNow = new Date(Date.now() + timezone * 1000);
  const timeline = targetHours.map((h) => {
    const target = new Date(cityNow);
    if (h < 5) target.setDate(cityNow.getDate() + 1);
    target.setHours(h, 0, 0, 0);

    const closest = allTimes.reduce((prev, curr) => {
      return Math.abs(curr.local_dt - target) < Math.abs(prev.local_dt - target)
        ? curr
        : prev;
    });

    return {
      ...closest,
      displayTime: target.toLocaleTimeString([], {
        hour: "numeric",
        hour12: true,
      }),
    };
  });

  // 📊 Data for line chart
  const chartData = timeline.map((t) => ({
    time: t.displayTime,
    temp: Math.round(t.main?.temp),
  }));

  return (
    <div className="glass-soft rounded-2xl p-4 w-full relative overflow-hidden">
      {/* 🧊 Subtle temperature curve */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip
              formatter={(v) => `${v}°C`}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "none",
                backdropFilter: "blur(8px)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="url(#tempGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🌤 Forecast Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 items-stretch">
        {timeline.map((f, i) => (
          <motion.div
            key={i}
            variants={itemVariants(i)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-end rounded-xl px-4 py-5 backdrop-blur-md text-center bg-white/10 hover:bg-white/20 transition-all"
          >
            <div className="text-xs text-white/80 font-medium mb-1">
              {f.displayTime}
            </div>

            {f.weather && (
              <img
                src={`https://openweathermap.org/img/wn/${f.weather?.[0]?.icon}@2x.png`}
                alt={f.weather?.[0]?.main || "Weather"}
                className="w-8 h-8 mb-1 opacity-90"
              />
            )}

            <div className="text-2xl font-semibold text-white">
              {Math.round(f.main?.temp)}°C
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default memo(ForecastBar);
