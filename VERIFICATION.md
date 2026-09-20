# VERIFICATION — Field Notes (deploy-test-astro)

Date: 2026-09-20
Candidate branch: `feat/compatibility-app`
Category: **Astro (static content site)**
Result: **local-verified** — live xCloud deployment **NOT RUN**

> Honest status: everything below was executed and captured on this machine. No live
> xCloud provisioning or deployment was performed, so this is **local-verified only**,
> **not deployment-verified**.

## Live xCloud: NOT RUN

| Item | Status |
|---|---|
| xCloud provisioning | **NOT RUN** |
| xCloud deployment | **NOT RUN** |
| External URL / deploy-category check | **NOT RUN** |
| catalog `deployment_verified` | must remain `false` until real evidence exists |

## Environment

| Item | Value |
|---|---|
| Node.js | v22.23.2 |
| npm | 10.9.8 |
| Astro | 7.3.3 (pinned exact in package.json) |
| @astrojs/check | 0.9.10 |
| typescript | 6.0.3 |
| Browser for search checks | system Chromium (headless) |
| OS | Linux (container) |

## Commands executed (with results)

### 1. Reproducible install

```bash
$ npm ci
> added 207 packages; audited 208 packages
```

`npm audit` initially reported 8 vulnerabilities in transitive build tooling
(postcss, sharp, smol-toml, svgo). `npm audit fix` upgraded dependencies to
non-vulnerable versions (`astro` 7.1.3 → 7.3.3, pinned exact). Re-run audit:

```bash
$ npm audit
> found 0 vulnerabilities
```

### 2. Unit tests (pure search matcher)

```bash
$ npm run test:unit
```

All `tests/unit/search.test.mjs` cases passed: tokenization/stopwords, empty-query,
title-vs-body ranking, multi-token AND matching, tag matching, category filter,
no-match → empty result, and `<mark>` highlighting.

### 3. Type check

```bash
$ npm run check
> astro check — no errors
```

### 4. Production build

```bash
$ npm run build
```

`astro build` exited 0; output written to `dist/`.

### 5. Production server + HTTP checks

`npm run preview` (astro preview) served the built `dist/` on `127.0.0.1:4937`
(unique port, isolated from defaults). Verified over HTTP:

- `/` 200 with build marker and hero content
- `/library/` 200 with search UI and “Showing 9 of 9 articles”
- `/library/articles/content-collections/` 200 (article body rendered)
- `/library/categories/guides/` 200 with “3 articles”
- `/library/categories/` 200
- `/about/` 200
- `/favicon.svg`, `/robots.txt`, `/healthz.txt` 200
- `/definitely/not/here/` → 404
- hashed hero asset under `dist/_astro/` served 200
- nested route files verified on disk (each page is a directory `index.html`)

### 6. Browser search verification (real Chromium, headless)

`dump-dom` against the served `dist/` confirmed actual client-side matching:

| Scenario | Result |
|---|---|
| `/library/` | 9 article cards, “Showing 9 of 9 articles” |
| `/library/?q=routing` | 1 result, matching article first, `<mark>Routing</mark>` highlight, unrelated article hidden |
| `/library/?q=zzqqx` | 0 results, empty state visible and echoes the query, 0 cards |
| `/library/?category=reference` | “Showing 3 of 9 articles”, exactly 3 reference articles, guides article hidden |

(The search UI also initializes from `?q=`/`?category=` via `history.replaceState`,
so results are deep-linkable.)

### 7. Smoke suite

```bash
$ npm test
```

Unit tests + full smoke script passed (`SMOKE_RESULT=PASS`), **47 checks, 0 failed,
0 skipped**. The smoke script builds, serves, checks HTTP + disk layout + browser
behavior, then shuts the server down cleanly; exit status is propagated
(no pipelines masking results).

## Build marker

`scripts/build-info.mjs` generates a gitignored `src/generated/build-info.mjs`
(commit SHA, build time, astro version) on every `dev`/`build`; the footer of
every page displays it. Verified present in served HTML.

## Health / readiness / persistence

- **Liveness/readiness**: not applicable — this is a static site with no database
  or backend process. `/healthz.txt` is an honest static availability marker only.
- **Persistence**: not applicable — no database; content is version-controlled
  markdown. Secret/session/cookie concerns do not apply.
- **CSRF / input validation**: not applicable — no authenticated mutations, no forms
  that mutate state; all rendering escapes Astro template output. Client-rendered
  search results escape text via `escapeHtml`.

## Cleanliness / security

- `node_modules/`, `dist/`, `src/generated/`, `.env.*` are gitignored; no secrets,
  binaries or databases are committed.
- No secrets in client bundles (there are none to begin with).
- `npm audit`: 0 vulnerabilities after `npm audit fix`.
- LICENSE (MIT) added with attribution preserved.

## Blockers

None for local verification. **Blocked for deployment verification** by the
absence of live xCloud provisioning access/authorization in this environment —
a subsequent owner-authorized deployment is required before marking
`deployment-verified`.

## How to reproduce

```bash
npm ci
npm run check
npm test
npm run build
npm run preview   # then browse http://127.0.0.1:4321
```