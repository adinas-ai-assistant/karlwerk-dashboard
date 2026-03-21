// Weather canvas — supports rain, storm, snow, off
const weatherCanvas = (function () {
  const canvas = document.getElementById('rain-canvas');
  const ctx = canvas.getContext('2d');
  let mode = 'rain';
  let drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeRain(randomY, storm) {
    const mult = storm ? 1.6 : 1;
    const speed = (10 + Math.random() * 14) * mult;
    const len = 18 + Math.random() * 38;
    return {
      x: Math.random() * (canvas.width + 200) - 100,
      y: randomY ? Math.random() * canvas.height : -len - Math.random() * canvas.height,
      len, speed,
      dx: -speed * (storm ? 0.32 : 0.18),
      opacity: (0.2 + Math.random() * 0.4) * mult,
      width: 0.6 + Math.random() * 0.8,
    };
  }

  function makeSnow(randomY) {
    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -5,
      size: 1.2 + Math.random() * 2,
      speed: 0.8 + Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 0.3,
      opacity: 0.5 + Math.random() * 0.4,
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.008 + Math.random() * 0.015,
    };
  }

  function setMode(newMode) {
    mode = newMode;
    drops = [];
    if (newMode === 'off') return;
    const count = newMode === 'snow' ? 120 : newMode === 'storm' ? 260 : 180;
    for (let i = 0; i < count; i++)
      drops.push(newMode === 'snow' ? makeSnow(true) : makeRain(true, newMode === 'storm'));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode !== 'off') {
      const isSnow = mode === 'snow';
      const isStorm = mode === 'storm';
      drops.forEach(d => {
        if (isSnow) {
          d.drift += d.driftSpeed;
          d.x += d.dx + Math.sin(d.drift) * 0.4;
          d.y += d.speed;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220, 235, 255, ' + d.opacity + ')';
          ctx.fill();
          if (d.y > canvas.height + 10) Object.assign(d, makeSnow(false));
        } else {
          const grd = ctx.createLinearGradient(d.x, d.y, d.x - d.dx * (d.len / d.speed), d.y - d.len);
          grd.addColorStop(0, 'rgba(174, 210, 240, ' + d.opacity + ')');
          grd.addColorStop(1, 'rgba(174, 210, 240, 0)');
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.dx * (d.len / d.speed), d.y - d.len);
          ctx.strokeStyle = grd;
          ctx.lineWidth = d.width;
          ctx.lineCap = 'round';
          ctx.stroke();
          d.x += d.dx;
          d.y += d.speed;
          if (d.y > canvas.height + d.len || d.x < -150) Object.assign(d, makeRain(false, isStorm));
        }
      });
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  setMode('rain');
  draw();
  return { setMode };
})();

// Weather modes — bg colour, canvas mode, icon
const WEATHER_MODES = {
  sunny:         { bg: '#1d1b11', canvas: 'off',   icon: '\u2600' }, // ☀
  partly_cloudy: { bg: '#1a1a1a', canvas: 'off',   icon: '\u26C5' }, // ⛅
  cloudy:        { bg: '#161820', canvas: 'off',   icon: '\u2601' }, // ☁
  rainy:         { bg: '#1a1a1a', canvas: 'rain',  icon: '\u2602' }, // ☂
  snowy:         { bg: '#141820', canvas: 'snow',  icon: '\u2744' }, // ❄
  stormy:        { bg: '#0e0e14', canvas: 'storm', icon: '\u26C8' }, // ⛈
};

function codeToMode(code, isDay) {
  if (code === 0) return isDay ? 'sunny' : 'partly_cloudy';
  if (code <= 2) return 'partly_cloudy';
  if (code === 3 || (code >= 45 && code <= 48)) return 'cloudy';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy';
  if (code >= 95) return 'stormy';
  return 'rainy';
}

function applyWeatherMode(modeName) {
  const cfg = WEATHER_MODES[modeName] || WEATHER_MODES.rainy;
  document.documentElement.style.setProperty('--bg', cfg.bg);
  document.body.style.background = cfg.bg;
  const iconEl = document.getElementById('weather-icon');
  if (iconEl) iconEl.textContent = cfg.icon;
  weatherCanvas.setMode(cfg.canvas);
}

const CITIES = [
  { id: 'bajamar',  label: 'bajamar',     lat: 28.5574,  lon: -16.3383,  tz: 'Atlantic/Canary' },
  { id: 'osaka',    label: 'osaka',       lat: 34.6937,  lon: 135.5023,  tz: 'Asia/Tokyo' },
  { id: 'la',       label: 'los angeles', lat: 34.0522,  lon: -118.2437, tz: 'America/Los_Angeles' },
];

