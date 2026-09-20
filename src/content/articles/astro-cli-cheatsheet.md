---
title: "Astro CLI cheat sheet"
description: "Every command you actually type, in one place."
category: "reference"
tags: ["cli", "commands", "reference", "build"]
date: 2026-03-10
---

A compact reference for the Astro command-line surface.

| Command | Purpose |
|---|---|
| `astro dev` | Start the dev server with on-the-fly rendering |
| `astro build` | Emit the production static site into `dist/` |
| `astro preview` | Serve the built `dist/` locally |
| `astro check` | Type-check `.astro` and TypeScript files |
| `astro sync` | Update generated content type definitions |
| `astro add <pkg>` | Add and configure an integration |
| `astro info` | Print diagnostics for bug reports |

## Flags that matter

```bash
astro dev --host 127.0.0.1 --port 4321
astro preview --host 127.0.0.1 --port 4322
astro build --out-dir dist
```

`--host` and `--port` control the bind address and listening port, which is exactly what you want to pin in production scripts.

## Environment defaults

| Variable | Default | Notes |
|---|---|---|
| `HOST` | `localhost` | `<--host>` falls back to it |
| `PORT` | `4321` | `<--port>` falls back to it |

## Scripts in this repository

Package scripts wrap the CLI so behavior is consistent and documented:

```bash
npm ci          # reproducible install
npm run build   # generate build info, then astro build
npm run preview # serve dist/ with the production server
npm run test    # unit + smoke verification
```

## Exit codes

A failed build exits non-zero and prints the error. CI must run `astro build` (or the wrapping script) without swallowing the status — that is how broken routes, schemas and assets surface before anyone deploys.