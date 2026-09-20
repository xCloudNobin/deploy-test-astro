import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalize,
  tokenize,
  searchArticles,
  scoreArticle,
  highlightTitle,
} from '../../src/lib/search.mjs';

const FIXTURES = [
  {
    slug: 'content-collections',
    title: 'Content collections explained',
    description: 'Model your markdown with schemas and query it with getCollection.',
    category: 'guides',
    categoryLabel: 'Guides',
    tags: ['content', 'collections', 'schema', 'markdown'],
    date: '2026-01-19',
    bodyText: 'content collections turn plain markdown files into typed queryable data',
  },
  {
    slug: 'client-side-search',
    title: 'Adding search to a static site',
    description: 'Ship the article index inside the page and filter it in the browser.',
    category: 'recipes',
    categoryLabel: 'Recipes',
    tags: ['search', 'client-side', 'javascript'],
    date: '2026-02-14',
    bodyText: 'a static site has no server, so filter in the browser',
  },
  {
    slug: 'astro-cli-cheatsheet',
    title: 'Astro CLI cheat sheet',
    description: 'Every command you actually type, in one place.',
    category: 'reference',
    categoryLabel: 'Reference',
    tags: ['cli', 'commands', 'build'],
    date: '2026-03-10',
    bodyText: 'astro dev astro build astro preview astro check',
  },
  {
    slug: 'local-images-and-assets',
    title: 'Local images and assets',
    description: 'Small notes on bundling images and static files with Astro.',
    category: 'recipes',
    categoryLabel: 'Recipes',
    tags: ['assets', 'images', 'public', 'bundling'],
    date: '2026-02-21',
    bodyText: 'public copies files verbatim into the build output',
  },
];

test('normalize lowercases, trims and collapses whitespace', () => {
  assert.equal(normalize('  Content  Collections!  '), 'content collections!');
  assert.equal(normalize(''), '');
});

test('tokenize strips punctuation and stopwords', () => {
  assert.deepEqual(tokenize('the ASTRO cli cheat sheet'), ['astro', 'cli', 'cheat', 'sheet']);
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('how to use'), []);
});

test('empty query returns every article (scoped by category when given)', () => {
  const all = searchArticles(FIXTURES, { query: '' });
  assert.equal(all.length, 4);
  const guides = searchArticles(FIXTURES, { query: '', category: 'recipes' });
  assert.equal(guides.length, 2);
  assert.ok(guides.every((r) => r.article.category === 'recipes'));
});

test('title matches are found and ranked above body-only matches', () => {
  const results = searchArticles(FIXTURES, { query: 'collections' });
  assert.ok(results.length >= 1);
  const titles = results.map((r) => r.article.slug);
  assert.ok(titles.includes('content-collections'));
  assert.ok(results[0].article.slug === 'content-collections');
});

test('multi-token query requires every token to appear somewhere', () => {
  const results = searchArticles(FIXTURES, { query: 'search static' });
  const slug = results.map((r) => r.article.slug);
  assert.ok(slug.includes('client-side-search'));
  assert.ok(!slug.includes('astro-cli-cheatsheet'));
  const none = searchArticles(FIXTURES, { query: 'search celery' });
  assert.equal(none.length, 0);
});

test('tag matches hit even when the word is not in the title', () => {
  const results = searchArticles(FIXTURES, { query: 'assets' });
  const slugs = results.map((r) => r.article.slug);
  assert.ok(slugs.includes('local-images-and-assets'));
});

test('category filter narrows results and combines with query', () => {
  const results = searchArticles(FIXTURES, { query: 'astro', category: 'reference' });
  assert.deepEqual(results.map((r) => r.article.slug), ['astro-cli-cheatsheet']);
  const recipes = searchArticles(FIXTURES, { query: 'astro', category: 'recipes' });
  const recipesSlugs = recipes.map((r) => r.article.slug);
  assert.ok(recipesSlugs.includes('local-images-and-assets'));
  assert.ok(!recipesSlugs.includes('astro-cli-cheatsheet'));
});

test('no match returns empty array (drives the empty-search state)', () => {
  assert.equal(searchArticles(FIXTURES, { query: 'zzqqx' }).length, 0);
});

test('scoreArticle returns matched:false for a token found nowhere', () => {
  const article = FIXTURES[0];
  const result = scoreArticle(article, ['zzzz']);
  assert.equal(result.matched, false);
  const hit = scoreArticle(article, ['content']);
  assert.equal(hit.matched, true);
  assert.ok(hit.score > 3);
});

test('highlightTitle wraps matched tokens in mark tags', () => {
  assert.equal(
    highlightTitle('Content collections explained', 'collections'),
    'Content <mark>collections</mark> explained',
  );
  assert.equal(highlightTitle('Astro CLI cheat sheet', 'nope'), 'Astro CLI cheat sheet');
});