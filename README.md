# deploy-test-astro

A minimal two-page Astro site for testing Git-based static deployments.

## Routes

- `/` — deployment test home page
- `/about` — project information

## Requirements

- Node.js 22.12 or newer
- npm

## Local development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm ci
npm run build
```

Use these deployment values:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Runtime | Static |

To inspect the production build locally:

```bash
npm run preview
```
