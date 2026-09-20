---
title: "Local images and assets"
description: "Small, honest notes on bundling images and static files with Astro."
category: "recipes"
tags: ["assets", "images", "public", "bundling"]
date: 2026-02-21
---

Two asset pipelines coexist in Astro: `public/` and imported assets.

## public/ — copies, no processing

Anything in `public/` lands in `dist/` untouched, at the same relative path:

```
public/favicon.svg   ->  dist/favicon.svg
```

Reference it with a root-absolute URL: `href="/favicon.svg"`.

## src/assets — bundled and fingerprinted

Import an image in your page frontmatter and it flows through the bundler:

```ts
import hero from '../assets/hero.svg';
```

```astro
<img src={hero.src} alt="Hero illustration" width={hero.width} height={hero.height} />
```

The emitted file gets a content hash in its name, so browsers can cache it aggressively. This is the route this site uses for its hero art.

## The full-service path: astro:assets

For production-heavy sites, use the `Image` component:

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.svg';
---
<Image src={hero} alt="Hero illustration" />
```

You get width/height attributes, format negotiation, and (with a sharp backend) responsive resizing. Small sites often do not need it — but it is there when images get heavy.

## Practical rules

- Keep `public/` for favicons, robots.txt, static manifests.
- Import anything you want hashed or transformed.
- Always set descriptive `alt` text — accessibility is part of quality.
- SVG you draw by hand (like this site's logo) is compact and theme-friendly.