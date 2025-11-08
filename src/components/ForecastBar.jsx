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

  // Anchors (5 AM → 2 AM)
  const targetHours = [5, 8, 11, 14, 17, 20, 23, 2];
  const cityNow = new Date(Date.now() + timezone * 1000);

  const timeline = targetHours.map((h) => {
    const target = new Date(cityNow);
    if (h < 5) target.setDate(cityNow.getDate() + 1);
    target.setHours(h, 0, 0, 0);

    const closest = allTimes.reduce((prev, curr) =>
      Math.abs(curr.local_dt - target) < Math.abs(prev.local_dt - target)
        ? curr
        : prev
    );

    return {
      ...closest,
      displayTime: target.toLocaleTimeString([], {
        hour: "numeric",
        hour12: true,
      }),
    };
  });

  const chartData = timeline.map((t) => ({
    time: t.displayTime,
    temp: Math.round(t.main?.temp),
  }));

  return (
    <div className="glass-soft rounded-2xl p-4 sm:p-6 w-full relative overflow-hidden">
      {/* 🧊 Subtle temperature curve */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-50 sm:opacity-60">
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
      <div
        className="
          relative z-10 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar
          sm:grid sm:grid-cols-4 md:grid-cols-8 sm:overflow-visible
          pt-2 sm:pt-0 pb-2 sm:pb-0
        "
      >
        {timeline.map((f, i) => (
          <motion.div
            key={i}
            variants={itemVariants(i)}
            initial="hidden"
            animate="show"
            className="
              flex-shrink-0 w-[110px] sm:w-auto
              flex flex-col items-center justify-end 
              rounded-xl px-4 py-5 backdrop-blur-md text-center 
              bg-white/10 hover:bg-white/20 transition-all
            "
          >
            <div className="text-[11px] sm:text-xs text-white/80 font-medium mb-1">
              {f.displayTime}
            </div>

            {f.weather && (
              <img
                src={`https://openweathermap.org/img/wn/${f.weather?.[0]?.icon}@2x.png`}
                alt={f.weather?.[0]?.main || "Weather"}
                className="w-7 h-7 sm:w-8 sm:h-8 mb-1 opacity-90"
              />
            )}

            <div className="text-lg sm:text-2xl font-semibold text-white">
              {Math.round(f.main?.temp)}°C
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default memo(ForecastBar);
