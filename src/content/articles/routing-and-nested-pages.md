---
title: "Routing and nested pages"
description: "Static routes, dynamic routes, nested directories, pagination and the 404 page — a routing tour."
category: "guides"
tags: ["routing", "routes", "nested", "get-static-paths"]
date: 2026-02-02
---

Astro 1:1 maps file paths under `src/pages/` to URL paths. That rule alone covers most of what you need.

## The mapping

| File | URL |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/about.astro` | `/about` |
| `src/pages/library/index.astro` | `/library` |
| `src/pages/library/categories/guides.astro` | `/library/categories/guides` |

Directories nest naturally. Do not fight it — this site uses `/library`, `/library/articles/[slug]` and `/library/categories/[category]` as its three levels.

## Dynamic routes

Wrap the file name in brackets:

```
src/pages/library/articles/[slug].astro
```

Export `getStaticPaths` so the build knows every URL it must produce:

```ts
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const articles = await getCollection('articles');
  return articles.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}
```

The static build emits one real directory per article — deep-linkable, crawlable, and cacheable forever.

## Nested dynamic layouts

You can nest `[parameters]` at any level:

```
src/pages/docs/[section]/[slug].astro
```

Both `params` values arrive on `Astro.params`.

## The 404 page

A file at `src/pages/404.astro` becomes `dist/404.html` and is served for unknown paths. Give it a friendly link back to the home page.

## Nested output you can verify

After `astro build`, the filesystem mirrors the site map:

```
dist/library/articles/content-collections/index.html
dist/library/categories/guides/index.html
```

That mirror is one of the nicest properties of a static site: what you test locally is exactly what a CDN will serve.