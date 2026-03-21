// Rain canvas
(function () {
  const canvas = document.getElementById('rain-canvas');
  const ctx = canvas.getContext('2d');
  const DROP_COUNT = 180;
  const WIND = 0.18; // lean factor
  const drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeDrop(randomY) {
    const speed = 12 + Math.random() * 14;
    const len = 18 + Math.random() * 38;
    return {
      x: Math.random() * (canvas.width + 200) - 100,
      y: randomY ? Math.random() * canvas.height : -len - Math.random() * canvas.height,
      len,
      speed,
      dx: -speed * WIND,
      opacity: 0.25 + Math.random() * 0.45,
      width: 0.6 + Math.random() * 0.8
    };
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < DROP_COUNT; i++) drops.push(makeDrop(true));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops.forEach(d => {
      // gradient streak: bright tip fading to transparent tail
      const grd = ctx.createLinearGradient(
        d.x, d.y,
        d.x - d.dx * (d.len / d.speed),
        d.y - d.len
      );
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

      if (d.y > canvas.height + d.len || d.x < -150) {
        const nd = makeDrop(false);
        Object.assign(d, nd);
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// Live clock
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('date').textContent =
    now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
  } catch (e) {
    console.error('Weather load failed:', e);
  }
}

async function loadNews() {
  const list = document.getElementById('news-list');
  try {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());
    const top3 = await Promise.all(
      ids.slice(0, 3).map(id =>
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

async function loadTldr() {
  const list = document.getElementById('tldr-list');
  try {
    const data = await fetch(
      'https://api.rss2json.com/v1/api.json?rss_url=https://tldr.tech/api/rss/tech'
    ).then(r => r.json());

    if (!data.items || !data.items.length) throw new Error('No items');

    const latest = data.items[0];
    const issueUrl = /^https?:\/\//.test(latest.link || '') ? latest.link : 'https://tldr.tech';
    const pubDate = latest.pubDate ? latest.pubDate.slice(0, 10) : '';

    // Title is comma-separated story headlines e.g. "Story A 💰, Story B 💻, Story C 🤖"
    const stories = latest.title.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);

    list.textContent = '';
    stories.forEach((headline, i) => {
      const li = document.createElement('li');

      const a = document.createElement('a');
      a.href = issueUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = headline;

      li.appendChild(a);
      if (i === 0) {
        const date = document.createElement('span');
        date.className = 'news-score';
        date.textContent = pubDate;
        li.appendChild(date);
      }
      list.appendChild(li);
    });
  } catch (e) {
    list.textContent = '';
    const li = document.createElement('li');
    li.className = 'loading';
    li.textContent = 'could not load tldr';
    list.appendChild(li);
  }
}

loadWeather();
loadNews();
loadTldr();
