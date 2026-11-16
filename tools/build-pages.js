// Builds the eight product pages as stories, from three files per product in tools/pages:
//   <slug>.json        title, description, name, fit (meta and "built for")
//   <slug>.story.json  hook, stake, scene, chapters, shift, limits, pilot, objections, close
//   <slug>.caps.json   the full feature list and spec table (shown collapsed)
// plus <slug>.extra.html (live demos) for the two flagships.
// Usage (from the repository root): node tools/build-pages.js .
const fs = require('fs');
const path = require('path');
const site = process.argv[2];
const dir = path.join(__dirname, 'pages');
const SITE = 'https://www.singularityrd.com';
const CAL = 'https://calendly.com/anill-yagiz/singularity';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const must = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const read = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const ORDER = ['foundation-models', 'autosecops', 'aidr', 'it-ops', 'breakpoint', 'fennec', 'sonar', 'robodr'];
const ART = { 'foundation-models': 'model', autosecops: 'autosecops', aidr: 'aidr', 'it-ops': 'itops', breakpoint: 'breakpoint', fennec: 'fennec', sonar: 'sonar', robodr: 'robodr' };
const ACCENT = { aidr: 'var(--b)', 'foundation-models': 'var(--b)' };
// Where the painting's subject sits: the copy fills the left half of the hero,
// so each painting is nudged (or mirrored) until its subject is on the right.
const HERO = {
  'foundation-models': '--shift: 17%', autosecops: '', aidr: '--shift: 22%', 'it-ops': '--shift: 14%',
  breakpoint: '--shift: 15%', fennec: '--flip: -1', sonar: '--flip: -1; --shift: 6%', robodr: '--shift: 23%',
};
const NUM = { 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six' };
// Each sentence of a heading stays on its own line when it fits.
const sents = s => {
  const parts = String(s).split(/(?<=[.!?])\s+/);
  return parts.length < 2 ? esc(s) : parts.map(p => `<span class="s">${esc(p)}</span>`).join(' ');
};
// One-sentence section titles carry no full stop; the page headline always does.
const title = s => { s = String(s).trim(); return /[.!?]\s/.test(s) ? s : s.replace(/\.$/, ''); };
const headline = s => { s = String(s).trim(); return /[.!?]$/.test(s) ? s : s + '.'; };
const nb = s => esc(s).replace(/air-gapped/g, 'air‑gapped');

const pages = ORDER.map(slug => {
  const d = read(slug + '.json');
  must(d.slug === slug, 'slug in ' + slug);
  d.story = read(slug + '.story.json');
  d.caps = read(slug + '.caps.json');
  const s = d.story;
  must(s.slug === slug && s.scene.without.length === s.scene.with.length && s.chapters.length >= 4 && s.objections.length === 5 && s.pilot.steps.length >= 3 && s.limits.items.length >= 2 && s.shift.rows.length >= 3, 'story shape in ' + slug);
  const ef = path.join(dir, slug + '.extra.html');
  d.extra = fs.existsSync(ef) ? fs.readFileSync(ef, 'utf8').replace(/\r\n/g, '\n').trim() + '\n' : '';
  d.short = slug === 'foundation-models' ? 'the models' : d.name;
  return d;
});

const header = `<header class="site-header">
  <div class="shell header-inner">
    <a class="brand" href="index.html" aria-label="Singularity — home">
      <img class="brand-logo" src="assets/logo.svg" alt="Singularity" width="1409" height="306" />
    </a>

    <nav class="nav-secondary home-nav" aria-label="Primary">
      <a class="nav-link" href="index.html#products">Products</a>
      <a class="nav-link" href="foundation-models.html">Model</a>
      <a class="nav-link" href="index.html#industries">Industries</a>
      <a class="nav-link" href="index.html#pricing">Pricing</a>
      <a class="btn btn-solid" href="${CAL}" target="_blank" rel="noopener">Book a demo <span class="chev">›</span></a>
    </nav>

    <button class="burger" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false"><span></span><span></span></button>
  </div>

  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden>
    <div class="shell mobile-nav-grid">
      <a class="mobile-nav-link" href="index.html#products">Products</a>
      <a class="mobile-nav-link" href="foundation-models.html">Model</a>
      <a class="mobile-nav-link" href="index.html#industries">Industries</a>
      <a class="mobile-nav-link" href="index.html#pricing">Pricing</a>
      <a class="btn btn-solid btn-lg mobile-nav-cta" href="${CAL}" target="_blank" rel="noopener">Book a demo <span class="chev">›</span></a>
    </div>
  </nav>
</header>`;

const world = fs.readFileSync(path.join(__dirname, 'art', 'world.html'), 'utf8').replace(/\r\n/g, '\n');
const footer = `<footer class="site-footer">
  <div class="shell footer-inner">
    <div class="footer-brand">
      <a class="brand" href="index.html" aria-label="Singularity — home">
        <img class="brand-logo" src="assets/logo.svg" alt="Singularity" width="1409" height="306" />
      </a>
      <p>We hack governments. Then we secure them, with our own frontier model.</p>
      <a class="btn btn-ghost" href="${CAL}" target="_blank" rel="noopener">Book a demo <span class="chev">›</span></a>
    </div>
    <nav class="footer-cols" aria-label="Footer">
      <div>
        <p class="footer-head">Products</p>
        ${pages.filter(p => p.slug !== 'foundation-models').map(p => `<a href="${p.slug}.html">${esc(p.name)}</a>`).join('')}<a href="foundation-models.html">Foundation Models</a>
      </div>
      <div>
        <p class="footer-head">Company</p>
        <a href="index.html#industries">Industries</a><a href="index.html#pricing">Pricing</a><a href="index.html#lab">Research</a><a href="customer-success.html">Customer Success</a><a href="index.html#compare">Compare</a><a href="index.html#faq">FAQ</a><a href="mailto:anil@singularityrd.com">Contact</a>
      </div>
      <div class="footer-ents">
        <p class="footer-head">Companies</p>
        <p><b>United States</b>Singularity Research and Development Inc.</p>
        <p><b>Türkiye</b>Singularity Arge Siber Güvenlik ve Yapay Zeka Teknoloji A.Ş.</p>
        <p><b>South Korea</b>Singularity Korea</p>
      </div>
    </nav>
  </div>
${world}  <div class="shell">
    <p class="footer-tag" aria-hidden="true">Offense-proven. <span>Defense-grade.</span></p>
  </div>
  <div class="shell footer-bar">
    <p>© 2026 Singularity Research and Development Inc.</p>
    <p><a href="mailto:anil@singularityrd.com">anil@singularityrd.com</a></p>
  </div>
</footer>`;

function page(d) {
  const s = d.story, c = d.caps, url = `${SITE}/${d.slug}.html`, isModel = d.slug === 'foundation-models';
  const h1 = headline(s.hook.h1);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Singularity', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + '/#products' },
        { '@type': 'ListItem', position: 3, name: d.name, item: url },
      ] },
      { '@type': 'SoftwareApplication', '@id': url + '#product', name: d.name, description: s.hook.lede, url,
        applicationCategory: isModel ? 'Artificial intelligence model' : 'SecurityApplication',
        featureList: c.groups.flatMap(g => g.items),
        publisher: { '@type': 'Organization', '@id': SITE + '/#organization', name: 'Singularity Research and Development Inc.', url: SITE + '/' } },
      { '@type': 'FAQPage', '@id': url + '#faq', mainEntity: s.objections.map(q => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })) },
    ],
  };
  const others = pages.filter(p => p.slug !== d.slug);
  const brief = `mailto:anil@singularityrd.com?subject=${encodeURIComponent(d.name + ' technical brief')}`;
  const off = 'Without ' + d.short, on = 'With ' + d.short;
  const works = d.fit.works && d.fit.works.length;
  const count = c.groups.reduce((n, g) => n + g.items.length, 0);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<title>${esc(d.title)}</title>
