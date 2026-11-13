// Pulls the specification table out of a product description so the product page can show it
// as grouped cards (Body, Display, Camera…) in its own tab. Rows with a single cell start a new
// group; rows with two cells are "label | value". Whatever is left is the description.

const text = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

function readTable(table) {
  const groups = [];
  let current = null;
  let pairs = 0;
  for (const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => c[1].trim());
    if (cells.length === 1) {
      current = { name: text(cells[0]), rows: [] };
      groups.push(current);
    } else if (cells.length >= 2) {
      if (!current) {
        current = { name: 'Specifications', rows: [] };
        groups.push(current);
      }
      current.rows.push([cells[0], cells.slice(1).join(' ')]);
      pairs += 1;
    }
  }
  return { groups: groups.filter((g) => g.rows.length), pairs };
}

export function splitSpecs(html) {
  const src = String(html || '');
  let best = null;
  for (const m of src.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const t = readTable(m[0]);
    if (t.pairs >= 2 && (!best || t.pairs > best.pairs)) best = { ...t, index: m.index, length: m[0].length };
  }
  if (!best) return { groups: [], rest: src.trim() };
  const before = src.slice(0, best.index).replace(/<h[1-6][^>]*>\s*(specifications?|specs?)\s*<\/h[1-6]>\s*$/i, '');
  const rest = (before + src.slice(best.index + best.length)).trim();
  return { groups: best.groups, rest };
}
