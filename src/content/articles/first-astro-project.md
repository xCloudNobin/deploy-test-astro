---
title: "Your first Astro project"
description: "Scaffold a new Astro project, run the dev server, and learn the shape of the finished build output."
category: "guides"
tags: ["setup", "scaffold", "project", "node"]
date: 2026-01-12
---

Astro is a content-focused framework that ships zero JavaScript by default. This guide walks through the first twenty minutes of a new project.

## Prerequisites

- Node.js 22.12 or newer
- npm (a lockfile is provided, so `npm ci` beats `npm install`)

## Scaffold

```bash
mkdir my-site
cd my-site
npm create astro@latest -- --template minimal
```

Or, if you are starting from a fork of this very repository:

```bash
npm ci
```

`npm ci` installs the exact dependency tree recorded in `package-lock.json`, which keeps builds reproducible.

## Project layout

| Path | Purpose |
|---|---|
| `src/pages/` | Every `.astro` file becomes a route |
| `src/layouts/` | Reusable page shells |
| `src/content/` | Content collections (markdown, json, images) |
| `public/` | Files copied verbatim into the build output |
| `dist/` | The production-ready static site |

## Run it

```bash
npm run dev
```

The dev server prints a local URL such as `http://127.0.0.1:4321`. Every route you open in the browser triggers an on-the-fly render.

## Build and preview

```bash
npm run build
npm run preview
```

`astro build` writes the finished site to `dist/`. `astro preview` serves that output exactly as a static host would, which is a great way to catch path mistakes before deploying.

## What you have now

- A fast, static multi-page site
- No client-side JavaScript unless you add it
- A build pipeline that turns content collections into real HTML files
- An easy path onto any static host or CDN