const FEEDS = [
  { key: 'tech', url: 'https://tldr.tech/api/rss/tech' },
  { key: 'design', url: 'https://tldr.tech/api/rss/design' },
  { key: 'product', url: 'https://tldr.tech/api/rss/product' },
];

function parseItem(xml) {
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

export async function onRequest() {
  const results = await Promise.all(
    FEEDS.map(async ({ key, url }) => {
      try {
        const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
        return { key, ...parseItem(xml) };
      } catch {
        return { key, title: '', link: 'https://tldr.tech' };
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
