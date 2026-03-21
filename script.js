// Weather canvas — rain, storm (+ lightning), snow, cloudy (clouds), sunny (rays), off
const weatherCanvas = (function () {
  const canvas = document.getElementById('rain-canvas');
  const ctx = canvas.getContext('2d');
  let mode = 'rain';
  let drops = [];
  let clouds = [];
  let lightning = null;

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

  function makeCloud(scattered) {
    return {
      x: scattered ? Math.random() * canvas.width : canvas.width + 350,
      y: 30 + Math.random() * (canvas.height * 0.42),
      speed: 0.12 + Math.random() * 0.22,
      size: 75 + Math.random() * 130,
      opacity: 0.055 + Math.random() * 0.065,
    };
  }

  function drawCloud(x, y, size, opacity) {
    const puffs = [[0,0,0.50],[0.38,-0.12,0.38],[-0.32,0.06,0.36],[0.18,0.14,0.42],[0.60,0.06,0.30],[-0.54,0.10,0.27]];
    ctx.fillStyle = 'rgba(200, 212, 228, ' + opacity + ')';
    puffs.forEach(([px, py, pr]) => {
      ctx.beginPath();
      ctx.arc(x + px * size, y + py * size, pr * size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function triggerLightning() {
    const x = canvas.width * (0.15 + Math.random() * 0.7);
    const pts = [{ x, y: -10 }];
    let cy = -10;
    while (cy < canvas.height * 0.65) {
      cy += 25 + Math.random() * 45;
      pts.push({ x: pts[pts.length - 1].x + (Math.random() - 0.5) * 75, y: cy });
    }
    lightning = { pts, opacity: 1.0 };
  }

  function drawLightning() {
    if (!lightning && Math.random() < 0.004) triggerLightning();
    if (!lightning) return;
    ctx.fillStyle = 'rgba(210, 228, 255, ' + (lightning.opacity * 0.09) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    [{ w: 8, a: 0.30 }, { w: 1.5, a: 1.0 }].forEach(({ w, a }) => {
      ctx.beginPath();
      ctx.moveTo(lightning.pts[0].x, lightning.pts[0].y);
      lightning.pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(220, 242, 255, ' + (lightning.opacity * a) + ')';
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
    lightning.opacity -= 0.045;
    if (lightning.opacity <= 0) lightning = null;
  }

  function drawSunny(t) {
    const cx = canvas.width / 2;
    const cy = canvas.height + 90;
    const numRays = 10;
    for (let i = 0; i < numRays; i++) {
      const angle = Math.PI + (Math.PI * i / numRays);
      const pulse = 0.72 + 0.28 * Math.sin(t * 0.0007 + i * 0.65);
      const len = canvas.height * 1.25 * pulse;
      const x2 = cx + Math.cos(angle) * len;
      const y2 = cy + Math.sin(angle) * len;
      const grd = ctx.createLinearGradient(cx, cy, x2, y2);
      grd.addColorStop(0, 'rgba(255, 190, 70, 0.13)');
      grd.addColorStop(0.55, 'rgba(255, 165, 40, 0.05)');
      grd.addColorStop(1, 'rgba(255, 165, 40, 0)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grd;
      ctx.lineWidth = 55 + 18 * Math.sin(t * 0.0009 + i);
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.height * 0.65);
    glow.addColorStop(0, 'rgba(255, 175, 50, 0.09)');
    glow.addColorStop(1, 'rgba(255, 175, 50, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function setMode(newMode) {
    mode = newMode;
    drops = [];
    clouds = [];
    lightning = null;
    if (newMode === 'rain' || newMode === 'storm') {
      const n = newMode === 'storm' ? 260 : 180;
      for (let i = 0; i < n; i++) drops.push(makeRain(true, newMode === 'storm'));
    } else if (newMode === 'snow') {
      for (let i = 0; i < 120; i++) drops.push(makeSnow(true));
    } else if (newMode === 'cloudy' || newMode === 'partly_cloudy') {
      const n = newMode === 'partly_cloudy' ? 3 : 5;
      for (let i = 0; i < n; i++) clouds.push(makeCloud(true));
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'sunny') {
      drawSunny(t);
    } else if (mode === 'cloudy' || mode === 'partly_cloudy') {
      clouds.forEach(c => {
        drawCloud(c.x, c.y, c.size, c.opacity);
        c.x -= c.speed;
        if (c.x < -c.size * 1.6) Object.assign(c, makeCloud(false));
      });
    } else if (mode === 'rain' || mode === 'storm') {
      if (mode === 'storm') drawLightning();
      drops.forEach(d => {
        const grd = ctx.createLinearGradient(d.x, d.y, d.x - d.dx * (d.len / d.speed), d.y - d.len);
        grd.addColorStop(0, 'rgba(174, 210, 240, ' + d.opacity + ')');
        grd.addColorStop(1, 'rgba(174, 210, 240, 0)');
        ctx.beginPath(); ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.dx * (d.len / d.speed), d.y - d.len);
        ctx.strokeStyle = grd; ctx.lineWidth = d.width; ctx.lineCap = 'round'; ctx.stroke();
        d.x += d.dx; d.y += d.speed;
        if (d.y > canvas.height + d.len || d.x < -150) Object.assign(d, makeRain(false, mode === 'storm'));
      });
    } else if (mode === 'snow') {
      drops.forEach(d => {
        d.drift += d.driftSpeed;
        d.x += d.dx + Math.sin(d.drift) * 0.4; d.y += d.speed;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 235, 255, ' + d.opacity + ')'; ctx.fill();
        if (d.y > canvas.height + 10) Object.assign(d, makeSnow(false));
      });
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  setMode('rain');
  requestAnimationFrame(draw);
  return { setMode };
})();

// Weather modes — bg colour, canvas mode, emoji icon
const WEATHER_MODES = {
  sunny:         { bg: '#1d1b11', canvas: 'sunny',         icon: '☀️' },
  partly_cloudy: { bg: '#1a1a1a', canvas: 'partly_cloudy', icon: '⛅' },
  cloudy:        { bg: '#161820', canvas: 'cloudy',        icon: '☁️' },
  foggy:         { bg: '#141618', canvas: 'cloudy',        icon: '🌫️' },
  rainy:         { bg: '#1a1a1a', canvas: 'rain',          icon: '🌧️' },
  snowy:         { bg: '#141820', canvas: 'snow',          icon: '❄️' },
  stormy:        { bg: '#0e0e14', canvas: 'storm',         icon: '⛈️' },
};

function codeToMode(code, isDay) {
  if (code === 0) return isDay ? 'sunny' : 'partly_cloudy';
  if (code <= 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy';
  if (code >= 95) return 'stormy';
  return 'rainy';
}

function codeToEmoji(code, isDay) {
  const mode = codeToMode(code, isDay);
  return (WEATHER_MODES[mode] || WEATHER_MODES.rainy).icon;
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
      const cw = data.current_weather;
      const tempEl = document.getElementById('city-temp-' + city.id);
      const emojiEl = document.getElementById('city-emoji-' + city.id);
      if (tempEl) tempEl.textContent = Math.round(cw.temperature) + '°';
      if (emojiEl) emojiEl.textContent = codeToEmoji(cw.weathercode, cw.is_day);
    } catch (e) {}
  }));
}

initWeatherOverride();
loadWeather();
loadNews();
loadTldr();
loadCities();
