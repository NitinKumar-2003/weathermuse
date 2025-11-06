import sunny from "../assets/sunny.jpg";
import cloudy from "../assets/cloudy.jpg";
import rainy from "../assets/rainy.jpg";
import storm from "../assets/storm.jpg";
import fog from "../assets/fog.jpg";
import snow from "../assets/snow.jpg";
import night from "../assets/night.jpg";

export function getBackground(weatherMain, isNight) {
  if (isNight) return night;
  switch (weatherMain) {
    case "Clear":
      return sunny;
    case "Clouds":
      return cloudy;
    case "Rain":
      return rainy;
    case "Thunderstorm":
      return storm;
    case "Snow":
      return snow;
    case "Mist":
    case "Fog":
      return fog;
    default:
      return cloudy;
  }
}
