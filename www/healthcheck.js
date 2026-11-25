// Health check pages for andrewmacheret.com and every project.
// A project's www/healthcheck/index.html loads this and lists what the project needs:
//   <script src="https://andrewmacheret.com/healthcheck.js"></script>
//   <script>
//   healthcheck([
//     { name: 'Page', url: '../', assets: true, contains: 'NHL Today' },
//     { name: 'NHL API', url: 'https://nhl.andrewmacheret.com/healthcheck', healthcheck: true },
//     { name: 'NHL logos', url: 'https://assets.nhle.com/logos/nhl/svg/SJS_light.svg', image: true }
//   ]);
//   </script>
// Options for a check:
//   assets: also check every script and stylesheet the page loads
//   find: with assets, patterns for files the page's scripts load later, like a hashed .wasm file.
//     Each one has to show up in a script, and the file it names has to load.
//   contains: text the response has to include
//   healthcheck: the URL is another health check, like a Lambda's, and it has to say "ok"
//   image: load it as an image, for servers that don't let other sites fetch from them
//   maxAgeHours: the file has to have been updated within this many hours
//   json: a function that gets the parsed JSON. It throws an Error to fail the check,
//     and any text it returns is added to the detail
// The daily canary (github.com/andrewmacheret/canary) opens the page and reads window.healthcheckResult.
(function () {
  const timeoutMs = 15000;

  function timeoutError() {
    return new Error(`no answer in ${timeoutMs / 1000} seconds`);
  }

  // Returns null when the server is up but doesn't let this site read the response (CORS)
  async function get(url) {
    const options = { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) };
    try {
      return await fetch(url, options);
    } catch (err) {
      if (err.name === 'TimeoutError') throw timeoutError();
      await fetch(url, { ...options, mode: 'no-cors', signal: AbortSignal.timeout(timeoutMs) })
        .catch(() => { throw new Error("couldn't reach it"); });
      return null;
    }
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => reject(timeoutError()), timeoutMs);
      img.onload = () => { clearTimeout(timer); resolve(`${img.naturalWidth}x${img.naturalHeight} image`); };
      img.onerror = () => { clearTimeout(timer); reject(new Error("image didn't load")); };
      img.src = url;
    });
  }

  // Returns { detail, text }, or throws if the check fails
  async function run(check, url) {
    if (check.image) return { detail: await loadImage(url) };

    const response = await get(url);
    if (!response) {
      if (check.contains || check.healthcheck || check.assets || check.maxAgeHours || check.json) {
        throw new Error("it's up, but it doesn't let this site read it (CORS)");
      }
      return { detail: "up (CORS hides the status)" };
    }

    if (check.healthcheck) {
      const body = await response.json().catch(() => null);
      if (!body || !body.status) throw new Error(`returned ${response.status}, not a health check`);
      const broken = (body.checks || []).filter((c) => !c.ok);
      if (body.status !== 'ok' || broken.length) {
        throw new Error(`broken: ${broken.map((c) => `${c.name} (${c.detail})`).join(', ') || body.status}`);
      }
      return { detail: `${body.checks.length} checks ok` };
    }

    if (!response.ok) throw new Error(`returned ${response.status}`);
    const details = [`${response.status}`];
    if (check.maxAgeHours) {
      const modified = response.headers.get('last-modified');
      if (!modified) throw new Error('no Last-Modified header');
      const hours = Math.round((Date.now() - new Date(modified)) / 3600000);
      if (hours > check.maxAgeHours) throw new Error(`last updated ${hours} hours ago`);
      details.push(`updated ${hours} hours ago`);
    }
    if (check.json) {
      const body = await response.json().catch(() => {
        throw new Error('not valid JSON');
      });
      const more = check.json(body);
      if (more) details.push(more);
      return { detail: details.join(', ') };
    }
    const text = check.contains || check.assets || check.keepText ? await response.text() : null;
    if (check.contains && !text.includes(check.contains)) throw new Error(`doesn't include "${check.contains}"`);
    return { detail: details.join(', '), text };
  }

  async function runAll(checks) {
    return Promise.all(checks.map(async (check) => {
      const url = new URL(check.url, location.href).href;
      try {
        return { name: check.name, ok: true, url, ...(await run(check, url)) };
      } catch (err) {
        return { name: check.name, ok: false, url, detail: err.message };
      }
    }));
  }

  const shortUrl = (url) => url.replace(/^https:\/\//, '');

  // Every script and stylesheet a page loads, so a half-finished deploy shows up
  function assetChecks(page, keepText) {
    const doc = new DOMParser().parseFromString(page.text, 'text/html');
    const urls = [...doc.querySelectorAll('script[src], link[rel~="stylesheet"][href]')]
      .map((el) => new URL(el.getAttribute('src') || el.getAttribute('href'), page.url).href);
    return [...new Set(urls)].map((url) => ({ name: `${page.name}: ${shortUrl(url)}`, url, keepText }));
  }

  // Files named inside the page's scripts, found by the check's find patterns
  function foundChecks(page, patterns, assets) {
    return patterns.map((pattern) => {
      for (const asset of assets) {
        const match = asset.text && asset.text.match(new RegExp(pattern));
        if (match) {
          const url = new URL(match[0], asset.url).href;
          return { name: `${page.name}: ${shortUrl(url)}`, url };
        }
      }
      return { name: `${page.name}: ${pattern}`, missing: true };
    });
  }

  function render(results, ok) {
    document.title = `${ok ? 'OK' : 'Broken'} · ${document.title}`;
    const status = document.createElement('p');
    status.textContent = ok ? 'Everything is working.' : 'Something is broken.';
    const list = document.createElement('ul');
    for (const r of results) {
      const item = document.createElement('li');
      item.textContent = `${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`;
      list.append(item);
    }
    document.body.append(status, list);
  }

  window.healthcheck = async (checks) => {
    const results = await runAll(checks);
    for (let i = 0; i < checks.length; i++) {
      const page = results[i];
      if (!checks[i].assets || !page.text) continue;
      const find = checks[i].find || [];
      const assets = await runAll(assetChecks(page, find.length > 0));
      results.push(...assets);
      const found = foundChecks(page, find, assets);
      results.push(...found.filter((c) => c.missing).map((c) => ({ name: c.name, ok: false, detail: "not in the page's scripts" })));
      results.push(...await runAll(found.filter((c) => !c.missing)));
    }

    const ok = results.every((r) => r.ok);
    render(results, ok);
    window.healthcheckResult = {
      status: ok ? 'ok' : 'fail',
      checks: results.map(({ name, ok, detail }) => ({ name, ok, detail }))
    };
  };
})();
