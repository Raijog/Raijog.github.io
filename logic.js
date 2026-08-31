
const addressGeoCoding = 'https://geocoding-api.open-meteo.com/v1/';
const addressOpenMeteo = 'https://api.open-meteo.com/v1/';
const addressGoogleMaps = 'https://www.google.com/maps/search/?api=1&query=';
const currentOM = 'current=temperature_2m,weather_code,wind_speed_10m,is_day';
const hourlyOM = 'hourly=weather_code,temperature_2m,precipitation_probability,is_day&forecast_hours=48';
const dailyOM = 'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=16&timezone=auto';
const lang = 'de';
const input = document.querySelector('input');
const weatherIcon = document.querySelector('img');
const tempP = document.querySelector('.current-weather-temp');
const titleP = document.querySelector('.current-weather-title');
const locationSpan = document.querySelector('.current-weather-location span');
const positionSpan = document.querySelector('.current-weather-pos span');
const GpsPosition = document.querySelector('.current-weather-pos');
const dateSpan = document.querySelector('.current-weather-date span');
const weatherForecast = document.querySelector('.forecast-weather-container');
const weatherHourly = document.querySelector('.hourly-weather-container');

// Auf Standortwechsel reagieren - ausgelöst von input.js
document.addEventListener('locationChanged', (e) => {
  const newLocation = e.detail;
  
  // Wetter sofort aktualisieren
  fetchWeatherData(newLocation).then(renderWeather);
});

// Wandelt Zeitstempel in Tag und kurzem Monat um (z.B.: 3 Sep) 
function sanitizeDate (datetime) {
    const dateObj = new Date(datetime);
    const month = dateObj.toLocaleDateString(lang, { month: 'short' });
    const day = dateObj.getDate();
    return `${day} ${month}`;
}

// Ermittelt aus Zeitstempel den Wochentag (z.B.: Di) 
function sanitizeDay (datetime) {
    const dateObj = new Date(datetime);
    return dateObj.toLocaleDateString(lang, { weekday: 'short' });
}

// Wandelt Zeitstempel in deutsche Schreibweise um (z.B: 25.08.2026, 09:30)
function convertTime (datetime) {
    const dateObj = new Date(datetime.replace(" ", "T"));
    const formatiert = dateObj.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    return formatiert;
}

