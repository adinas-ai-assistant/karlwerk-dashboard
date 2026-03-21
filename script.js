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
      a.href = story.url || 'https://news.ycombinator.com/item?id=' + story.id;
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

loadWeather();
loadNews();
