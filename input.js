const cityInput = document.getElementById('city-input');
const selectionWrapper = document.getElementById('selection-wrapper');
const resultsSelect = document.getElementById('results-select');
const statusSelect = document.getElementById('status');

const STORAGE_KEY = 'last_selected_locations';
const maxCitiesInDropdown = 10;

const geoCodingUrl = 'https://geocoding-api.open-meteo.com/v1/';

let debounceTimer;

// Beim Initialisieren/Laden der Seite gespeicherten Ort abrufen
document.addEventListener('DOMContentLoaded', () => {
  loadStoredLocationOnStart();
  enableDragToScroll(weatherHourly); // Grabber für Hourly Container
});

// Event mit neuen Ort auslösen
function sendLocationEvent(locationData) {
  const event = new CustomEvent('locationChanged', {detail: locationData});
  document.dispatchEvent(event);
}

// Gesamte Verlaufliste aus localStorage holen
function getStoredLocations() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [parsed]; // Abwärtskompatibel, falls vorher nur 1 Objekt gespeichert
  } catch (e) {
    return [];
  }
}

// Neuen Ort speichern und Event auslösen
function saveAndSendLocation(item) {
   const locationData = {
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      admin1: item.admin1 || '',
      country: item.country || ''
    };

  // 1. Bisherigen Verlauf laden
  let locations = getStoredLocations();

  // 2. Dupplicate entfernen (anhand von Name, Lat und Lon)
  locations = locations.filter(loc =>
    !(loc.latitude === locationData.latitude && loc.longitude === locationData.longitude)
  );

  // 3. Neuen Ort ganz vorne anfügen
  locations.unshift(locationData);

  // 4. Auf maximal x Einträge begrenzen
  if (locations.length > maxCitiesInDropdown) {
    locations = locations.slice(0, maxCitiesInDropdown);
  }

  // 5. In Browserdatenbank speichern 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));

  // Dropdown-Fenster schließen und Status löschen
  selectionWrapper.style.display = 'none';
  statusSelect.textContent = '';
  
  // Neuen Ort in Input-Feld schreiben
  if (cityInput) {
    cityInput.value = locationData.name;
  }

  sendLocationEvent(locationData); // Event auslösen
}

// Letzten Ort aus Browserdatenbank holen und Event auslösen
 function loadStoredLocationOnStart() {
   const locations = getStoredLocations();
   if (locations.length === 0) return;

   const lastLocation = locations[0]; // Der neuste Ort steht an erster Stelle
  
   // Wenn in Input-Zeile etwas steht und ein Ortsname in locationData
   // vorhanden ist, die Input-Zeile überschreiben
   if (cityInput && lastLocation.name) {
     cityInput.value = lastLocation.name;
   }
   sendLocationEvent(lastLocation);  
 }
// Zeigt die bis zu x zuletzt gewählten Orte im Dropdown an
function showRecentLocationsDropdown() {
  const locations = getStoredLocations();
  if (locations.length === 0) return;

  resultsSelect.textContent = '';

  const defaultOption = document.createElement('option');
  defaultOption.textContent = `-- Letzte Suchanfragen (${locations.length}) --`;
  defaultOption.value = '';
  resultsSelect.appendChild(defaultOption);

  locations.forEach((item) => {
    const option = document.createElement('option');
    const details = [item.admin1, item.country].filter(Boolean).join(', ');
    option.textContent = `🕒 ${item.name} ${details ? `(${details})` : ''}`;
    option.value = JSON.stringify(item);
    resultsSelect.appendChild(option);
  });

  selectionWrapper.style.display = 'block';
  statusSelect.textContent = '';
}

// Live-Suche beim Tippen
cityInput.addEventListener('input', (e) => {
  const query = e.target.value.trim(); // Ort aus Input-Zeile ohne Leerzeichen übernehmen

  clearTimeout(debounceTimer); // Timeout zurücksetzen

  // Wenn weniger als 3 Zeichen: Zeige stattdessen wieder den Verlauf an (falls vorhanden)
  if (query.length < 3) {
    const locations = getStoredLocations();
    if (locations.length > 0) {
      showRecentLocationsDropdown();
      statusSelect.textContent = query.length > 0 ? 'Bitte mindestens 3 Zeichen eingeben...' : '';
    } else {
      selectionWrapper.style.display = 'none';
      resultsSelect.textContent = '';
      statusSelect.textContent = query.length > 0 ? 'Bitte mindestens 3 Zeichen eingeben...' : '';
    }
    return;
  }

  // Timeout auf 300ms setzen, bevor searchLocation aufgerufen wird,
  // um eine schnelle Eingabe im Input-Feld nicht ständig zu unterbrechen
  debounceTimer = setTimeout(() => {
    searchLocation(query);
  }, 300);
});

