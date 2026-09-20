---
title: "Static deployment checklist"
description: "A short, orderable list of checks before a static site goes anywhere near a host."
category: "reference"
tags: ["deploy", "checklist", "build", "output"]
date: 2026-03-17
---

A static site is simple, so the checklist is short — but each item catches a real failure mode.

## Reproducible install

- [ ] `package-lock.json` committed; install via `npm ci`
- [ ] Node engine pinned in `package.json`; runtime documented
- [ ] `node_modules/` never committed
- [ ] No credentials in source, `.env.*`, or client bundles

## Build

- [ ] `npm run build` exits 0 from a clean checkout
- [ ] `astro check` passes
- [ ] Output lands in `dist/` with no stray absolute `/src` paths

## Content and routes

- [ ] Every article route exists under `dist/library/articles/<slug>/index.html`
- [ ] Nested category routes exist under `dist/library/categories/<name>/index.html`
- [ ] `dist/404.html` present and styled
- [ ] A static `robots.txt` exists for honest crawling

## Assets

- [ ] Favicon and logo resolve (browser returns 200)
- [ ] Imported assets carry hashed filenames (they survived the bundler)
- [ ] Public assets are referenced with root-absolute URLs

## Feature behavior

- [ ] Search matches a known term and shows the right article
- [ ] Search shows a helpful empty state for garbage queries
- [ ] Category filter narrows results
- [ ] Build marker visible so the deployed revision is identifiable

## Operation

- [ ] `npm run preview` serves `dist/` on a documented port/bind
- [ ] Logs go to stdout/stderr without secrets
- [ ] Health note is honest: a static site has no database readiness to report

Run this checklist once locally, then again against the deployed artifact at the exact candidate commit.