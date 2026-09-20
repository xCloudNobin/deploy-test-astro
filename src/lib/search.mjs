const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'use',
  'using',
  'what',
  'when',
  'why',
  'with',
  'you',
  'your',
]);

export const EMPTY_RESULT = { matched: false, score: 0 };

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(query) {
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !STOPWORDS.has(token));
}

export function buildHaystack(article) {
  return {
    title: normalize(article.title),
    description: normalize(article.description),
    category: normalize(article.categoryLabel ?? article.category),
    tags: (article.tags ?? []).map(normalize).join(' '),
    body: normalize(article.bodyText),
  };
}

export function scoreArticle(article, tokens, haystack) {
  if (!tokens || tokens.length === 0) {
    return { matched: true, score: 0 };
  }
  const h = haystack ?? buildHaystack(article);
  let score = 0;
  const matchedTokens = [];
  for (const token of tokens) {
    let tokenScore = 0;
    if (h.title.includes(token)) tokenScore += 6;
    if (h.tags.includes(token)) tokenScore += 4;
    if (h.category.includes(token)) tokenScore += 3;
    if (h.description.includes(token)) tokenScore += 2;
    if (h.body.includes(token)) tokenScore += 1;
    if (tokenScore === 0) return EMPTY_RESULT;
    score += tokenScore;
    matchedTokens.push(token);
  }
  return { matched: true, score, matchedTokens };
}

export function searchArticles(articles, options = {}) {
  const query = String(options.query ?? '');
  const category = options.category ? normalize(options.category) : '';
  const tokens = tokenize(query);
  const scoped = category
    ? articles.filter((a) => normalize(a.category) === category)
    : articles;

  return scoped
    .map((article) => {
      const haystack = buildHaystack(article);
      return { article, ...scoreArticle(article, tokens, haystack) };
    })
    .filter((result) => result.matched)
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(a.article.title).localeCompare(String(b.article.title)),
    );
}

export function highlightTitle(title, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return title;
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return String(title).replace(pattern, '<mark>$1</mark>');
}