// Beim Klick/Fokus ins Inputfeld den bisherigen Text markieren & alte Treffer ausblenden
cityInput.addEventListener('focus', () => {
  cityInput.select(); // Markiert den gesamten Text -> erstes Tippen überschreibt ihn sofort
  showRecentLocationsDropdown(); // Öffnet direkt die letzten x Orte
});

// Anfrage bei geocoding-API
async function searchLocation(query) {
  statusSelect.textContent = 'Suche läuft...'; // Status ausgeben, falls die Anfrage länger dauert

  // 1. Ort und optionales Land am Komma trennen
  const parts = query.split(',').map(p => p.trim());
  const cityName = parts[0];
  const countryInput = parts[1] || ''; // Leer, falls keine Komma eingegeben wurde
  
  if (!cityName) return; // Falls kein Ortsname angegeben, dann sofort Funktion verlassen
  
  // 2. API-URL aufbauen
  let url = `${geoCodingUrl}search?name=${encodeURIComponent(cityName)}&count=100`;

  // Wenn ein 2-stelliger Code wie DE, AT, NL angegeben wurde, diese an die url anhängen
  if (countryInput && countryInput.length === 2) {
      url += `&countryCode=${encodeURIComponent(countryInput.toUpperCase())}`;
  }
  
  // Restliche Parameter anhängen
  url += `&language=de&format=json`;

  try {
    const response = await fetch(url);  // Anfrage starten
    const data = await response.json(); // und Ergebnis in data ablegen

    // Wenn kein Ergebnis vorliegt, Dropdown-Fenster schließen, Status anpassen und Funktion verlassen
    if (!data.results || data.results.length === 0) {
      selectionWrapper.style.display = 'none';
      statusSelect.textContent = 'Keine Orte gefunden.';
      return;
    }

    let filteredResults = data.results; 

    // 3. Nachbearbeitung: Falls ein ausgeschreibenes Land eingetragen wurde (z.B. Belgien statt BE)
    if (countryInput && countryInput.length > 2) {
        const countryQuery = countryInput.toLowerCase(); // Landesangabe in Kleinbuchstaben ändern

        // alle Ergbnisse von geocoding ausfiltern, die mit der Landesangabe in Teilen übereinstimmen
        const matches = data.results.filter(item =>
            item.country && item.country.toLowerCase().includes(countryQuery)
        );

        // Nur filtern, wenn wir Treffer fürs Land gefunden haben
        if (matches.length > 0) {
            filteredResults = matches;
        }
    }

    // 4. Treffer verarbeiten
    if (filteredResults.length === 1 ) {
        saveAndSendLocation(filteredResults[0]); // wenn nur 1 match gefunden wurde, diese Ort direkt nehmen
    } else {
        populateDropdown(filteredResults); // andernfalls Ergebnisse im Dropdown-Fenster anzeigen
    }

  } catch (error) {
    console.error('Fehler beim Geocoding:', error);
    statusSelect.textContent = 'Fehler bei der Ortssuche.';
  }
}

// Dropdown-Fenster anzeigen
function populateDropdown(results) {
  resultsSelect.textContent = '';

  // Dropdown-Fenster mit Überschrift erzeugen
  const defaultOption = document.createElement('option');
  defaultOption.textContent = `-- Bitte wählen (${results.length} Treffer) --`;
  defaultOption.value = ''; // Überschrift ist nicht auswählbar
  resultsSelect.appendChild(defaultOption);

  // für jedes Element der Result-Liste eine Zeile im Dropdown anlegen
  results.forEach((item) => {
    const option = document.createElement('option');
    const details = [item.admin1, item.country].filter(Boolean).join(', '); // filtert leere Einträge aus
    option.textContent = `${item.name} ${details ? `(${details})` : ''}`;
    option.value = JSON.stringify(item); // hängt das komplette item als Attribut an 
    resultsSelect.appendChild(option);
  });

  selectionWrapper.style.display = 'block'; // Dropdown-Fenster einblenden
  statusSelect.textContent = ''; // Status löschen
}
+
// Bei Auswahl im Dropdown: Speichern & Anzeigen
resultsSelect.addEventListener('change', (e) => {
  if (!e.target.value) return;

  const selectedLocation = JSON.parse(e.target.value);
  saveAndSendLocation(selectedLocation);
});
