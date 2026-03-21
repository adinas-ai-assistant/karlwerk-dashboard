# karlwerk.pro Daily Dashboard — Design Spec

**Date:** 2026-03-21
**Domain:** karlwerk.pro
**Repo:** karlwerk-dashboard (GitHub, collaborator: adinafxv)
**Deploy pipeline:** local → GitHub (`main`) → Cloudflare Pages (auto-deploy)

---

## Overview

A personal daily dashboard for karlwerk.pro. Single-page, no framework, no build step. Loads in the browser and fetches live data from two free public APIs. Aesthetic: melancholic, lo-fi, moody — like a rainy Prague morning.

---

## Architecture

**Files:**
- `index.html` — structure and layout
- `style.css` — all visual styling, rain animation, noise texture
- `script.js` — API fetching and DOM updates

**No dependencies.** No npm, no bundler, no package.json.

---

## Data Sources

### Weather — Open-Meteo API
- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Prague coordinates: `latitude=50.0755&longitude=14.4378`
- Fields: `current_weather` (temperature, weathercode), `daily` (sunrise, sunset, uv_index_max)
- Free, no API key required, CORS-enabled

### News — HackerNews Firebase API
- Fetch top story IDs: `https://hacker-news.firebaseio.com/v0/topstories.json`
- Fetch top 3 stories: `https://hacker-news.firebaseio.com/v0/item/{id}.json`
- Fields: `title`, `url`, `score`
- Free, public, CORS-enabled

---

## Visual Design

**Color palette:**
- Background: `#1a1a1a` (deep charcoal)
- Surface cards: `#212121`
- Primary text: `#c8c8c8`
- Muted text: `#666`
- Accent (sunrise/sunset): soft amber `#c9a96e`
- UV indicator: muted green `#7aab8a`
- Links: `#8ab4c9` (desaturated blue)

**Typography:**
- Font: `IBM Plex Mono` (Google Fonts) — monospaced, melancholic
- Sizes: heading 1.1rem, body 0.9rem, labels 0.75rem uppercase tracked

**Layout:**
- Single centered column, max-width 560px
- Sections: date/time header → weather block → HackerNews block
- Generous padding, minimal borders (1px solid `#2e2e2e`)
- No images, no icons (pure text/CSS)

**Animation:**
- Subtle CSS rain: pseudo-element lines falling slowly, very low opacity (0.03–0.06)
- Gives atmosphere without being distracting

---

## Sections

### Header
- Current date: `Saturday, 21 March 2026`
- Current time: live clock updating every second

### Weather Block (Prague)
- Temperature (°C) — large, prominent
- Feels like
- Sunrise / Sunset times (local Prague time)
- UV Index (with low/moderate/high label)

### HackerNews Block
- Label: `// hacker news`
- 3 items: title as clickable link + score

---

## Deployment

1. Create GitHub repo `karlwerk-dashboard` under authenticated account
2. Add `adinafxv` as collaborator
3. Push code to `main` branch
4. Create Cloudflare Pages project connected to the GitHub repo
5. Set custom domain `karlwerk.pro` on the Pages project
6. Cloudflare auto-deploys on every push to `main`

---

## Error Handling

- If weather API fails: show `-- °C` placeholders, no crash
- If HackerNews API fails: show `could not load stories`
- Fetches are `try/catch` wrapped, silent failures

---

## Non-goals

- No user accounts, no persistence
- No mobile-specific layout (readable on mobile but not optimized)
- No dark/light toggle
- No service worker / offline support