<meta name="description" content="${esc(d.description)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
<meta name="author" content="Singularity Research and Development Inc." />
<meta name="theme-color" content="#070707" />
<meta name="color-scheme" content="dark" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Singularity" />
<meta property="og:locale" content="en_US" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(d.name)} — ${esc(s.hook.kicker)}" />
<meta property="og:description" content="${esc(d.description)}" />
<meta property="og:image" content="${SITE}/assets/og-cover.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(d.name)} — ${esc(s.hook.kicker)}" />
<meta name="twitter:description" content="${esc(d.description)}" />
<meta name="twitter:image" content="${SITE}/assets/og-cover.png" />

<link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="assets/mark.svg" />
<link rel="sitemap" type="application/xml" href="/sitemap.xml" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Inter+Tight:wght@500;600&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="home.css" />
<link rel="stylesheet" href="product.css" />

<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body id="top" class="home product-page"${ACCENT[d.slug] ? ` style="--pa: ${ACCENT[d.slug]}"` : ''}>

${header}

<main>

<!-- ── The promise ──────────────────────────────────────────────── -->
<section class="p-hero">
  <div class="p-hero-art paint"${HERO[d.slug] ? ` style="${HERO[d.slug]}"` : ''}><canvas data-art="${ART[d.slug]}" width="1600" height="760" aria-hidden="true"></canvas></div>
  <div class="shell p-hero-inner">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Singularity</a><i aria-hidden="true">/</i><a href="index.html#products">Products</a><i aria-hidden="true">/</i><span aria-current="page">${esc(d.name)}</span></nav>
    <p class="p-kicker"><i></i>${esc(d.name)} · ${esc(s.hook.kicker)}</p>
    <h1 class="p-title">${sents(h1)}</h1>
    <p class="p-lede">${esc(s.hook.lede)}</p>
    <div class="hero-actions">
      <a class="btn btn-solid btn-lg" href="${CAL}" target="_blank" rel="noopener">Book a demo <span class="chev">›</span></a>
      <a class="btn btn-ghost btn-lg" href="#story">See the difference</a>
    </div>
  </div>
