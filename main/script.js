        const btn = document.getElementById('checkBtn');
        const sel = document.getElementById('citySelect');
        const result = document.getElementById('result');
        const iconEl = document.getElementById('icon');
        const placeEl = document.getElementById('place');
        const tempEl = document.getElementById('temp');
        const descEl = document.getElementById('desc');
        const moreEl = document.getElementById('more');
        const timeEl = document.getElementById('time');
        const errorEl = document.getElementById('error');

        const weatherCodePL = {
            0: 'Czyste niebo',
            1: 'Częściowo słonecznie',
            2: 'Pochmurnie',
            3: 'Całkowite zachmurzenie',
            45: 'Mgła',
            48: 'Posypana mgła (osadzanie)',
            51: 'Lekka mżawka',
            53: 'Umiarkowana mżawka',
            55: 'Gęsta mżawka',
            56: 'Marznąca mżawka (lekka)',
            57: 'Marznąca mżawka (gęsta)',
            61: 'Lekki deszcz',
            63: 'Umiarkowany deszcz',
            65: 'Silny deszcz',
            66: 'Marznący deszcz (lekki)',
            67: 'Marznący deszcz (silny)',
            71: 'Lekki śnieg',
            73: 'Umiarkowany śnieg',
            75: 'Silny śnieg',
            77: 'Płatki lodu',
            80: 'Deszcz przelotny',
            81: 'Umiarkowane ulewy',
            82: 'Silne ulewy',
            85: 'Przelotny śnieg lekki',
            86: 'Przelotny śnieg silny',
            95: 'Burza',
            96: 'Burza z gradem (lekki)',
            99: 'Burza z gradem (silny)'
        };

        async function geocode(city) {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pl`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Błąd geokodowania');
            const data = await res.json();
            if (!data.results || data.results.length === 0) throw new Error('Nie znaleziono lokalizacji');
            return data.results[0];
        }

        async function fetchWeatherForLatLon(lat, lon) {
            const now = new Date();
            const start = now.toISOString().slice(0,13) + ':00:00Z';
            const end = start; // only need the current hour value
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=UTC`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Błąd pobierania pogody');
            return await res.json();
        }

        function getHumidityForNow(hourly) {
            if (!hourly || !hourly.time || !hourly.relativehumidity_2m) return null;
            const now = new Date();
            const nowUTC = new Date(now.toUTCString().slice(0, -4));
            const times = hourly.time;
            let bestIdx = 0;
            let bestDiff = Infinity;
            for (let i = 0; i < times.length; i++) {
                const t = new Date(times[i] + 'Z');
                const diff = Math.abs(t - nowUTC);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestIdx = i;
                }
            }
            return hourly.relativehumidity_2m[bestIdx];
        }

        function displayWeather(placeName, country, weatherData) {
            const cw = weatherData.current_weather;
            const humidity = getHumidityForNow(weatherData.hourly) || null;
            const temp = typeof cw.temperature === 'number' ? Math.round(cw.temperature) + '°C' : '';
            const code = cw.weathercode;
            const desc = weatherCodePL.hasOwnProperty(code) ? weatherCodePL[code] : 'Pogoda';
            const wind = typeof cw.windspeed === 'number' ? `${cw.windspeed} m/s` : '';

            placeEl.textContent = `${placeName}${country ? ', ' + country : ''}`;
            tempEl.textContent = temp;
            descEl.textContent = desc;
            moreEl.textContent = [humidity ? `Wilgotność: ${humidity}%` : null, wind ? `Wiatr: ${wind}` : null].filter(Boolean).join(' · ');
            iconEl.style.display = 'none';
            timeEl.textContent = 'Ostatnia aktualizacja: ' + new Date().toLocaleTimeString();
            result.hidden = false;
        }

        async function fetchWeather(city) {
            errorEl.textContent = '';
            result.hidden = true;
            try {
                const loc = await geocode(city);
                const data = await fetchWeatherForLatLon(loc.latitude, loc.longitude);
                displayWeather(loc.name, loc.country, data);
            } catch (err) {
                errorEl.textContent = err.message;
            }
        }

        btn.addEventListener('click', () => fetchWeather(sel.value));
        // load default
        fetchWeather(sel.value);
