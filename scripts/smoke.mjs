import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const PORT = process.env.SMOKE_PORT || '4937';
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

const failures = [];
const skipped = [];
let checks = 0;

function log(line) {
  console.log(`[smoke] ${line}`);
}

function pass(name, detail = '') {
  checks += 1;
  log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
  checks += 1;
  failures.push(`${name}: ${detail}`);
  log(`FAIL  ${name} — ${detail}`);
}

function skip(name, reason) {
  skipped.push(`${name}: ${reason}`);
  log(`SKIP  ${name} — ${reason}`);
}

function assert(condition, name, detail) {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

function runSync(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env, CI: 'true', ...opts.env },
    timeout: opts.timeout ?? 240000,
  });
  log(`${cmd} ${args.join(' ')} exit=${result.status}`);
  if (result.status !== 0) {
    log((result.stdout || '') + (result.stderr || ''));
  }
  return result;
}

async function get(pathname) {
  const res = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
  const body = await res.text();
  return { status: res.status, body };
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return true;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function findAssetFile(pattern) {
  const dirs = readdirSync(join(ROOT, 'dist', '_astro'), { withFileTypes: true }).filter((d) =>
    d.isFile() && d.name.match(pattern),
  );
  return dirs.length ? dirs[0].name : null;
}

async function browserDom(url) {
  const candidates = [
    '/snap/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  const bin = candidates.find(existsSync);
  if (!bin) return { ok: false, reason: 'no chromium binary found' };

  const profile = mkdtempSync(join(tmpdir(), 'fn-browser-'));
  const args = [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    '--dump-dom',
    url,
  ];
  const result = spawnSync(bin, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 45000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  rmSync(profile, { recursive: true, force: true });
  if (result.status !== 0) {
    return { ok: false, reason: `chromium exit=${result.status}: ${(result.stderr || '').slice(0, 300)}` };
  }
  return { ok: true, dom: result.stdout };
}

function browserAvailable() {
  const candidates = [
    '/snap/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  return candidates.find(existsSync);
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function stripScriptBlocks(dom) {
  return String(dom).replace(/<script[\s\S]*?<\/script>/gi, '');
}

function cardTitles(dom) {
  const titles = [];
  const re = /<h3 class="title">([\s\S]*?)<\/h3>/g;
  const view = stripScriptBlocks(dom);
  let match;
  while ((match = re.exec(view)) !== null) {
    titles.push(match[1]);
  }
  return titles;
}

function stripMarkup(title) {
  return title.replace(/<[^>]+>/g, '').trim();
}

async function main() {
  log('--- step 1: production build ---');
  const build = runSync('npm', ['run', 'build']);
  if (build.status !== 0) {
    fail('clean production build', `npm run build exited ${build.status}`);
  } else {
    pass('clean production build', `dist ready`);
  }

  log('--- step 2: nested route output files ---');
  const routeFiles = [
    'dist/index.html',
    'dist/about/index.html',
    'dist/library/index.html',
    'dist/library/categories/index.html',
    'dist/library/categories/guides/index.html',
    'dist/library/categories/recipes/index.html',
    'dist/library/categories/reference/index.html',
    'dist/library/articles/first-astro-project/index.html',
    'dist/library/articles/content-collections/index.html',
  ];
  for (const file of routeFiles) {
    assert(existsSync(join(ROOT, file)), `nested route emitted ${file}`);
  }
  assert(existsSync(join(ROOT, 'dist/404.html')), '404 page emitted dist/404.html');

  const homeHtml = existsSync(join(ROOT, 'dist/index.html'))
    ? readFileSync(join(ROOT, 'dist/index.html'), 'utf8')
    : '';
  assert(/build-marker/.test(homeHtml), 'build marker present in home HTML');

  log('--- step 3: serve dist and HTTP checks ---');
  const serverBin = join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs');
  const server = spawn('node', [serverBin, 'preview', '--host', HOST, '--port', PORT], {
    cwd: ROOT,
    env: { ...process.env, CI: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout?.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  server.stderr?.on('data', (d) => process.stderr.write(`[preview] ${d}`));

  let serverReady = false;
  try {
    serverReady = await waitForServer();
    assert(serverReady, 'preview server ready', `${BASE}`);
    if (!serverReady) throw new Error('server never became ready');

    const checksList = [
      ['home page 200', '/', (b) => b.status === 200 && b.body.includes('Browse the library')],
      ['home page build marker', '/', (b) => b.body.includes('build-marker') && /commit [0-9a-f]{7,}/.test(b.body)],
      ['library page 200', '/library/', (b) => b.status === 200 && b.body.includes('data-search-input')],
      ['library shows all articles', '/library/', (b) => b.body.includes('Showing 9 of 9 articles')],
      ['article detail 200', '/library/articles/content-collections/', (b) => b.status === 200 && b.body.includes('Content collections explained') && b.body.includes('article-content')],
      ['category page 200', '/library/categories/guides/', (b) => b.status === 200 && b.body.includes('category-count') && b.body.includes('3 articles')],
      ['categories index 200', '/library/categories/', (b) => b.status === 200 && b.body.includes('Browse by topic')],
      ['about page 200', '/about/', (b) => b.status === 200 && b.body.includes('commit full')],
      ['favicon served', '/favicon.svg', (b) => b.status === 200 && b.body.trimStart().startsWith('<svg')],
      ['robots served', '/robots.txt', (b) => b.status === 200 && b.body.includes('User-agent')],
      ['healthz served', '/healthz.txt', (b) => b.status === 200 && b.body.includes('static availability')],
      ['missing route 404', '/definitely/not/here/', (b) => b.status === 404],
    ];

    for (const [name, pathname, fn] of checksList) {
      try {
        const body = await get(pathname);
        assert(fn(body), name);
      } catch (err) {
        fail(name, err.message);
      }
    }

    const heroAsset = findAssetFile(/^hero[^]*\.svg$/);
    assert(!!heroAsset, 'hashed hero asset emitted', `_astro/${heroAsset ?? ''}`);
    if (heroAsset) {
      const res = await fetch(`${BASE}/_astro/${heroAsset}`);
      const text = await res.text();
      assert(res.status === 200 && text.trimStart().startsWith('<svg'), 'hashed hero asset served');
    }
  } finally {
    log('--- shutting down preview server ---');
    server.kill('SIGTERM');
    await new Promise((r) => server.once('exit', r));
  }

  log('--- step 4: browser search verification ---');
  const bin = browserAvailable();
  if (!bin) {
    skip('client-side search in browser', 'no chromium binary available (JS unit tests + HTTP still apply)');
  } else {
    log(`browser: ${bin}`);

    const baseDom = await browserDom(`${BASE}/library/`);
    if (!baseDom.ok) {
      skip('browser search checks', `could not launch browser: ${baseDom.reason}`);
    } else {
      const baseTitles = cardTitles(baseDom.dom).map(stripMarkup);
      assert(
        baseDom.dom.includes('Showing 9 of 9 articles'),
        'browser: initial list shows all 9 articles',
      );
      assert(
        baseTitles.length === 9,
        'browser: 9 article cards rendered',
        `${baseTitles.length} cards`,
      );
      assert(
        baseTitles.includes('Adding search to a static site') &&
          baseTitles.includes('Content collections explained') &&
          baseTitles.includes('Markdown and frontmatter reference'),
        'browser: all categories represented in initial list',
      );

      const hit = await browserDom(`${BASE}/library/?q=routing`);
      assert(hit.ok, 'browser: search page loads');
      assert(hit.dom.includes('1 result for'), 'browser: match count for "routing"');
      const hitTitles = cardTitles(hit.dom).map(stripMarkup);
      assert(hitTitles.length === 1, 'browser: exactly one rendered result', `${hitTitles.length}`);
      assert(hitTitles[0] === 'Routing and nested pages', 'browser: matching article shown first');
      assert(hit.dom.includes('<mark>Routing</mark>'), 'browser: matched term highlighted');
      assert(!hitTitles.includes('Dark-mode styling'), 'browser: non-matching article hidden');

      const empty = await browserDom(`${BASE}/library/?q=zzqqx`);
      assert(empty.ok, 'browser: empty-search page loads');
      assert(empty.dom.includes('0 results for'), 'browser: zero results message');
      assert(empty.dom.includes('Nothing matched your search'), 'browser: empty state visible');
      assert(empty.dom.includes('zzqqx'), 'browser: empty state echoes the query');
      assert(cardTitles(empty.dom).length === 0, 'browser: no cards on empty search');

      const cat = await browserDom(`${BASE}/library/?category=reference`);
      assert(cat.ok, 'browser: category-filter page loads');
      assert(cat.dom.includes('Showing 3 of 9 articles'), 'browser: category filter narrows list');
      const catTitles = cardTitles(cat.dom).map(stripMarkup);
      assert(catTitles.includes('Astro CLI cheat sheet'), 'browser: reference article shown');
      assert(
        catTitles.includes('Markdown and frontmatter reference'),
        'browser: reference article shown (2)',
      );
      assert(catTitles.length === 3, 'browser: exactly three reference articles', `${catTitles.length}`);
      assert(!catTitles.includes('Content collections explained'), 'browser: guides article filtered out');
    }
  }

  log('--- summary ---');
  log(`${checks} checks, ${failures.length} failed, ${skipped.length} skipped`);
  if (skipped.length > 0) {
    for (const s of skipped) log(`SKIPPED: ${s}`);
  }
  process.stdout.write(`SMOKE_RESULT=${failures.length === 0 ? 'PASS' : 'FAIL'}\n`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('[smoke] fatal:', err);
  process.exit(1);
});