---
title: "Dark-mode styling that stays maintainable"
description: "CSS variables, scoped styles and a calm dark palette without a framework."
category: "recipes"
tags: ["css", "styling", "dark-mode", "design"]
date: 2026-03-03
---

Dark-first design is a natural fit for a code-flavoured knowledge base. This site uses plain CSS custom properties — no preprocessor, no runtime theme script.

## Tokens in one place

Define the palette on `:root` in a global style block:

```css
:root {
  color-scheme: dark;
  --bg: #080b12;
  --surface: #111827;
  --text: #e8ecf5;
  --muted: #9aa5bd;
  --accent: #8ab4ff;
  --border: #26314a;
}
```

Every component now reads from the same tokens:

```css
.card {
  background: linear-gradient(145deg, var(--surface), #0c1220);
  border: 1px solid var(--border);
  color: var(--text);
}
```

A scheme change is one token edit, not a find-and-replace.

## Scoped by default

In Astro, `<style>` inside a component is scoped: selectors get a data attribute, so the `.card` in one component cannot leak into another. You opt into globality with `is:global` on the layout shell.

## Typography rhythm

A clamp-based scale keeps headings usable from phone to projector:

```css
h1 { font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.05; }
```

Generous line-height (`1.6`) and a slightly muted body colour make long article pages comfortable to scan.

## Layered details

Use `color-scheme: dark` so native widgets (scrollbars, form controls, the search input) adopt the theme without extra CSS.

A tasteful palette, scoped styles and one source of truth for tokens is the entire recipe. Everything else is restraint.