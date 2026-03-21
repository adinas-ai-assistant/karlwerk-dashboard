export async function onRequest() {
  const rss = await fetch('https://tldr.tech/api/rss/tech', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }).then(r => r.text());

  const itemMatch = rss.match(/<item>([\s\S]*?)<\/item>/);
  if (!itemMatch) return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  const itemXml = itemMatch[1];

  const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
  const linkMatch = itemXml.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/);
  const dateMatch = itemXml.match(/<pubDate[^>]*>([^<]{1,30})<\/pubDate>/);

  const result = {
    title: titleMatch ? titleMatch[1].trim() : '',
    link: linkMatch ? linkMatch[1].trim() : 'https://tldr.tech',
    date: dateMatch ? dateMatch[1].slice(0, 16) : ''
  };

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800'
    }
  });
}
