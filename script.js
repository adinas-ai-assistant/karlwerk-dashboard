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
      x: scattered ? Math.random() * (canvas.width + 200) - 100 : canvas.width + 220,
      y: 10 + Math.random() * (canvas.height * 0.28),
      speed: 0.08 + Math.random() * 0.14,
      size: 55 + Math.random() * 80,
      opacity: 0.22 + Math.random() * 0.18,
    };
  }

  function drawCloud(x, y, size, opacity) {
    // Radial gradient per puff — soft edges that blend naturally, no blur filter needed
    const puffs = [
      [0, 0, 0.52], [0.44, -0.16, 0.42], [-0.40, 0.05, 0.40],
      [0.22, 0.18, 0.44], [0.70, 0.04, 0.32], [-0.62, 0.10, 0.30],
      [0.86, 0.16, 0.24], [-0.20, -0.12, 0.30], [0.50, 0.22, 0.26],
    ];
    puffs.forEach(([px, py, pr]) => {
      const cx = x + px * size, cy = y + py * size, r = pr * size;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, 'rgba(215, 225, 242, ' + opacity + ')');
      grd.addColorStop(0.55, 'rgba(210, 220, 238, ' + (opacity * 0.55) + ')');
      grd.addColorStop(1, 'rgba(210, 220, 238, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    });
  }

  function makeBoltPath(startX, startY, maxY, spread) {
    const pts = [{ x: startX, y: startY }];
    let cy = startY;
    while (cy < maxY) {
      cy += 22 + Math.random() * 40;
      pts.push({ x: pts[pts.length - 1].x + (Math.random() - 0.5) * spread, y: cy });
    }
    return pts;
  }

  function triggerLightning() {
    const x = canvas.width * (0.15 + Math.random() * 0.7);
    const pts = makeBoltPath(x, -10, canvas.height * 0.65, 72);
    const branches = [];
    pts.forEach((p, i) => {
      if (i > 1 && i < pts.length - 1 && Math.random() < 0.30) {
        const branchLen = canvas.height * (0.08 + Math.random() * 0.14);
        branches.push(makeBoltPath(p.x, p.y, p.y + branchLen, 50));
      }
    });
    lightning = { pts, branches, opacity: 1.0 };
  }

  function strokeBolt(pts, layers, baseOpacity) {
    layers.forEach(({ w, a }) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(225, 245, 255, ' + (baseOpacity * a) + ')';
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }

  function drawLightning() {
    if (!lightning && Math.random() < 0.004) triggerLightning();
    if (!lightning) return;
    // Screen flash
    ctx.fillStyle = 'rgba(210, 230, 255, ' + (lightning.opacity * 0.12) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Main bolt: 4 layers — wide haze, outer glow, mid glow, bright core
    strokeBolt(lightning.pts, [{ w: 18, a: 0.08 }, { w: 7, a: 0.25 }, { w: 2.5, a: 0.70 }, { w: 0.8, a: 1.0 }], lightning.opacity);
    // Branches: thinner, dimmer
    lightning.branches.forEach(b => strokeBolt(b, [{ w: 5, a: 0.10 }, { w: 1.8, a: 0.40 }, { w: 0.6, a: 0.80 }], lightning.opacity * 0.65));
    lightning.opacity -= 0.042;
    if (lightning.opacity <= 0) lightning = null;
  }

  function drawSunny(t) {
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.30;
    const pulse = 0.88 + 0.12 * Math.sin(t * 0.0006);

    // Wide ambient haze around sun
    const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.height * 0.55 * pulse);
    haze.addColorStop(0, 'rgba(255, 230, 160, 0.18)');
    haze.addColorStop(0.35, 'rgba(255, 210, 100, 0.08)');
    haze.addColorStop(1, 'rgba(255, 200, 80, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun corona glow
    const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90 * pulse);
    corona.addColorStop(0, 'rgba(255, 248, 210, 0.85)');
    corona.addColorStop(0.25, 'rgba(255, 230, 150, 0.45)');
    corona.addColorStop(0.6, 'rgba(255, 210, 100, 0.12)');
    corona.addColorStop(1, 'rgba(255, 200, 80, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, 90 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Sun disc
    const disc = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, 26 * pulse);
    disc.addColorStop(0, 'rgba(255, 255, 240, 1)');
    disc.addColorStop(0.6, 'rgba(255, 240, 190, 0.95)');
    disc.addColorStop(1, 'rgba(255, 220, 140, 0.7)');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(cx, cy, 26 * pulse, 0, Math.PI * 2);
    ctx.fill();
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
      const n = newMode === 'partly_cloudy' ? 5 : 9;
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

// Weather modes — sky gradient bg, canvas mode, emoji icon
const WEATHER_MODES = {
  sunny:         { bg: 'linear-gradient(180deg, #1a3a6e 0%, #2e6bbf 45%, #5a9fd8 100%)',         canvas: 'sunny',         icon: '☀️' },
  partly_cloudy: { bg: 'linear-gradient(180deg, #1e3254 0%, #2a508e 50%, #3a70b8 100%)',         canvas: 'partly_cloudy', icon: '⛅' },
  cloudy:        { bg: 'linear-gradient(180deg, #181e30 0%, #22304e 45%, #2e4060 100%)',         canvas: 'cloudy',        icon: '☁️' },
  foggy:         { bg: 'linear-gradient(180deg, #484f58 0%, #70808e 45%, #98aab8 100%)',         canvas: 'cloudy',        icon: '🌫️' },
  rainy:         { bg: 'linear-gradient(180deg, #101620 0%, #182030 50%, #1a2535 100%)',         canvas: 'rain',          icon: '🌧️' },
  snowy:         { bg: 'linear-gradient(180deg, #181e2c 0%, #222e46 45%, #2c3a52 100%)',         canvas: 'snow',          icon: '❄️' },
  stormy:        { bg: 'linear-gradient(180deg, #06060e 0%, #0c0e18 50%, #080a10 100%)',         canvas: 'storm',         icon: '⛈️' },
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
  document.body.style.background = cfg.bg;
  document.body.style.backgroundAttachment = 'fixed';
  document.body.dataset.weather = modeName;
  const iconEl = document.getElementById('weather-icon');
  if (iconEl) iconEl.textContent = cfg.icon;
  weatherCanvas.setMode(cfg.canvas);
}

let sunsetSeconds = null; // seconds since midnight, Prague time

function checkSunsetAlert() {
  const block = document.getElementById('sunset-alert-block');
  if (!block || sunsetSeconds === null) return;

  const t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':').map(Number);
  const nowSec = t[0] * 3600 + t[1] * 60 + t[2];
  const diffSec = sunsetSeconds - nowSec;
  const diffMin = diffSec / 60;

  const goldenSec = sunsetSeconds - 40 * 60; // golden hour starts 40 min before sunset
  const diffToGolden = goldenSec - nowSec;
  const fmt = s => String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const goldenRange = fmt(goldenSec) + ' – ' + fmt(sunsetSeconds);

  // Show 2 hours before sunset, hide 10 min after sunset
  if (diffMin <= 120 && diffMin >= -10) {
    block.style.display = '';
    const cd = document.getElementById('sunset-countdown');
    const sub = document.getElementById('sunset-sub');
    if (diffSec <= 0) {
      if (cd) cd.textContent = 'sun has set';
      if (sub) sub.textContent = 'blue hour in progress';
    } else if (diffToGolden > 0) {
      // Counting down to golden hour start
      const h = Math.floor(diffToGolden / 3600), m = Math.floor((diffToGolden % 3600) / 60), s = diffToGolden % 60;
      if (cd) cd.textContent = 'starts in ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      if (sub) sub.textContent = goldenRange;
    } else {
      // Inside golden hour
      if (cd) cd.textContent = 'golden hour · go outside now';
      const remH = Math.floor(diffSec / 3600), remM = Math.floor((diffSec % 3600) / 60), remS = diffSec % 60;
      if (sub) sub.textContent = goldenRange + ' · sunset in ' + String(remH).padStart(2, '0') + ':' + String(remM).padStart(2, '0') + ':' + String(remS).padStart(2, '0');
    }
  } else {
    block.style.display = 'none';
  }
}

const CITIES = [
  { id: 'bajamar',  label: 'bajamar',     lat: 28.5574,  lon: -16.3383,  tz: 'Atlantic/Canary' },
  { id: 'osaka',    label: 'osaka',       lat: 34.6937,  lon: 135.5023,  tz: 'Asia/Tokyo' },
  { id: 'la',       label: 'los angeles', lat: 34.0522,  lon: -118.2437, tz: 'America/Los_Angeles' },
  { id: 'kampala',  label: 'kampala',     lat: 0.3476,   lon: 32.5825,   tz: 'Africa/Kampala' },
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
  checkSunsetAlert();
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
      '&current=temperature_2m,weather_code,is_day,apparent_temperature' +
      '&daily=sunrise,sunset,uv_index_max,apparent_temperature_max' +
      '&timezone=Europe%2FPrague&forecast_days=1';
    const data = await fetch(url).then(r => r.json());
    const cw = data.current;
    const daily = data.daily;

    document.getElementById('temp').textContent = Math.round(cw.temperature_2m);
    document.getElementById('feels').textContent = Math.round(daily.apparent_temperature_max[0]);
    document.getElementById('sunrise').textContent = fmtTime(daily.sunrise[0]);
    document.getElementById('sunset').textContent = fmtTime(daily.sunset[0]);
    const sp = daily.sunset[0].slice(11, 16).split(':');
    sunsetSeconds = parseInt(sp[0]) * 3600 + parseInt(sp[1]) * 60;
    const uv = Math.round(daily.uv_index_max[0]);
    document.getElementById('uv').textContent = uv;
    document.getElementById('uv-label').textContent = uvLabel(uv);

    const override = document.getElementById('weather-override');
    if (!override || !override.value) applyWeatherMode(codeToMode(cw.weather_code, cw.is_day));
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

      const comments = document.createElement('a');
      comments.href = 'https://news.ycombinator.com/item?id=' + story.id;
      comments.target = '_blank';
      comments.rel = 'noopener noreferrer';
      comments.textContent = ' 💬';

      li.appendChild(a);
      li.appendChild(comments);
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
    ['benedict', 'other', 'tech', 'ai', 'devops', 'infosec', 'fintech', 'marketing', 'design', 'product'].forEach(key => {
      const listEl = document.getElementById('tldr-' + key + '-list');
      if (listEl) { listEl.textContent = ''; const li = document.createElement('li'); li.className = 'loading'; li.textContent = 'could not load'; listEl.appendChild(li); }
    });
  }
}

async function loadCities() {
  await Promise.all(CITIES.map(async city => {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat +
        '&longitude=' + city.lon + '&current=temperature_2m,weather_code,is_day&forecast_days=1';
      const data = await fetch(url).then(r => r.json());
      const cw = data.current;
      const tempEl = document.getElementById('city-temp-' + city.id);
      const emojiEl = document.getElementById('city-emoji-' + city.id);
      if (tempEl) tempEl.textContent = Math.round(cw.temperature_2m) + '°';
      if (emojiEl) emojiEl.textContent = codeToEmoji(cw.weather_code, cw.is_day);
    } catch (e) {}
  }));
}

initWeatherOverride();
loadWeather();
loadNews();
loadTldr();
loadCities();