// Live clock
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const clockEl = document.getElementById('clock');
  clockEl.textContent = '';
  clockEl.appendChild(document.createTextNode(t.slice(0, 5)));
  const secSpan = document.createElement('span');
  secSpan.className = 'clock-seconds';
  secSpan.textContent = t.slice(5);
  clockEl.appendChild(secSpan);

  document.getElementById('date').textContent =
    now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  CITIES.forEach(city => {
    const el = document.getElementById('city-time-' + city.id);
    if (el) el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: city.tz });
  });
}
updateClock();
setInterval(updateClock, 1000);

function uvLabel(uv) {
  if (uv <= 2) return 'low';
  if (uv <= 5) return 'moderate';
  if (uv <= 7) return 'high';
  if (uv <= 10) return 'very high';
  return 'extreme';
}

function fmtTime(iso) {
  return iso ? iso.slice(11, 16) : '--:--';
}

async function loadWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=50.0755&longitude=14.4378' +
      '&current_weather=true' +
      '&daily=sunrise,sunset,uv_index_max,apparent_temperature_max' +
      '&timezone=Europe%2FPrague&forecast_days=1';
    const data = await fetch(url).then(r => r.json());
    const cw = data.current_weather;
    const daily = data.daily;

    document.getElementById('temp').textContent = Math.round(cw.temperature);
    document.getElementById('feels').textContent = Math.round(daily.apparent_temperature_max[0]);
    document.getElementById('sunrise').textContent = fmtTime(daily.sunrise[0]);
    document.getElementById('sunset').textContent = fmtTime(daily.sunset[0]);
    const uv = Math.round(daily.uv_index_max[0]);
    document.getElementById('uv').textContent = uv;
    document.getElementById('uv-label').textContent = uvLabel(uv);

    const override = document.getElementById('weather-override');
    if (!override || !override.value) applyWeatherMode(codeToMode(cw.weathercode, cw.is_day));
  } catch (e) {
    console.error('Weather load failed:', e);
  }
}

function initWeatherOverride() {
  const sel = document.getElementById('weather-override');
  if (!sel) return;
  sel.addEventListener('change', function () {
    if (this.value) applyWeatherMode(this.value);
    else loadWeather();
  });
}

async function loadNews() {
  const list = document.getElementById('news-list');
  try {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());
    const top3 = await Promise.all(
      ids.slice(0, 5).map(id =>
        fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').then(r => r.json())
      )
    );

    list.textContent = ''; // clear loading message
    top3.forEach(story => {
      const li = document.createElement('li');

      const a = document.createElement('a');
      const rawUrl = story.url || '';
      a.href = /^https?:\/\//.test(rawUrl) ? rawUrl : 'https://news.ycombinator.com/item?id=' + story.id;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = story.title; // safe: textContent only

      const score = document.createElement('span');
      score.className = 'news-score';
      score.textContent = story.score + ' points';

      li.appendChild(a);
      li.appendChild(score);
      list.appendChild(li);
    });
  } catch (e) {
    list.textContent = '';
    const li = document.createElement('li');
    li.className = 'loading';
    li.textContent = 'could not load stories';
    list.appendChild(li);
  }
}

function renderTldrFeed(listEl, feed) {
  const stories = feed.type === 'essays'
    ? (feed.items || []).map(i => ({ title: i.title, link: i.link }))
    : (feed.title || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
        .map(t => ({ title: t, link: feed.link || 'https://tldr.tech' }));

  listEl.textContent = '';
  if (!stories.length) {
    const li = document.createElement('li');
    li.className = 'loading';
    li.textContent = 'could not load';
    listEl.appendChild(li);
    return;
  }
  stories.forEach(({ title, link }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = title;
    li.appendChild(a);
    listEl.appendChild(li);
  });
}

async function loadTldr() {
  try {
    const feeds = await fetch('/api/tldr').then(r => r.json());
    feeds.forEach(feed => {
      const listEl = document.getElementById('tldr-' + feed.key + '-list');
      if (listEl) renderTldrFeed(listEl, feed);
    });
  } catch (e) {
    ['benedict', 'tech', 'ai', 'devops', 'infosec', 'fintech', 'marketing', 'design', 'product'].forEach(key => {
      const listEl = document.getElementById('tldr-' + key + '-list');
      if (listEl) { listEl.textContent = ''; const li = document.createElement('li'); li.className = 'loading'; li.textContent = 'could not load'; listEl.appendChild(li); }
    });
  }
}

async function loadCities() {
  await Promise.all(CITIES.map(async city => {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat +
        '&longitude=' + city.lon + '&current_weather=true&forecast_days=1';
      const data = await fetch(url).then(r => r.json());
      const el = document.getElementById('city-temp-' + city.id);
      if (el) el.textContent = Math.round(data.current_weather.temperature) + '°';
    } catch (e) {}
  }));
}

initWeatherOverride();
loadWeather();
loadNews();
loadTldr();
loadCities();
