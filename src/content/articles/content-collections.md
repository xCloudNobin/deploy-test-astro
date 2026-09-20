---
title: "Content collections explained"
description: "Model your markdown with schemas and query it with getCollection to build pages from real data."
category: "guides"
tags: ["content", "collections", "schema", "markdown"]
date: 2026-01-19
---

Content collections turn plain markdown files into typed, queryable data. They give you early feedback on missing or malformed frontmatter instead of discovering it at page runtime.

## Define a collection

Add `src/content.config.ts` at the root of your project:

```ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['guides', 'recipes', 'reference']),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
  }),
});

export const collections = { articles };
```

Files in `src/content/articles/` are now validated against that schema.

## Query the collection

Any page can pull entries with `getCollection`:

```ts
import { getCollection, render } from 'astro:content';

const articles = await getCollection('articles');
const sorted = articles.sort((a, b) => b.data.date - a.data.date);
```

Sorting, filtering and grouping happen in your page's frontmatter before any HTML is emitted.

## Render an entry

For detail pages, render the markdown body:

```ts
import { render } from 'astro:content';
const entry = await getEntry('articles', 'content-collections');
const { Content, headings } = await render(entry);
```

```astro
<!-- src/pages/.../[slug].astro -->
<article>
  <h1>{entry.data.title}</h1>
  <Content />
</article>
```

## Why schemas pay off

- Typo in a tag value? The build tells you, loudly.
- New required field? Every file must provide it.
- JSON data can live in the same collection tree with a data-type collection.

This site is a live example: every article you can read here comes out of the `articles` collection.