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
  { key: 'figmalion', url: 'https://figmalion.com/feed.atom', type: 'essays', maxItems: 1 },
  { key: 'nejm', url: 'https://www.nejm.org/action/showFeed?jc=ai&type=etoc&feed=rss', type: 'nejm-ai' },
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

function parseNeejmAiIssue(xml) {
  const volMatch = xml.match(/<prism:volume>(\d+)<\/prism:volume>/);
  const numMatch = xml.match(/<prism:number>(\d+)<\/prism:number>/);
  if (!volMatch || !numMatch) return [];
  const url = `https://ai.nejm.org/toc/ai/${volMatch[1]}/${numMatch[1]}`;
  return [{ title: `NEJM AI — Vol. ${volMatch[1]}, Issue ${numMatch[1]}`, link: url }];
}

function parseEssayItems(xml, maxItems = 3) {
  const items = [];
  // Use (?:>|\s[^>]*>) after tag name to avoid matching <items> in RDF feeds
  const itemRe = /<(item|entry)(?:>|\s[^>]*>)([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = itemRe.exec(xml)) !== null && items.length < maxItems) {
    const item = match[2];
    const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    // RSS: <link>url</link> — Atom: <link href="url" .../>
    const linkMatch = item.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/) ||
                      item.match(/<link[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*\/?>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const link = linkMatch ? linkMatch[1].trim().replace(/&amp;/g, '&') : '';
    if (title && link) items.push({ title, link });
  }
  return items;
}

export async function onRequest() {
  const results = await Promise.all(
    FEEDS.map(async (feed) => {
      const { key, url, type } = feed;
      try {
        const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
        if (type === 'nejm-ai') {
          return { key, type: 'essays', items: parseNeejmAiIssue(xml) };
        }
        if (type === 'essays') {
          return { key, type, items: parseEssayItems(xml, feed.maxItems) };
        }
        return { key, type, ...parseTldrItem(xml) };
      } catch {
        return (type === 'essays' || type === 'nejm-ai')
          ? { key, type: 'essays', items: [] }
          : { key, type, title: '', link: '' };
      }
    })
  );

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}
