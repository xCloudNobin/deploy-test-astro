---
title: "Markdown and frontmatter reference"
description: "The frontmatter fields, images and markdown features used across this site's articles."
category: "reference"
tags: ["markdown", "frontmatter", "schema", "reference"]
date: 2026-03-24
---

Every article in this collection carries the same frontmatter contract.

## Frontmatter schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Article heading |
| `description` | string | yes | Short excerpt, used by cards and search |
| `category` | `guides` \| `recipes` \| `reference` | yes | Validated by the content schema |
| `tags` | string[] | yes | Lowercase topic keywords |
| `date` | date | yes | ISO date, coerced to a `Date` |
| `draft` | boolean | no | Defaults to `false` |

The schema lives in `src/content.config.ts` and is enforced at build time.

## Syntax supported

Markdown is first-class. This very article uses:

- Headings `##` and `###`
- Tables | with | pipes
- Fenced code blocks with language hints
- Inline `code`, **bold** and *emphasis*
- Bullet lists and numbered lists
- `[links](/)`

No processing plugin is required for any of the above; it is built in.

## Settings next to render

```ts
import { render } from 'astro:content';

const { Content, headings } = await render(entry);
```

`headings` gives you the document outline, which is handy for an auto-generated table of contents.

## One rule for the whole site

If a field is used by more than one page (cards, search, detail view, about page), it belongs in frontmatter — computed prose counts on every reader, and search runs against it. Keep descriptions honest and specific.