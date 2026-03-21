# karlwerk.pro Daily Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a moody lo-fi personal daily dashboard at karlwerk.pro showing Prague weather and top HackerNews stories.

**Architecture:** Three static files (index.html, style.css, script.js) served via Cloudflare Pages, connected to GitHub for auto-deploy on push to main. All data fetched client-side from free public APIs at page load.

**Tech Stack:** Vanilla HTML/CSS/JS, Open-Meteo API, HackerNews Firebase API, GitHub, Cloudflare Pages

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Page structure: header, weather block, news block |
| `style.css` | All styling: dark palette, IBM Plex Mono font, rain animation, layout |
| `script.js` | API fetching, DOM updates, live clock, error fallbacks |

---

### Task 1: Create GitHub repo and push scaffold

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `script.js`

- [ ] **Step 1: Create the GitHub repo**

```bash
export GH_TOKEN=$(grep GH_TOKEN /home/claude-svc/projects/.env | cut -d= -f2)
export CLOUDFLARE_TOKEN=$(grep CLOUDFLARE_TOKEN /home/claude-svc/projects/.env | cut -d= -f2)
gh repo create karlwerk-dashboard --public --description "karlwerk.pro daily dashboard" --source /home/claude-svc/projects/website --remote origin --push
```

Expected: Repo created, initial commit pushed.

- [ ] **Step 2: Add adinafxv as collaborator**

```bash
GH_ACCOUNT=$(gh api user --jq '.login')
gh api repos/${GH_ACCOUNT}/karlwerk-dashboard/collaborators/adinafxv -X PUT -f permission=push
```

Expected: HTTP 201 or 204.

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>karlwerk</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="rain"></div>
  <main>
    <header>
      <div id="date"></div>
      <div id="clock"></div>
    </header>

    <section class="block" id="weather-block">
      <div class="block-label">// prague</div>
      <div class="weather-temp"><span id="temp">--</span><span class="unit">°C</span></div>
      <div class="weather-meta">
        <span>feels like <span id="feels">--</span>°C</span>
      </div>
      <div class="weather-row">
        <span>&#8593; <span id="sunrise">--:--</span></span>
        <span>&#8595; <span id="sunset">--:--</span></span>
        <span>UV <span id="uv">--</span> <span id="uv-label" class="uv-label"></span></span>
      </div>
    </section>

    <section class="block" id="news-block">
      <div class="block-label">// hacker news</div>
      <ul id="news-list">
        <li class="loading">loading...</li>
      </ul>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create style.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #1a1a1a;
  --surface: #212121;
  --border: #2e2e2e;
  --text: #c8c8c8;
  --muted: #666;
  --amber: #c9a96e;
  --green: #7aab8a;
  --blue: #8ab4c9;
}

html, body {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 15px;
  line-height: 1.6;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
}

.rain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.rain::before, .rain::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 200%;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 4px,
    rgba(140, 160, 180, 0.035) 4px,
    rgba(140, 160, 180, 0.035) 5px
  );
  background-size: 3px 20px;
  animation: rain 2.5s linear infinite;
}

.rain::after {
  left: 50%;
  animation-delay: -1.25s;
  animation-duration: 3s;
  opacity: 0.6;
}

@keyframes rain {
  from { transform: translateY(0); }
  to   { transform: translateY(50%); }
}

main {
  position: relative;
  z-index: 2;
  max-width: 560px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

header { margin-bottom: 2.5rem; }

#date {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

#clock {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.04em;
  margin-top: 0.2rem;
}