// Gibt die Daten von Open Meteo auf dem Browser aus
function renderWeather (data) {
    // Current day
    // Variablen für das aktuelle Wetter aus den Daten holen
    const {
        GeoCodingResult: {
            name: city,
            country: country,
            admin1: region,
            latitude: lat,
            longitude: lon
        },
        current: {
            is_day: isDay,
            temperature_2m: temp,
            time: ob_time,
            weather_code: code
        },
        generationtime_ms: time
    } = data;
    
    // Icon-Link über den Wetter-Code aus icons.js holen, abhängig ob die Abfrage am Tag oder in der Nacht erfolge
    const src = `./Icons/${isDay ? wmoMeteoconsMap[code]?.day : wmoMeteoconsMap[code]?.night}`;
    
    tempP.innerText = `${temp} °C`;
    titleP.innerText = wmoMeteoconsMap[code]?.description; // Wetterbeschreibung ausgeben, falls in jcons.js vorhanden
    locationSpan.innerText = `${city} (${region}, ${country})`; // Ort mit Bundesland und Land ausgeben
    positionSpan.innerHTML = `&nbsp; Lat &nbsp; / &nbsp; Lon: &nbsp; ${lat}° &nbsp;&nbsp; ${lon}°`; // GPS-Daten ausgeben
    dateSpan.innerText = convertTime(ob_time); // Abfrage Datum und Zeit ausgeben
    weatherIcon.setAttribute('src', src); // Icon darstellen
    
    // Hyperlink für Google-Maps mit GPS-Daten des Abfrageortes füllen
    const mapsUrl = `${addressGoogleMaps}${lat},${lon}`;
    GpsPosition.setAttribute('data-tooltip', `Google Maps: ${city} öffnen`);
    GpsPosition.onclick = (e) => {
        e.preventDefault();
        window.open(mapsUrl, '_blank');
    }

    // Hourly Container
    weatherHourly.textContent = '';
    const now = new Date(ob_time.replace(" ", "T")); // aktueller Zeitstempel am Ort der Wetterabfrage
    // Index in der Stundenvorhersage suchen, der größer als 'now' ist
    const startIndex = data.hourly.time.findIndex(timeStr => new Date(timeStr) >= now);

    if (startIndex === -1) return; // Abbruch, wenn kein Index gefunden wurde

    // für die nächsten 24h den Zeitstempel holen+
    const next24HoursTimes = data.hourly.time.slice(startIndex, startIndex + 24);

    // HTML-Code für jede volle Stunde zusammenstellen
    next24HoursTimes.forEach((timeStr, index) => {
        const dataIndex = startIndex + index; // index auf data.hourly berechnen

        // Zeitstempel auf hh:mm ändern
        const date = new Date(timeStr);
        const timeFormatted = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        const temp = Math.round(data.hourly.temperature_2m[dataIndex]); // Temperatur runden
        const rain = data.hourly.precipitation_probability[dataIndex];  // Regenwahrscheinlichkeit
        
        const rawCode = data.hourly.weather_code[index]; // Wettercode
        const is_Day = data.hourly.is_day[index];         // Tag/Nacht-Kennung
        
        // Wenn Wettercode ok, dann Link auf Wettersymbol holen
        const icon = rawCode !== null && rawCode !== undefined
            ? `<img src="./Icons/${is_Day ? wmoMeteoconsMap[rawCode].day : wmoMeteoconsMap[rawCode].night}" width="40">`
            : `<span class="no-icon"></span>`;

        // HTML-Code für jeden Wert zusammenstellen
        const timeSpan = `<span class="hour-time">${timeFormatted}</span>`;
        const iconSpan = `<span class="hour-icon">${icon}</span>`;
        const tempSpan = `<span class="hour-temp">${temp}°C</span>`;
        const rainSpan = `<span class="hour-rain">💧 ${rain}%</span>`;

        // DIV-Element erstellen, Klassennamen vergeben (für CSS), und die Werte hinzufügen
        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `${timeSpan} ${iconSpan} ${tempSpan} ${rainSpan}`;

        weatherHourly.appendChild(card); // DIV-Element dem Container hinzufügen
    });

    // Forecast - next days
    // HTML-Daten für das Grid zusammenstellen
    // Map sorgt dafür, dass das Array der Vorhersagen nacheinander abgearbeitet wird
    // Die integrierte function erzeugt einen Index über das Array time und gibt in datetime
    // den Zeitstempel zurück.
    // Der Returnwert der Funktion enthält den HTML-Code für einen Vorhersagetag.
    // über join werden alle Tage zu einem HTML-Stream zusammengefügt
    const HTML = data.daily.time.map(function(datetime, index) {
        const rawCode = data.daily.weather_code[index];
        const maxTemp = data.daily.temperature_2m_max?.[index] ?? '-'; // '-', wenn keine Temp im Array
        const minTemp = data.daily.temperature_2m_min?.[index] ?? '-'; // '-', wenn keine Temp im Array

        // Link zum Icon ermitteln, sofern ein Wettercode in den Daten vorhanden ist,
        // anderfalls einen nicht visuellen HTML-Code ausgeben <span></span>
        const icon = rawCode !== null && rawCode !== undefined
            ? `<img src="./Icons/${wmoMeteoconsMap[rawCode].day}" width="35">`
            : `<span class="no-icon"></span>`;
        const tempMaxSpan = `<span>${maxTemp}</span>`;
        const tempMinSpan = `<span><small>${minTemp}</small></span>`;
        const description = `<span><small>${wmoMeteoconsMap[rawCode]?.description}</small></span>`;
        const day = `<span><small>${sanitizeDay(datetime)} &nbsp; ${sanitizeDate(datetime)}</small></span>`;
        return `${icon} ${day} ${description} ${tempMaxSpan} ${tempMinSpan} &nbsp; °C`;
    }).join('');

    weatherForecast.innerHTML = HTML; // Grid mit allen Vorhersagen füllen 
}

// Wetterdaten von api.open-meteo für aktuellen Zeitpunkt und für die Vorhersage abfragen
async function fetchWeatherData(location) {
    try {
        const weatherUrl = `${addressOpenMeteo}forecast?latitude=${location.latitude}&longitude=${location.longitude}&${currentOM}&${hourlyOM}&${dailyOM}`;
        // const weatherUrl = `${addressOpenMeteo}forecast?latitude=${location.latitude}&longitude=${location.longitude}&${currentOM}&${dailyOM}`;
        const weatherResponse = await fetch(weatherUrl); // Daten von Open Meteo holen
        let weatherData = await weatherResponse.json();  // und in weatherData hinterlegen

        // zusätzlich in der Rubrik "GeoCodingResult" Ort, Bundesland, Land und genaue GPS-Daten
        // von der GeoCoding Abfrage hinzufügen 
        weatherData["GeoCodingResult"] = location;
        return weatherData;
    } catch (error) {
        console.error("Fehler beim Abrufen der Wetterdaten:", error);
    }   
}

// Sorgt für einen Container (in diesem Programm für die stündliche Tageswettervoschau),
// dass diese per gedrückter Maustaste oder dem Mausrad verschoben werden kann
function enableDragToScroll(container){
    let isDown = false;
    let startX;
    let scrollLeft;

    // 1. Maistaste wird gedrückt
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.style.cursor = 'grabbing'; // Hand-Symbol geschlossener Anpacker
        container.style.userSelect = "none"; // verhindert unbeabscihtliches Markieren von Text

        // Startposition merken
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    // 2. Maus verlässt das Element
    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    // 3. Maustaste wird losgelassen
    container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    // 4. Maus wird bewegt
    container.addEventListener('mousemove', (e) => {
        if (!isDown) return; // Abbrechen, wenn Maustaste nicht gedrückt ist
        e.preventDefault();

        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 4; // 4 bestimmt die Scroll-Geschwindigkeit

        container.scrollLeft = scrollLeft - walk;
    });

    // 5. Vorschau per Mausrad verschieben
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
    }, { passive: false });
}
