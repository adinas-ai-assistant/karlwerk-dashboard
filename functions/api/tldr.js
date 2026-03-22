const FEEDS = [
  { key: 'tech', url: 'https://tldr.tech/api/rss/tech', type: 'tldr' },
  { key: 'ai', url: 'https://tldr.tech/api/rss/ai', type: 'tldr' },
  { key: 'devops', url: 'https://tldr.tech/api/rss/devops', type: 'tldr' },
  { key: 'infosec', url: 'https://tldr.tech/api/rss/infosec', type: 'tldr' },
  { key: 'fintech', url: 'https://tldr.tech/api/rss/fintech', type: 'tldr' },
  { key: 'marketing', url: 'https://tldr.tech/api/rss/marketing', type: 'tldr' },
  { key: 'design', url: 'https://tldr.tech/api/rss/design', type: 'tldr' },
  { key: 'product', url: 'https://tldr.tech/api/rss/product', type: 'tldr' },
  { key: 'benedict', url: 'https://www.ben-evans.com/benedictevans?format=rss', type: 'essays' },
  { key: 'morningbrew', url: 'https://www.morningbrew.com/feed.xml', type: 'essays' },
];

function parseTldrItem(xml) {
  const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
  if (!itemMatch) return { title: '', link: 'https://tldr.tech' };
  const item = itemMatch[1];
  const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
  const linkMatch = item.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/);
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    link: linkMatch ? linkMatch[1].trim() : 'https://tldr.tech',
  };
}

function parseEssayItems(xml) {
  const items = [];
  // Support both RSS (<item>) and Atom (<entry>) formats
  const itemRe = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let match;
  while ((match = itemRe.exec(xml)) !== null && items.length < 3) {
    const item = match[1];
    const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    // RSS: <link>url</link> — Atom: <link href="url" .../>
    const linkMatch = item.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/) ||
                      item.match(/<link[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*\/?>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    if (title && link) items.push({ title, link });
  }
  return items;
}

export async function onRequest() {
  const results = await Promise.all(
    FEEDS.map(async ({ key, url, type }) => {
      try {
        const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
        if (type === 'essays') {
          return { key, type, items: parseEssayItems(xml) };
        }
        return { key, type, ...parseTldrItem(xml) };
      } catch {
        return type === 'essays'
          ? { key, type, items: [] }
          : { key, type, title: '', link: '' };
      }
    })
  );

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
