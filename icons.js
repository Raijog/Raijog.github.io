// Struktur für Icon und Beschreibung für jeden Wetter-Code von Meteo Weather

const wmoMeteoconsMap = {
  // Klarer Himmel & Bewölkung
  0: { day: "clear-day.svg", night: "clear-night.svg", description: "Klarer Himmel" },
  1: { day: "clear-day.svg", night: "clear-night.svg", description: "Überwiegend klar" },
  2: { day: "partly-cloudy-day.svg", night: "partly-cloudy-night.svg", description: "Teilweise bewölkt" },
  3: { day: "overcast-day.svg", night: "overcast-night.svg", description: "Bedeckt" },

  // Nebel
  45: { day: "fog-day.svg", night: "fog-night.svg", description: "Nebel" },
  48: { day: "fog-day.svg", night: "fog-night.svg", description: "Raufrostnebel" },

  // Sprühregen (Drizzle)
  51: { day: "drizzle.svg", night: "drizzle.svg", description: "Leichter Sprühregen" },
  53: { day: "drizzle.svg", night: "drizzle.svg", description: "Mäßiger Sprühregen" },
  55: { day: "drizzle.svg", night: "drizzle.svg", description: "Starker Sprühregen" },
  56: { day: "sleet.svg", night: "sleet.svg", description: "Leichter gefrierender Sprühregen" },
  57: { day: "sleet.svg", night: "sleet.svg", description: "Starker gefrierender Sprühregen" },

  // Regen
  61: { day: "rain.svg", night: "rain.svg", description: "Leichter Regen" },
  63: { day: "rain.svg", night: "rain.svg", description: "Mäßiger Regen" },
  65: { day: "rain.svg", night: "rain.svg", description: "Starker Regen" },
  66: { day: "sleet.svg", night: "sleet.svg", description: "Leichter gefrierender Regen" },
  67: { day: "sleet.svg", night: "sleet.svg", description: "Starker gefrierender Regen" },

  // Schnee
  71: { day: "snow.svg", night: "snow.svg", description: "Leichter Schneefall" },
  73: { day: "snow.svg", night: "snow.svg", description: "Mäßiger Schneefall" },
  75: { day: "snow.svg", night: "snow.svg", description: "Starker Schneefall" },
  77: { day: "hail.svg", night: "hail.svg", description: "Schneegriesel" },

  // Regenschauer
  80: { day: "partly-cloudy-day-drizzle.svg", night: "partly-cloudy-night-drizzle.svg", description: "Leichte Regenschauer" },
  81: { day: "partly-cloudy-day-rain.svg", night: "partly-cloudy-night-rain.svg", description: "Mäßige Regenschauer" },
  82: { day: "partly-cloudy-day-rain.svg", night: "partly-cloudy-night-rain.svg", description: "Heftige Regenschauer" },

  // Schneeschauer
  85: { day: "partly-cloudy-day-snow.svg", night: "partly-cloudy-night-snow.svg", description: "Leichte Schneeschauer" },
  86: { day: "partöy-cloudy-day-snow.svg", night: "partly-cloudy-night-snow.svg", description: "Starke Schneeschauer" },

  // Gewitter
  95: { day: "thunderstorms-day.svg", night: "thunderstorms-night.svg", description: "Gewitter" },
  96: { day: "thunderstorms-day-rain.svg", night: "thunderstorms-night-rain.svg", description: "Gewitter mit leichtem Hagel" },
  99: { day: "thunderstorms-day-rain.svg", night: "thunderstorms-nicht-rain.svg", description: "Gewitter mit starkem Hagel" }
};