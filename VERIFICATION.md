# VERIFICATION — Field Notes (deploy-test-astro)

Date: 2026-09-20
Candidate branch: `feat/compatibility-app`
Category: **Astro (static content site)**
Result: **local-verified** — live xCloud deployment **NOT RUN**

> Honest status: everything below was executed and captured on this machine. No live
> xCloud provisioning or deployment was performed, so this is **local-verified only**,
> **not deployment-verified**.

## Correction

The originally pushed commit `d3922986` was **not** clean. A verified re-check found:

- **35 TypeScript errors** in `src/components/LibrarySearch.astro` client script:
  untyped `document.querySelector(...)` results (`Element` instead of
  `HTMLInputElement`/`HTMLSelectElement`/etc.), nullable DOM nodes used without
  guards (`'input' is possibly null`, `'select' is possibly null`, …), implicit `any`
  on function parameters/results (`cardHtml`, `escapeHtml`, `formatDate`, the
  `results.map`/`tags.map` callbacks), and an implicitly-`any` debounce `timer`.
- **1 hint**: unused `countOccurrences` function in `scripts/smoke.mjs`.

The original PR text claiming `astro check → no errors` was **incorrect** and has been
corrected. The fix commit (this one) resolves all of the above without disabling strict
mode, without `ts-nocheck`, without silent broad `any`, and without excluding the
component from the project.

How the script is now typed:

- **Typed selectors**: `document.querySelector<HTMLFormElement>(...)` /
  `querySelector<HTMLInputElement>(...)` etc. where attribute selectors are used.
- **Explicit runtime guards**: a `requireElement<T extends Element>(selector)`
  helper throws if a required node is missing, so every DOM reference is a
  concrete, non-null typed element; the embedded search index is parsed through a
  typed `parseSearchIndex(raw: string | undefined): SearchItem[]` validator
  (shape-checking each entry, empty result on malformed input).
- **Meaningful data types**: `SearchItem`, `SearchResult`, `UrlState` types;
  `escapeHtml(value: unknown): string`, `formatDate(iso: string): string`,
  `cardHtml(result: SearchResult, query: string): string`,
  `readUrlState(): UrlState`, `render(): void`, and
  `let timer: ReturnType<typeof setTimeout> | undefined`.

## Verified commit

| Item | Value |
|---|---|
| Original (broken) commit | `d3922986` — 35 TS errors + 1 hint |
| Fix commit (this one) | `39d6101` — see build marker (`commit=39d61014`) in generated footers |

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

### 2. Type check (on final source)

```bash
$ npm run check
> Result (21 files):
> - 0 errors
> - 0 warnings
> - 0 hints
```

### 3. Production build (on final source)

```bash
$ npm run build
```

`astro build` exited 0; **17 pages built** and written to `dist/`. Generated build
marker: `build-info: commit=39d61014 astro=7.3.3 pkg=1.0.0`.

### 4. Unit tests (pure search matcher)

```bash
$ npm run test:unit
```

All 10 `tests/unit/search.test.mjs` cases passed (0 failed): normalize,
tokenize/stopwords, empty-query, title-vs-body ranking, multi-token AND matching,
tag matching, category filter, no-match → empty result, `scoreArticle` no-token
behavior, and `<mark>` highlighting.

### 5. Production server + HTTP checks

`npm test` ran the smoke suite, which builds, serves `dist/` on `127.0.0.1:4937`
via `astro preview`, and verified over HTTP:

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

`dump-dom` against the served `dist/` confirmed actual client-side matching. The
browser searches are **unchanged** and passing:

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

Unit tests + full smoke script passed on the exact final source:
**47 checks, 0 failed, 0 skipped** (`SMOKE_RESULT=PASS`). The smoke script builds,
serves, checks HTTP + disk layout + browser behavior, then shuts the server down
cleanly; exit status is propagated (no pipelines masking results).

## Build marker

`scripts/build-info.mjs` generates a gitignored `src/generated/build-info.mjs`
(commit SHA, build time, astro version) on every `dev`/`build`; the footer of
every page displays it. Verified present in served HTML as `commit=39d61014`.

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