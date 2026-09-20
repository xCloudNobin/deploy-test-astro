---
title: "Adding search to a static site"
description: "The library page on this site runs a real, dependency-free client-side search. Here is how."
category: "recipes"
tags: ["search", "client-side", "javascript", "empty-state"]
date: 2026-02-14
---

A static site has no server to query, but you also do not need one. Ship the article index inside the page and filter it in the browser.

## Design

- Build the index from the content collection at build time.
- Keep the matching logic in a tiny, dependency-free module.
- Render results immediately — no network round trip.

## The index

In the page frontmatter, serialize each article into a plain object before the HTML is written:

```ts
const searchData = articles.map((entry) => ({
  slug: entry.slug,
  title: entry.data.title,
  category: entry.data.category,
  tags: entry.data.tags,
  description: entry.data.description,
  bodyText: stripMarkdown(entry.body),
}));
```

The whole payload is a few kilobytes — fine to inline.

## The matcher

Keep the core function pure and importable from both the browser script and your test runner:

```js
export function searchArticles(articles, { query = '', category = '' }) {
  const tokens = tokenize(query);
  return articles
    .filter((a) => !category || a.category === category)
    .map((a) => ({ ...a, score: score(a, tokens) }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score);
}
```

Weight title hits higher than tag, category or body matches so the most relevant article floats to the top.

## Empty state is a first-class UI

When a query yields nothing, show something useful instead of a blank list:

```html
<p data-empty hidden>
  No articles match “<span data-query></span>”.
  Try a different term or clear the search.
</p>
```

Show it, hide the empty results list, and keep the category filter visible so people can pivot.

## What you get

- Works on the served `dist/`, no backend, no credentials
- Instant, private, offline-cacheable
- Deep-linkable if you read `?q=` from the URL on load

This site's `/library` page is the reference implementation.