</section>
${s.stake ? `
<section class="wrap p-statw" aria-label="Key fact">
  <div class="p-stat">
    <p class="p-stat-v">${esc(s.stake.value)}</p>
    <p class="p-stat-l">${esc(s.stake.label)}<small>${esc(s.stake.source)}</small></p>
  </div>
</section>
` : ''}
<!-- ── The scene: one incident, told twice ──────────────────────── -->
<section class="wrap sec" id="story" aria-labelledby="scene-h">
  <p class="sec-tag">The same hours, twice</p>
  <h2 class="sec-title" id="scene-h">${sents(title(s.scene.title))}</h2>
  <p class="sec-sub">${esc(s.scene.setup)}</p>
  <table class="p-scene">
    <thead><tr><th scope="col"><span class="sr">Time</span></th><th scope="col">${esc(off)}</th><th scope="col">${esc(on)}</th></tr></thead>
    <tbody>
${s.scene.without.map((b, i) => `      <tr><th scope="row">${esc(b.t)}</th><td data-k="${esc(off)}">${esc(b.p)}</td><td data-k="${esc(on)}">${esc(s.scene.with[i].p)}</td></tr>`).join('\n')}
      <tr class="ps-end"><th scope="row">How it ends</th><td data-k="${esc(off)}">${esc(s.scene.end.without)}</td><td data-k="${esc(on)}">${esc(s.scene.end.with)}</td></tr>
    </tbody>
  </table>
</section>
${d.extra ? '\n' + d.extra : ''}
<!-- ── The case, chapter by chapter ─────────────────────────────── -->
<section class="wrap sec" aria-labelledby="case-h">
  <p class="sec-tag">Why ${esc(d.short)}</p>
  <h2 class="sec-title" id="case-h">${NUM[s.chapters.length]} reasons to choose ${esc(d.short)}</h2>
  <div class="p-chs">
${s.chapters.map((ch, i) => `    <article class="p-ch">
      <div class="p-ch-l">
        <p class="p-ch-n">0${i + 1} · ${esc(ch.tag)}</p>
        <h3>${esc(title(ch.h))}</h3>
        <p>${esc(ch.p)}</p>
      </div>
      <ul class="p-ch-r">${ch.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>
    </article>`).join('\n')}
  </div>
</section>

<!-- ── Before and after ─────────────────────────────────────────── -->
<section class="wrap sec" aria-labelledby="shift-h">
  <p class="sec-tag">Before and after</p>
  <h2 class="sec-title" id="shift-h">${sents(title(s.shift.title))}</h2>
  <table class="p-shift">
    <thead><tr><th scope="col"><span class="sr">What</span></th><th scope="col">Before</th><th scope="col">${esc(on)}</th></tr></thead>
    <tbody>
${s.shift.rows.map(r => `      <tr><th scope="row">${esc(r.k)}</th><td data-k="Before">${esc(r.before)}</td><td data-k="${esc(on)}">${esc(r.after)}</td></tr>`).join('\n')}
    </tbody>
  </table>
</section>

