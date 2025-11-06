const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export async function getWeatherByCity(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error("City not found");
  return await res.json();
}

export async function getForecastByCity(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error("Forecast not found");
  return await res.json();
}
// Fetch air quality data
export async function getAirQuality(lat, lon) {
  const token = import.meta.env.VITE_WAQI_TOKEN; // 🔹 from .env
  if (!token) {
    console.warn("Missing WAQI token in .env.local");
    return null;
  }

  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "ok") {
    console.warn("AQI unavailable:", data);
    return null;
  }

  return {
    aqiValue: data.data.aqi,
    pm25: data.data.iaqi.pm25?.v ?? null,
    pm10: data.data.iaqi.pm10?.v ?? null,
    dominent: data.data.dominentpol,
    city: data.data.city.name,
  };
}