.block {
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.block-label {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 1rem;
}

.weather-temp {
  font-size: 3rem;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.unit {
  font-size: 1.2rem;
  color: var(--muted);
  margin-left: 0.2rem;
}

.weather-meta {
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 1rem;
}

.weather-row {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: var(--amber);
  flex-wrap: wrap;
}

.weather-row span span { color: var(--text); }

.uv-label {
  font-size: 0.7rem;
  color: var(--green);
  letter-spacing: 0.08em;
}

#news-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

#news-list li { font-size: 0.85rem; line-height: 1.5; }
#news-list li.loading { color: var(--muted); }

#news-list a {
  color: var(--blue);
  text-decoration: none;
}

#news-list a:hover { text-decoration: underline; }

.news-score {
  display: block;
  font-size: 0.7rem;
  color: var(--muted);
  margin-top: 0.15rem;
}
```

- [ ] **Step 5: Create script.js**

Note: All DOM manipulation uses safe methods (textContent, createElement, setAttribute) — no innerHTML with API data.

```javascript
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
      a.textContent = story.title; // safe: textContent, not innerHTML

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
```

- [ ] **Step 6: Commit and push all files**

```bash
cd /home/claude-svc/projects/website
git add index.html style.css script.js
git commit -m "feat: add dashboard HTML, CSS, and JS"
git push origin main
```

Expected: All three files on GitHub main branch.

---

### Task 2: Set up Cloudflare Pages and connect GitHub repo

- [ ] **Step 1: Load tokens and get account info**

```bash
export GH_TOKEN=$(grep GH_TOKEN /home/claude-svc/projects/.env | cut -d= -f2)
export CLOUDFLARE_TOKEN=$(grep CLOUDFLARE_TOKEN /home/claude-svc/projects/.env | cut -d= -f2)
GH_ACCOUNT=$(gh api user --jq '.login')
echo "GitHub account: $GH_ACCOUNT"
echo "CF Account ID: fd446a432239fd8bcb80ce5eb8631003"
```

- [ ] **Step 2: Create Cloudflare Pages project**

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/fd446a432239fd8bcb80ce5eb8631003/pages/projects" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"name\": \"karlwerk-dashboard\",
    \"production_branch\": \"main\",
    \"source\": {
      \"type\": \"github\",
      \"config\": {
        \"owner\": \"$GH_ACCOUNT\",
        \"repo_name\": \"karlwerk-dashboard\",
        \"production_branch\": \"main\",
        \"pr_comments_enabled\": false,
        \"deployments_enabled\": true
      }
    },
    \"build_config\": {
      \"build_command\": \"\",
      \"destination_dir\": \"\"
    }
  }" | python3 -m json.tool | grep -E '"name"|"subdomain"|"success"'
```

Expected: `"subdomain": "karlwerk-dashboard.pages.dev"` and `"success": true`.

If the API returns a GitHub OAuth error: connect GitHub to Cloudflare Pages manually via the Cloudflare dashboard (Pages → Create project → Connect to Git), then re-run to verify the project exists.

- [ ] **Step 3: Verify Pages project exists**

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/fd446a432239fd8bcb80ce5eb8631003/pages/projects/karlwerk-dashboard" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" | python3 -m json.tool | grep -E '"name"|"subdomain"'
```

Expected: Project found with `"subdomain": "karlwerk-dashboard.pages.dev"`.

---

### Task 3: Configure custom domain karlwerk.pro

- [ ] **Step 1: Add karlwerk.pro as custom domain**

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/fd446a432239fd8bcb80ce5eb8631003/pages/projects/karlwerk-dashboard/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name": "karlwerk.pro"}' | python3 -m json.tool | grep -E '"name"|"status"'
```

Expected: `"status": "active"` (auto-configured since karlwerk.pro is already on Cloudflare DNS).

- [ ] **Step 2: Wait for deployment and verify**

```bash
sleep 60
curl -s -o /dev/null -w "%{http_code}" https://karlwerk.pro
```

Expected: `200`.

- [ ] **Step 3: Trigger and verify auto-deploy pipeline**

```bash
cd /home/claude-svc/projects/website
echo "# karlwerk dashboard" > README.md
git add README.md
git commit -m "chore: add readme, verify deploy pipeline"
git push origin main
sleep 60
curl -s -o /dev/null -w "%{http_code}" https://karlwerk.pro
```

Expected: `200` after deploy completes.

---

### Task 4: Final verification and notify user

- [ ] **Step 1: Verify live site loads weather data**

```bash
curl -s https://karlwerk.pro | grep -c "IBM Plex Mono"
```

Expected: `1` (font reference present in HTML).

- [ ] **Step 2: Notify user on Discord**

Send via Discord reply tool:
```
Live at https://karlwerk.pro
```

---

## Environment Variables

| Variable | Location |
|----------|----------|
| `GH_TOKEN` | `/home/claude-svc/projects/.env` |
| `CLOUDFLARE_TOKEN` | `/home/claude-svc/projects/.env` |
| CF Account ID | `fd446a432239fd8bcb80ce5eb8631003` (confirmed) |
| CF Zone ID (karlwerk.pro) | `fff8dee631e0d86c5caa33dd2b72a378` (confirmed) |