<!-- ── Where it stops ───────────────────────────────────────────── -->
<section class="wrap sec" aria-labelledby="limits-h">
  <p class="sec-tag">Straight talk</p>
  <h2 class="sec-title" id="limits-h">${sents(title(s.limits.title))}</h2>
  <div class="p-limits" style="--n: ${s.limits.items.length}">
${s.limits.items.map(it => `    <article class="p-limit"><span class="p-no" aria-hidden="true"></span><h3>${esc(title(it.h))}</h3><p>${esc(it.p)}</p></article>`).join('\n')}
  </div>
</section>

<!-- ── How you start ────────────────────────────────────────────── -->
<section class="wrap sec" aria-labelledby="pilot-h">
  <p class="sec-tag">How you start</p>
  <h2 class="sec-title" id="pilot-h">${sents(title(s.pilot.title))}</h2>
  <ol class="p-steps" style="--n: ${s.pilot.steps.length}">
${s.pilot.steps.map((it, i) => `    <li><b>${i + 1}</b><h3>${esc(title(it.h))}</h3><p>${esc(it.p)}</p></li>`).join('\n')}
  </ol>
</section>

<!-- ── The questions buyers ask ─────────────────────────────────── -->
<section class="wrap sec" id="faq" aria-labelledby="faq-h">
  <p class="sec-tag">Questions buyers ask</p>
  <h2 class="sec-title" id="faq-h">Questions about ${esc(d.short)}</h2>
  <div class="faq">
${s.objections.map((q, i) => `    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary><h3>${nb(q.q)}</h3><span class="faq-mark" aria-hidden="true"></span></summary>
      <p>${esc(q.a)}</p>
    </details>`).join('\n')}
  </div>
</section>

<!-- ── The full list, for the evaluation team ───────────────────── -->
<section class="wrap sec" id="features" aria-labelledby="caps-h">
  <details class="p-sheet">
    <summary><span><b id="caps-h">Every feature of ${esc(d.short)}</b><small>The full list for your evaluation team: ${count} capabilities in ${c.groups.length} groups.</small></span><i class="p-sheet-mark" aria-hidden="true"></i></summary>
    <div class="p-sheet-in">
      <div class="p-caps">
${c.groups.map(g => `        <article class="p-cap"><h3>${esc(g.h)}</h3><ul>${g.items.map(it => `<li>${esc(it)}</li>`).join('')}</ul></article>`).join('\n')}
      </div>${c.specs.length ? `
      <dl class="p-specs">
${c.specs.map(x => `        <div><dt>${esc(x.k)}</dt><dd>${esc(x.v)}</dd></div>`).join('\n')}
      </dl>` : ''}
      <div class="p-fit${works ? '' : ' is-one'}">
        <div><p class="p-fit-k">Built for</p><ul class="p-chips">${d.fit.who.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>${works ? `
        <div><p class="p-fit-k">Works with</p><ul class="p-chips">${d.fit.works.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
      </div>
    </div>
  </details>
</section>

<!-- ── The close ────────────────────────────────────────────────── -->
<section class="wrap sec" id="contact" aria-labelledby="contact-h">
  <div class="p-cta">
    <p class="sec-tag">Book a demo</p>
    <h2 class="cta-title" id="contact-h">${sents(title(s.close.h))}</h2>
    <p>${esc(s.close.p)}</p>
    <div class="hero-actions">
      <a class="btn btn-solid btn-lg" href="${CAL}" target="_blank" rel="noopener">Book a demo <span class="chev">›</span></a>
      <a class="btn btn-ghost btn-lg" href="${brief}">Request the technical brief</a>
    </div>
    <p class="p-nda">Architecture, deployment and integration details are shared under NDA.</p>
  </div>
  <nav class="p-more" aria-label="More from Singularity">
    <p>More from Singularity</p>
${others.map(p => `    <a href="${p.slug}.html"><b>${esc(p.name)}</b><span>${esc(p.story.hook.kicker)}</span></a>`).join('\n')}
  </nav>
</section>

</main>

${footer}

<script src="art.js" defer></script>
<script src="home.js" defer></script>
</body>
</html>
`;
}

for (const d of pages) {
  const html = page(d);
  JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  fs.writeFileSync(path.join(site, d.slug + '.html'), html.replace(/\n/g, '\r\n'));
  console.log('wrote', d.slug + '.html', html.length);
}
