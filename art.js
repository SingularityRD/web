/* Generative paintings.
 *
 * Every <canvas data-art="name"> is painted in the browser from a fixed seed:
 * a few thousand short pastel strokes laid down the way a painter would, sky
 * first, then clouds, then land, then the one object that tells the story.
 * There are no image files to download.
 *
 * A picture is never seen being built. It is prepared off screen, fades in
 * finished, and then lives: clouds drift, a beam sways, a corona turns
 * (sheets of the same painting, moved by CSS), while a small canvas on top
 * keeps the lights going (stars, glows, water, a shooting star). With reduced
 * motion the picture is one still canvas. */
(function () {
  'use strict';
  var list = [].slice.call(document.querySelectorAll('canvas[data-art]'));
  if (!list.length) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window);
  /* Phones get lighter canvases: the same pictures at 70% of the pixels. */
  var RES = (window.innerWidth || 1200) < 700 ? 0.7 : 1;

  var TAU = Math.PI * 2, HALF = Math.PI / 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function C(h) { return typeof h === 'string' ? [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)] : h; }
  function mix(a, b, t) { a = C(a); b = C(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function ramp(stops, t) {
    t = clamp(t, 0, 1);
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], ease((t - stops[i - 1][0]) / ((stops[i][0] - stops[i - 1][0]) || 1)));
    }
    return C(stops[stops.length - 1][1]);
  }

  /* Stands in for a 2D context: it notes every drawing call instead of making
     it. Gradients and patterns are real, since creating one draws nothing. */
  function recorder(real) {
    var ops = [], rec = { ops: ops };
    ['save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'arc', 'fill', 'stroke', 'clip', 'fillRect', 'setLineDash'].forEach(function (m) {
      rec[m] = function () { ops.push([m, [].slice.call(arguments)]); };
    });
    ['strokeStyle', 'fillStyle', 'lineWidth', 'lineCap', 'globalCompositeOperation'].forEach(function (p) {
      Object.defineProperty(rec, p, { set: function (v) { ops.push([p, v]); } });
    });
    rec.createLinearGradient = function (x0, y0, x1, y1) { return real.createLinearGradient(x0, y0, x1, y1); };
    rec.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { return real.createRadialGradient(x0, y0, r0, x1, y1, r1); };
    rec.createPattern = function (img, rep) { return real.createPattern(img, rep); };
    return rec;
  }

  /* ── The painter: one canvas, one seeded hand ─────────────────────────── */
  function painter(cv, seed) {
    var real = cv.getContext('2d'), W = cv.width, H = cv.height, u = Math.min(W, H) / 460, s = seed >>> 0, effects = [], cuts = [], grained = false;
    if (RES < 1) { cv.width = Math.round(W * RES); cv.height = Math.round(H * RES); real = cv.getContext('2d'); real.scale(RES, RES); }
    var ctx = recorder(real);
    function R() { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    function rr(a, b) { return a + (b - a) * R(); }
    var tab = [], i;
    for (i = 0; i < 256; i++) tab.push(R());
    function n1(x) { var k = Math.floor(x), f = x - k; return lerp(tab[k & 255], tab[(k + 1) & 255], ease(f)); }
    function fbm(x) { return n1(x) * 0.55 + n1(x * 2.13 + 19.1) * 0.28 + n1(x * 4.37 + 47.7) * 0.17; }
    function css(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
    function vary(c, k) {
      var d = (R() - 0.5) * k;
      return [clamp(c[0] + d + (R() - 0.5) * k * 0.6, 0, 255), clamp(c[1] + d + (R() - 0.5) * k * 0.6, 0, 255), clamp(c[2] + d + (R() - 0.5) * k * 0.6, 0, 255)];
    }

    /* One stroke of pastel. "Dry" strokes skip, like chalk over paper tooth. */
    function dab(x, y, len, ang, w, c, a, dry) {
      var dx = Math.cos(ang) * len * 0.5, dy = Math.sin(ang) * len * 0.5, b = (R() - 0.5) * len * 0.22;
      w = Math.max(0.6, w);
      ctx.strokeStyle = css(c, a);
      ctx.lineWidth = w;
      ctx.lineCap = dry ? 'butt' : 'round';
      ctx.setLineDash(dry ? [w * rr(1.2, 4.5), w * rr(0.12, 0.5)] : []);
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.quadraticCurveTo(x - Math.sin(ang) * b, y + Math.cos(ang) * b, x + dx, y + dy);
      ctx.stroke();
    }
    function glow(x, y, r, c, a) {
      c = C(c);
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, css(c, a));
      g.addColorStop(1, css(c, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    }
    function light(fn) { ctx.save(); ctx.globalCompositeOperation = 'screen'; fn(); ctx.restore(); }

    /* ── Sky, weather, water ── */
    function sky(stops, y1) {
      var g = ctx.createLinearGradient(0, 0, 0, y1), k, y;
      stops.forEach(function (st) { g.addColorStop(st[0], css(C(st[1]), 1)); });
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, y1 + 4);
      var step = 2.6 * u, per = Math.ceil(W / (38 * u));
      for (y = 0; y < y1; y += step) {
        for (k = 0; k < per; k++) {
          dab(rr(-20, W + 20), y + rr(-3, 3) * u, rr(36, 150) * u, rr(-0.09, 0.09), rr(3.5, 9.5) * u, vary(ramp(stops, y / y1 + rr(-0.05, 0.05)), 15), rr(0.3, 0.75), R() < 0.65);
        }
      }
    }
    function stars(n, y1, c) {
      c = C(c || '#fff3dc');
      for (var k = 0; k < n; k++) {
        ctx.fillStyle = css(vary(c, 30), rr(0.3, 0.95));
        ctx.beginPath();
        ctx.arc(rr(0, W), Math.pow(R(), 1.6) * y1, rr(0.5, 1.5) * u, 0, TAU);
        ctx.fill();
      }
    }
    function bands(y, spread, n, c, a) {
      c = C(c);
      for (var k = 0; k < n; k++) dab(rr(0, W), y + rr(-1, 1) * spread, rr(90, 360) * u, rr(-0.035, 0.035), rr(2.5, 7) * u, vary(c, 16), rr(0.25, 1) * (a || 0.5), true);
    }
    function puff(cx, cy, r, pal) {
      var n = Math.ceil(r * r / (26 * u * u)) + 10, lit = C(pal.lit), shade = C(pal.shade), rimc = C(pal.rim);
      for (var k = 0; k < n; k++) {
        var a = R() * TAU, d = Math.sqrt(R()) * r, nx = Math.cos(a), ny = Math.sin(a);
        var t = clamp(0.5 + 0.5 * (nx * pal.lx + ny * pal.ly) * (d / r) * 1.25 + rr(-0.12, 0.12), 0, 1);
        var c = t > 0.8 ? mix(lit, rimc, (t - 0.8) / 0.2) : mix(shade, lit, t / 0.8);
        dab(cx + nx * d, cy + ny * d * 0.84, rr(0.2, 0.5) * r, a + HALF + rr(-0.5, 0.5), rr(4, 10) * u, vary(c, 14), rr(0.5, 0.92), R() < 0.5);
      }
    }
    function cloud(cx, base, w, h, pal, n) {
      var ps = [], k;
      for (k = 0; k < n; k++) {
        var up = Math.pow(R(), 1.4), spread = 1 - up * 0.65;
        ps.push([cx + (R() - 0.5) * w * spread, base - up * h - rr(0, 0.08) * h, lerp(w * 0.2, w * 0.085, up) * rr(0.75, 1.25)]);
      }
      ps.sort(function (a, b) { return a[1] - b[1]; });
      ps.forEach(function (q) { puff(q[0], q[1], q[2], pal); });
      /* A soft, shaded underside: short strokes that thin out to the sides. */
      var under = mix(pal.shade, pal.lit, 0.2);
      for (k = 0; k < w / (7 * u); k++) {
        var off = (R() + R() - 1) * 0.5;
        dab(cx + off * w * 0.9, base + rr(-0.03, 0.06) * h, rr(14, 46) * u, rr(-0.08, 0.08), rr(3, 7) * u, vary(under, 12), rr(0.2, 0.5) * (1 - Math.abs(off) * 1.2), true);
      }
      /* Loose wisps at the edges, so the outline is not a row of circles. */
      for (k = 0; k < n * 5; k++) {
        var q = ps[(R() * ps.length) | 0], a = R() * TAU, d = q[2] * rr(0.85, 1.2);
        dab(q[0] + Math.cos(a) * d, q[1] + Math.sin(a) * d * 0.84, rr(0.2, 0.55) * q[2], a + HALF + rr(-0.7, 0.7), rr(2, 5) * u, vary(mix(pal.shade, pal.lit, clamp(0.5 + 0.5 * (Math.cos(a) * pal.lx + Math.sin(a) * pal.ly) + rr(-0.15, 0.15), 0, 1)), 14), rr(0.2, 0.55), true);
      }
    }
    function water(y0, y1, stops, glint, gx) {
      var g = ctx.createLinearGradient(0, y0, 0, y1), k, y, t;
      stops.forEach(function (st) { g.addColorStop(st[0], css(C(st[1]), 1)); });
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, W, y1 - y0 + 4);
      var step = 3 * u, per = Math.ceil(W / (34 * u));
      for (y = y0; y < y1; y += step) {
        t = (y - y0) / (y1 - y0);
        for (k = 0; k < per; k++) dab(rr(-10, W + 10), y + rr(-2, 2) * u, rr(20, 110) * u * (0.5 + t), rr(-0.03, 0.03), rr(2, 6) * u * (0.6 + t * 0.8), vary(ramp(stops, t + rr(-0.06, 0.06)), 14), rr(0.3, 0.75), R() < 0.7);
      }
      if (glint) {
        gx = gx == null ? W * 0.5 : gx;
        for (k = 0; k < 150; k++) {
          t = Math.pow(R(), 0.8);
          dab(gx + rr(-1, 1) * (14 + t * 70) * u, lerp(y0, y1, t), rr(8, 40) * u * (0.4 + t), rr(-0.03, 0.03), rr(1.2, 3.2) * u, vary(C(glint), 18), rr(0.25, 0.8) * (1 - t * 0.6), false);
        }
      }
    }

    /* ── Solid things: a filled outline, hatched with strokes ── */
    function fillPoly(pts, dark, lite, o) {
      o = o || {};
      dark = C(dark); lite = C(lite);
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, k;
      pts.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
      x0 = Math.max(x0, -10); x1 = Math.min(x1, W + 10); y0 = Math.max(y0, -10); y1 = Math.min(y1, H + 10);
      ctx.save();
      ctx.beginPath();
      pts.forEach(function (q, j) { if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      ctx.fillStyle = css(dark, 1);
      ctx.fill();
      ctx.clip();
      var n = Math.ceil((x1 - x0) * (y1 - y0) / ((o.den || 150) * u * u));
      for (k = 0; k < n; k++) {
        var px = rr(x0, x1), py = rr(y0, y1);
        var t = o.grad === 'x' ? (px - x0) / ((x1 - x0) || 1) : (py - y0) / ((y1 - y0) || 1);
        dab(px, py, rr(12, 54) * u * (o.len || 1), (o.hatch == null ? 0.4 : o.hatch) + rr(-0.3, 0.3), rr(2.5, 6.5) * u, vary(mix(lite, dark, clamp(t * (o.fall == null ? 1.5 : o.fall) + rr(-0.25, 0.25), 0, 1)), 12), rr(0.35, 0.8), R() < 0.7);
      }
      ctx.restore();
    }
    /* A line of hills. Returns its crest so things can stand on it. */
    function ridge(y0, amp, freq, off, dark, lite, o) {
      o = o || {};
      var crest = [], x;
      for (x = -12; x <= W + 12; x += 6 * u) crest.push([x, y0 - amp * (o.shape ? o.shape(x / W) : fbm(x / W * freq + off))]);
      fillPoly([[-12, H + 12]].concat(crest, [[W + 12, H + 12]]), dark, lite, { hatch: o.hatch == null ? 0.35 : o.hatch, fall: o.fall || 1.6, den: o.den });
      if (o.rim) {
        var rimc = C(o.rim);
        crest.forEach(function (q) { if (R() < 0.6) dab(q[0], q[1] + rr(1, 5) * u, rr(8, 26) * u, rr(-0.3, 0.3), rr(1.5, 3.5) * u, vary(rimc, 14), rr(0.3, 0.75), true); });
      }
      return crest;
    }
    function groundAt(crest, x) {
      for (var k = 1; k < crest.length; k++) if (crest[k][0] >= x) return lerp(crest[k - 1][1], crest[k][1], (x - crest[k - 1][0]) / ((crest[k][0] - crest[k - 1][0]) || 1));
      return crest[crest.length - 1][1];
    }
    function place(pts, x, y, k) { return pts.map(function (q) { return [x + q[0] * k, y + q[1] * k]; }); }
    /* Catch light along chosen edges of an outline. */
    function rim(pts, idx, c, wgt) {
      c = C(c);
      idx.forEach(function (j) {
        var a = pts[j], b = pts[(j + 1) % pts.length], n = Math.max(2, Math.hypot(b[0] - a[0], b[1] - a[1]) / (5 * u));
        for (var k = 0; k < n; k++) {
          var t = R();
          dab(lerp(a[0], b[0], t), lerp(a[1], b[1], t), rr(4, 12) * u, Math.atan2(b[1] - a[1], b[0] - a[0]) + rr(-0.15, 0.15), rr(1, 2.4) * u * (wgt || 1), vary(c, 16), rr(0.35, 0.85), false);
        }
      });
    }
    function skyline(x0, x1, base, hMin, hMax, dark, win, pLit) {
      var x = x0;
      while (x < x1) {
        var w = rr(14, 40) * u, h = rr(hMin, hMax), top = base - h, cI, rI;
        fillPoly([[x, base + 3], [x, top], [x + w, top], [x + w, base + 3]], dark, mix(dark, '#ffffff', 0.09), { den: 60, len: 0.5, hatch: HALF, fall: 1.2 });
        var cols = Math.max(1, Math.floor(w / (7 * u))), rows = Math.max(1, Math.floor(h / (8 * u)));
        for (cI = 0; cI < cols; cI++) {
          for (rI = 0; rI < rows; rI++) {
            if (R() < pLit) dab(x + (cI + 0.5) * (w / cols), top + (rI + 0.6) * (h / rows), rr(2, 3.6) * u, rr(-0.2, 0.2), rr(1.8, 3) * u, vary(C(win), 26), rr(0.6, 1), false);
          }
        }
        x += w + rr(-2, 5) * u;
      }
    }

    /* ── Lights in the sky ── */
    function disc(x, y, r, core, edge, n) {
      for (var k = 0; k < n; k++) {
        var a = R() * TAU, d = Math.sqrt(R()) * r;
        dab(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(0.2, 0.6) * r, a + HALF + rr(-0.6, 0.6), rr(1.5, 4) * u, vary(mix(core, edge, d / r), 12), rr(0.6, 0.95), false);
      }
    }
    function moon(x, y, r, c) { glow(x, y, r * 5, c, 0.26); disc(x, y, r, c, mix(c, '#9fb0d0', 0.4), 280); }
    function sun(x, y, r, core, halo) { glow(x, y, r * 6.5, halo, 0.6); glow(x, y, r * 2.4, core, 0.85); disc(x, y, r, '#ffffff', core, 520); }
    /* The singularity: a black disc with a painted corona. */
    function eclipse(cx, cy, r, core, corona, spin) {
      core = C(core); corona = C(corona);
      var k, a, d;
      glow(cx, cy, r * 5.2, corona, 0.5);
      glow(cx, cy, r * 2.2, core, 0.55);
      if (spin) layer(spin);
      light(function () {
        for (k = 0; k < 900; k++) {
          a = R() * TAU;
          var far = Math.pow(R(), 2.1);
          d = r * (1.03 + far * 2.7);
          dab(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * rr(0.25, 0.95) * (1.25 - far * 0.6), a + rr(-0.1, 0.1), rr(1.4, 4) * u, vary(mix(core, corona, clamp(far * 1.4, 0, 1)), 18), rr(0.1, 0.42) * (1 - far * 0.8), true);
        }
      });
      if (spin) layer({ kind: 'still', box: [cx - r * 1.5, cy - r * 1.5, cx + r * 1.5, cy + r * 1.5] });
      ctx.fillStyle = '#04040b';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.985, 0, TAU);
      ctx.fill();
      for (k = 0; k < 190; k++) {
        a = R() * TAU; d = Math.sqrt(R()) * r * 0.92;
        dab(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr(0.15, 0.45) * r, a + HALF, rr(2, 5) * u, vary([9, 9, 22], 8), rr(0.3, 0.7), true);
      }
      for (k = 0; k < 300; k++) {
        a = R() * TAU;
        dab(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * rr(0.12, 0.36), a + HALF, rr(1.3, 3) * u, vary(core, 10), rr(0.45, 0.95), false);
      }
      if (spin) layer();
    }
    function beam(x, y, ang, len, spread, c) {
      c = C(c);
      light(function () {
        for (var k = 0; k < 560; k++) {
          var t = Math.pow(R(), 0.7), a = ang + (R() - 0.5) * spread * 2, d = t * len;
          dab(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(30, 120) * u, a + rr(-0.03, 0.03), rr(1.5, 5) * u * (0.5 + t), vary(c, 14), rr(0.03, 0.16) * (1 - t * 0.75), true);
        }
      });
      glow(x, y, 30 * u, c, 0.95);
    }

    /* ── The objects that tell each story ── */
    function lighthouse(x, base, h, body, band, dark) {
      var w0 = h * 0.12, w1 = h * 0.075, top = base - h, k;
      fillPoly([[x - w0, base], [x - w1, top], [x + w1, top], [x + w0, base]], dark, body, { den: 26, len: 0.5, hatch: 1.4, grad: 'x', fall: 1.15 });
      for (k = 0; k < 2; k++) {
        var t0 = 0.22 + k * 0.34, ya = lerp(base, top, t0), yb = lerp(base, top, t0 + 0.15), wa = lerp(w0, w1, t0), wb = lerp(w0, w1, t0 + 0.15);
        fillPoly([[x - wa, ya], [x - wb, yb], [x + wb, yb], [x + wa, ya]], mix(band, '#000000', 0.5), band, { den: 20, len: 0.4, hatch: 1.4, grad: 'x', fall: 1.15 });
      }
      fillPoly([[x - w1 * 1.55, top], [x - w1 * 1.55, top - h * 0.022], [x + w1 * 1.55, top - h * 0.022], [x + w1 * 1.55, top]], dark, dark, { den: 60 });
      fillPoly([[x - w1 * 0.8, top - h * 0.022], [x - w1 * 0.8, top - h * 0.1], [x + w1 * 0.8, top - h * 0.1], [x + w1 * 0.8, top - h * 0.022]], '#ffdf8f', '#fff8dc', { den: 12, len: 0.3 });
      fillPoly([[x - w1 * 1.05, top - h * 0.1], [x, top - h * 0.165], [x + w1 * 1.05, top - h * 0.1]], dark, dark, { den: 60 });
      return [x, top - h * 0.06];
    }
    function dome(cx, base, r, c1, c2) {
      c1 = C(c1); c2 = C(c2);
      var k, a;
      glow(cx, base - r * 0.25, r * 1.5, c2, 0.22);
      light(function () {
        for (k = 0; k < 560; k++) {
          a = Math.PI + R() * Math.PI;
          var rad = r * rr(0.985, 1.015);
          dab(cx + Math.cos(a) * rad, base + Math.sin(a) * rad, rr(8, 30) * u, a + HALF + rr(-0.08, 0.08), rr(1, 2.8) * u, vary(mix(c1, c2, R()), 16), rr(0.25, 0.8), false);
        }
        [0.33, 0.66].forEach(function (f) {
          for (k = 0; k < 170; k++) {
            a = Math.PI + R() * Math.PI;
            dab(cx + Math.cos(a) * r * f, base + Math.sin(a) * r, rr(6, 18) * u, Math.atan2(Math.cos(a) * r, -Math.sin(a) * r * f), rr(0.8, 1.6) * u, vary(c1, 14), rr(0.1, 0.35), true);
          }
        });
        for (k = 0; k < 110; k++) dab(cx, base - R() * r, rr(6, 18) * u, HALF, rr(0.8, 1.6) * u, vary(c1, 14), rr(0.1, 0.35), true);
        [0.38, 0.72].forEach(function (f) {
          var half = r * Math.sqrt(1 - f * f);
          for (k = 0; k < 100; k++) dab(cx + rr(-1, 1) * half, base - r * f + rr(-1, 1) * u, rr(8, 26) * u, rr(-0.05, 0.05), rr(0.8, 1.6) * u, vary(c1, 14), rr(0.1, 0.3), true);
        });
      });
    }
    /* Something hostile arrives and stops dead at the shield. */
    function strike(x0, y0, x1, y1, c) {
      c = C(c);
      var ang = Math.atan2(y1 - y0, x1 - x0), k;
      light(function () {
        for (k = 0; k < 54; k++) {
          var t = Math.pow(R(), 0.6);
          dab(lerp(x0, x1, t) + rr(-2, 2) * u, lerp(y0, y1, t) + rr(-2, 2) * u, rr(10, 34) * u, ang + rr(-0.04, 0.04), rr(1, 3) * u, vary(c, 20), 0.08 + t * 0.7, false);
        }
        for (k = 0; k < 30; k++) {
          var a = R() * TAU, d = rr(2, 13) * u;
          dab(x1 + Math.cos(a) * d, y1 + Math.sin(a) * d, rr(4, 12) * u, a, rr(1, 2.4) * u, vary(mix(c, '#ffffff', 0.45), 20), rr(0.4, 0.9), false);
        }
      });
      glow(x1, y1, 34 * u, c, 0.65);
    }
    function tower(x, base, w, h, dark, lite, cols, rows, lit, win) {
      var top = base - h, cw = w / cols, rh = h / (rows + 0.6), cI, rI, k;
      fillPoly([[x, base], [x, top], [x + w, top], [x + w, base]], dark, lite, { den: 36, len: 0.7, hatch: HALF, grad: 'x', fall: 1.2 });
      for (cI = 0; cI < cols; cI++) {
        for (rI = 0; rI < rows; rI++) {
          var wx = x + (cI + 0.5) * cw, wy = top + (rI + 0.9) * rh, on = false;
          for (k = 0; k < lit.length; k++) if (lit[k][0] === cI && lit[k][1] === rI) on = true;
          if (on) {
            for (k = 0; k < 16; k++) dab(wx + rr(-0.28, 0.28) * cw, wy + rr(-0.22, 0.22) * rh, rr(0.25, 0.5) * cw, rr(-0.1, 0.1), rr(2, 4) * u, vary(C(win), 20), rr(0.7, 1), false);
            glow(wx, wy, cw * 2.6, win, 0.6);
          } else {
            dab(wx, wy, cw * 0.55, rr(-0.04, 0.04), rh * 0.36, vary(mix(dark, lite, 0.6), 8), rr(0.35, 0.7), true);
          }
        }
      }
      dab(x + w * 0.5, top - h * 0.06, h * 0.12, HALF, 1.8 * u, C(dark), 1, false);
      glow(x + w * 0.5, top - h * 0.12, 9 * u, '#ff5a4a', 0.95);
    }
    function wall(x0, x1, top, base, dark, lite, rimc) {
      var pts = [[x0, base], [x0, top]], m = 17 * u, x = x0, up = true, y, k;
      while (x < x1) {
        var nx = Math.min(x + m, x1), yy = up ? top - m * 0.75 : top;
        pts.push([x, yy]); pts.push([nx, yy]);
        x = nx; up = !up;
      }
      pts.push([x1, top]); pts.push([x1, base]);
      fillPoly(pts, dark, lite, { den: 60, len: 0.8, hatch: 0.05, fall: 1.15 });
      for (y = top + 9 * u; y < base; y += 13 * u) {
        for (k = 0; k < (x1 - x0) / (24 * u); k++) dab(rr(x0, x1), y + rr(-1, 1) * u, rr(14, 40) * u, rr(-0.02, 0.02), rr(0.8, 1.6) * u, vary(mix(dark, '#000000', 0.45), 8), rr(0.2, 0.5), true);
      }
      rimc = C(rimc);
      for (k = 0; k < (x1 - x0) / (4 * u); k++) dab(rr(x0, x1), top - rr(0, m * 0.75), rr(6, 16) * u, rr(-0.1, 0.1), rr(1, 2.2) * u, vary(rimc, 16), rr(0.15, 0.55), true);
    }
    function crack(x, y0, y1, hot, halo) {
      hot = C(hot);
      var pts = [[x, y0]], y = y0, cx = x, j, k;
      while (y < y1) { y += rr(12, 28) * u; cx += rr(-15, 15) * u; pts.push([cx, Math.min(y, y1)]); }
      pts.forEach(function (q, n) { glow(q[0], q[1], lerp(64, 22, n / pts.length) * u, halo, 0.34); });
      light(function () {
        for (j = 1; j < pts.length; j++) {
          var a = pts[j - 1], b = pts[j], t = j / pts.length, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (k = 0; k < 7; k++) dab(lerp(a[0], b[0], 0.5) + rr(-1.5, 1.5) * u, lerp(a[1], b[1], 0.5) + rr(-1.5, 1.5) * u, len * rr(0.8, 1.15), ang + rr(-0.05, 0.05), lerp(5.5, 1.4, t) * u * rr(0.6, 1.1), vary(hot, 14), rr(0.5, 0.95), false);
          if (R() < 0.55) {
            var sa = ang + (R() < 0.5 ? -1 : 1) * rr(0.6, 1.1);
            for (k = 0; k < 4; k++) dab(b[0] + Math.cos(sa) * rr(4, 16) * u, b[1] + Math.sin(sa) * rr(4, 16) * u, rr(10, 26) * u, sa + rr(-0.1, 0.1), rr(0.8, 2) * u, vary(hot, 20), rr(0.3, 0.7), false);
          }
        }
        for (k = 0; k < 150; k++) {
          var fa = -HALF + rr(-0.75, 0.75), d = rr(10, 190) * u;
          dab(x + Math.cos(fa) * d, y0 + Math.sin(fa) * d, rr(20, 70) * u, fa, rr(1, 3) * u, vary(hot, 18), rr(0.03, 0.14), true);
        }
      });
    }
    /* A keyhole of light in the wall: the way in, opened from the inside. */
    function keyhole(cx, cy, r, hot, halo) {
      hot = C(hot);
      var k, ang, d, t, half;
      glow(cx, cy + r, r * 6, halo, 0.5);
      glow(cx, cy + r * 0.6, r * 2.6, hot, 0.5);
      /* The shape itself, solid, so its edge stays crisp under the strokes. */
      ctx.fillStyle = css(mix(hot, halo, 0.25), 0.96);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.42, cy + r * 0.5);
      ctx.lineTo(cx + r * 0.42, cy + r * 0.5);
      ctx.lineTo(cx + r * 0.86, cy + r * 2.9);
      ctx.lineTo(cx - r * 0.86, cy + r * 2.9);
      ctx.closePath();
      ctx.fill();
      light(function () {
        for (k = 0; k < 280; k++) {
          ang = R() * TAU; d = Math.sqrt(R()) * r * 0.9;
          dab(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, rr(0.2, 0.45) * r, HALF + rr(-0.3, 0.3), rr(1.5, 4) * u, vary(hot, 14), rr(0.5, 0.95), false);
        }
        for (k = 0; k < 440; k++) {
          t = R(); half = lerp(r * 0.36, r * 0.76, t);
          dab(cx + (R() * 2 - 1) * half, cy + r * 0.6 + t * r * 2.15, rr(0.2, 0.45) * r, HALF + rr(-0.2, 0.2), rr(1.5, 4) * u, vary(hot, 14), rr(0.5, 0.95), false);
        }
      });
    }
    /* Light from the opening, pooled on the ground. */
    function spill(cx, y, w, depth, c) {
      c = C(c);
      light(function () {
        for (var k = 0; k < 380; k++) {
          var t = Math.pow(R(), 0.8), half = w * (0.3 + t * 1.6);
          dab(cx + (R() * 2 - 1) * half, y + t * depth, rr(14, 60) * u * (0.6 + t), rr(-0.04, 0.04), rr(1.5, 4) * u, vary(c, 16), rr(0.08, 0.36) * (1 - t * 0.7), true);
        }
      });
    }
    /* A small figure, for scale. */
    function person(x, y, k, dark, rimc) {
      var body = place([[-7, 0], [-9, -30], [-7, -52], [-3, -58], [3, -58], [7, -52], [9, -30], [7, 0], [2, 0], [0, -24], [-2, 0]], x, y, k);
      fillPoly(body, dark, mix(dark, rimc, 0.14), { den: 16, len: 0.3, hatch: HALF });
      ctx.fillStyle = css(C(dark), 1);
      ctx.beginPath();
      ctx.arc(x, y - 66 * k, 6.5 * k, 0, TAU);
      ctx.fill();
      rim(body, [4, 5, 6], rimc, 0.8);
    }
    function fox(x, y, k, dark, lightc) {
      var tail = place([[-24, 0], [-44, -1], [-66, -8], [-84, -24], [-84, -42], [-70, -40], [-52, -24], [-34, -12]], x, y, k);
      var body = place([[-26, 0], [-35, -14], [-37, -34], [-31, -54], [-21, -70], [-11, -80], [-13, -92], [-9, -104], [-15, -118], [-21, -152], [-2, -122], [4, -115], [8, -125], [23, -158], [27, -119], [31, -109], [45, -99], [47, -93], [35, -89], [27, -86], [21, -78], [23, -60], [25, -30], [27, -6], [31, 0], [13, 0], [11, -22], [5, -8], [1, 0]], x, y, k);
      fillPoly(tail, dark, mix(dark, lightc, 0.2), { den: 30, len: 0.5, hatch: -0.4 });
      fillPoly(body, dark, mix(dark, lightc, 0.18), { den: 30, len: 0.5, hatch: 1.2 });
      rim(body, [9, 13, 14, 15, 20, 21, 22], lightc);
      rim(tail, [3, 4], lightc, 0.8);
      dab(x + 18 * k, y - 134 * k, 22 * k, -1.35, 3 * k, mix(dark, lightc, 0.45), 0.7, false);
      ctx.fillStyle = css(C('#fff2d2'), 0.95);
      ctx.beginPath();
      ctx.arc(x + 30 * k, y - 101 * k, 1.6 * k, 0, TAU);
      ctx.fill();
    }
    function robot(x, y, k, dark, eye) {
      var steel = mix(dark, '#5a6a90', 0.34);
      function leg(hx, hy, kx, ky, fx, fy, c) {
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineWidth = 7 * k;
        ctx.strokeStyle = css(C(c), 1);
        ctx.beginPath();
        ctx.moveTo(x + hx * k, y + hy * k);
        ctx.lineTo(x + kx * k, y + ky * k);
        ctx.lineTo(x + fx * k, y + fy * k);
        ctx.stroke();
        ctx.fillStyle = css(C(c), 1);
        ctx.beginPath();
        ctx.arc(x + kx * k, y + ky * k, 5 * k, 0, TAU);
        ctx.fill();
      }
      leg(-30, -40, -18, -20, -30, 0, mix(dark, '#30405c', 0.5));
      leg(26, -40, 38, -20, 26, 0, mix(dark, '#30405c', 0.5));
      var body = place([[-48, -36], [-50, -52], [-44, -60], [34, -60], [44, -54], [44, -38], [36, -34], [-40, -34]], x, y, k);
      var head = place([[40, -58], [46, -70], [64, -70], [70, -58], [66, -46], [44, -46]], x, y, k);
      fillPoly(body, dark, steel, { den: 24, len: 0.5, hatch: 0.05 });
      fillPoly(head, dark, steel, { den: 20, len: 0.4 });
      leg(-40, -40, -30, -18, -42, 0, dark);
      leg(16, -40, 30, -18, 16, 0, dark);
      rim(body, [2], '#f1c892', 0.9);
      rim(head, [1], '#f1c892', 0.9);
      glow(x + 62 * k, y - 59 * k, 18 * k, eye, 0.9);
      dab(x + 60 * k, y - 59 * k, 9 * k, 0, 2.6 * k, C(eye), 1, false);
    }
    function shield(cx, cy, r, c) {
      c = C(c);
      glow(cx, cy, r * 1.3, c, 0.14);
      light(function () {
        for (var k = 0; k < 320; k++) {
          var a = Math.PI * 1.08 + R() * Math.PI * 0.84, rad = r * rr(0.985, 1.015);
          dab(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, rr(8, 26) * u, a + HALF, rr(1, 2.6) * u, vary(c, 16), rr(0.25, 0.85), false);
        }
      });
    }
    function rings(cx, cy, radii, c) {
      c = C(c);
      light(function () {
        radii.forEach(function (r, j) {
          var n = Math.ceil(r / u * 1.7);
          for (var k = 0; k < n; k++) {
            var a = Math.PI + R() * Math.PI;
            dab(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.86, rr(8, 30) * u, a + HALF, rr(1, 2.6) * u, vary(c, 18), rr(0.2, 0.7) * (1 - j / (radii.length + 1.5)), true);
          }
        });
      });
      glow(cx, cy, 44 * u, c, 0.5);
    }
    function factory(x, base, k, dark, lite, win, smoke) {
      var hw = 230 * k, hh = 64 * k, teeth = 4, tw = hw / teeth, hall = [[x, base], [x, base - hh]], j;
      for (j = 0; j < teeth; j++) { hall.push([x + j * tw + tw * 0.72, base - hh - 26 * k]); hall.push([x + (j + 1) * tw, base - hh]); }
      hall.push([x + hw, base]);
      var stacks = [[hw + 96, 196], [hw + 134, 150]];
      if (smoke) layer(smoke);
      stacks.forEach(function (q) { cloud(x + q[0] * k + 40 * k, base - q[1] * k - 14 * k, 96 * k, 46 * k, { lit: '#6fb7a8', shade: '#143b44', rim: '#d6f5e0', lx: -0.6, ly: -0.5 }, 7); });
      if (smoke) layer();
      stacks.forEach(function (q) {
        var cx = x + q[0] * k, ch = q[1] * k;
        fillPoly([[cx - 9 * k, base], [cx - 6.5 * k, base - ch], [cx + 6.5 * k, base - ch], [cx + 9 * k, base]], dark, lite, { den: 20, len: 0.5, hatch: 1.5, grad: 'x' });
        dab(cx, base - ch + 14 * k, 13 * k, 0, 5 * k, C('#d9584a'), 0.9, false);
        dab(cx, base - ch + 30 * k, 13.6 * k, 0, 5 * k, C('#e8ecea'), 0.7, false);
      });
      var tank = [], tx = x + hw + 38 * k;
      for (j = 0; j <= 16; j++) tank.push([tx + Math.cos(Math.PI + j / 16 * Math.PI) * 30 * k, base - 34 * k + Math.sin(Math.PI + j / 16 * Math.PI) * 22 * k]);
      tank.push([tx + 30 * k, base]); tank.push([tx - 30 * k, base]);
      fillPoly(tank, dark, lite, { den: 30, len: 0.5, hatch: 1.5, grad: 'x' });
      fillPoly(hall, dark, lite, { den: 40, len: 0.7, hatch: 1.5 });
      for (j = 0; j < 11; j++) if (j % 4 !== 3) dab(x + 18 * k + j * 19 * k, base - hh * 0.5, 9 * k, 0, 9 * k, vary(C(win), 24), rr(0.75, 1), false);
      glow(x + hw * 0.45, base - hh * 0.5, 120 * k, win, 0.18);
    }

    /* ── Built things, for the industry cards ── */
    /* A straight, solid stroke: masts, struts, columns. */
    function seg(x0, y0, x1, y1, w, c, al) {
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineWidth = w;
      ctx.strokeStyle = css(C(c), al == null ? 1 : al);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    /* A cable hanging between two points. */
    function wire(x0, y0, x1, y1, drop, w, c, al) {
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineWidth = w;
      ctx.strokeStyle = css(C(c), al == null ? 1 : al);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + drop, x1, y1);
      ctx.stroke();
    }
    function block(x, y, w, h, dark, lite, o) {
      var pts = [[x, y + h], [x, y], [x + w, y], [x + w, y + h]];
      fillPoly(pts, dark, lite, o || { den: 40, len: 0.6, hatch: HALF, grad: 'x', fall: 1.2 });
      return pts;
    }
    /* A grid of windows: some lit, the rest dark glass. */
    function windows(x, y, w, h, cols, rows, pLit, win, glass) {
      var cw = w / cols, rh = h / rows, cI, rI, wx, wy;
      for (cI = 0; cI < cols; cI++) {
        for (rI = 0; rI < rows; rI++) {
          wx = x + (cI + 0.5) * cw; wy = y + (rI + 0.5) * rh;
          if (R() < pLit) dab(wx, wy, cw * 0.26, rr(-0.06, 0.06), rh * 0.4, vary(C(win), 26), rr(0.72, 1), false);
          else dab(wx, wy, cw * 0.26, rr(-0.04, 0.04), rh * 0.38, vary(C(glass), 8), rr(0.4, 0.7), true);
        }
      }
    }
    /* A lattice power pylon. Returns the tips of its arms, for the cables. */
    function pylon(x, base, h, c) {
      var top = base - h, w0 = h * 0.17, w1 = h * 0.035, lw = Math.max(1, h / 150), lv = [0, 0.16, 0.31, 0.44, 0.56, 0.66, 0.75, 0.83, 0.9, 0.96, 1], tips = [], k;
      function lp(t) { return [x - lerp(w0, w1, t), lerp(base, top, t)]; }
      function rp(t) { return [x + lerp(w0, w1, t), lerp(base, top, t)]; }
      seg(x - w0, base, x - w1, top, lw * 2, c);
      seg(x + w0, base, x + w1, top, lw * 2, c);
      for (k = 1; k < lv.length; k++) {
        var a = lp(lv[k - 1]), b = rp(lv[k - 1]), d = lp(lv[k]), e = rp(lv[k]);
        seg(a[0], a[1], e[0], e[1], lw, c);
        seg(b[0], b[1], d[0], d[1], lw, c);
        seg(d[0], d[1], e[0], e[1], lw, c);
      }
      [[0.66, 0.5], [0.83, 0.38]].forEach(function (q) {
        var y = lerp(base, top, q[0]), half = h * q[1] * 0.5, ul = lp(q[0] + 0.07), ur = rp(q[0] + 0.07);
        seg(x - half, y, x + half, y, lw * 1.6, c);
        seg(x - half, y, ul[0], ul[1], lw, c);
        seg(x + half, y, ur[0], ur[1], lw, c);
        seg(x - half, y, x - half, y + h * 0.035, lw * 1.4, c);
        seg(x + half, y, x + half, y + h * 0.035, lw * 1.4, c);
        tips.push([x - half, y + h * 0.035], [x + half, y + h * 0.035]);
      });
      seg(x - w1, top, x, top - h * 0.06, lw, c);
      seg(x + w1, top, x, top - h * 0.06, lw, c);
      return tips;
    }
    /* A columned hall, lit from inside. */
    function bank(cx, base, w, h, dark, lite, warm, rimc) {
      var x0 = cx - w / 2, sh = h * 0.035, floor = base - sh * 3, colTop = base - h * 0.62, beam = h * 0.085, n = 6, cw = w * 0.055, k;
      block(x0 + w * 0.05, colTop, w * 0.9, floor - colTop, mix(warm, '#2a1408', 0.55), mix(warm, '#ffffff', 0.25), { den: 30, len: 0.6, hatch: HALF, fall: 0.7 });
      glow(cx, floor - (floor - colTop) * 0.3, w * 0.55, warm, 0.55);
      block(cx - w * 0.05, floor - (floor - colTop) * 0.55, w * 0.1, (floor - colTop) * 0.55, '#fff0c8', '#fffaf0', { den: 10, len: 0.3, hatch: HALF, fall: 0.3 });
      for (k = 0; k < 3; k++) {
        var sw = w * (1.08 - k * 0.03);
        block(cx - sw / 2, base - sh * (k + 1), sw, sh, dark, lite, { den: 24, len: 0.6, hatch: 0.02, fall: 1.1 });
      }
      for (k = 0; k < n; k++) {
        var col = block(x0 + w * 0.05 + k * ((w * 0.9 - cw) / (n - 1)), colTop, cw, floor - colTop, dark, lite, { den: 14, len: 0.35, hatch: HALF, grad: 'x', fall: 1.4 });
        rim(col, [0], rimc, 0.7);
      }
      block(x0 - w * 0.02, colTop - beam, w * 1.04, beam, dark, lite, { den: 20, len: 0.6, hatch: 0.02, fall: 1.1 });
      var ped = [[x0 - w * 0.04, colTop - beam], [cx, colTop - beam - h * 0.24], [x0 + w * 1.04, colTop - beam]];
      fillPoly(ped, dark, lite, { den: 24, len: 0.6, hatch: 0.02, fall: 1.2 });
      rim(ped, [0, 1], rimc, 0.9);
    }
    /* An industrial robot arm with lit joints. Returns the joints and the tip. */
    function arm(bx, base, k, dark, steel, rimc, eye) {
      var sh = [bx, base - 62 * k], el = [bx + 62 * k, base - 178 * k], wr = [bx + 178 * k, base - 160 * k], tip = [bx + 200 * k, base - 112 * k];
      fillPoly(place([[-46, 0], [-38, -20], [38, -20], [46, 0]], bx, base, k), dark, steel, { den: 20, len: 0.5, hatch: 0.03, grad: 'x' });
      fillPoly(place([[-24, -18], [-20, -60], [20, -60], [24, -18]], bx, base, k), dark, steel, { den: 16, len: 0.4, hatch: HALF, grad: 'x' });
      function limb(a, b, w) {
        var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = Math.sin(ang), ny = -Math.cos(ang), t, q;
        seg(a[0], a[1], b[0], b[1], w, dark);
        for (q = 0; q < 46; q++) {
          t = R();
          dab(lerp(a[0], b[0], t) + nx * rr(-0.3, 0.3) * w, lerp(a[1], b[1], t) + ny * rr(-0.3, 0.3) * w, rr(8, 22) * u, ang + rr(-0.08, 0.08), rr(1.5, 3.5) * u, vary(mix(dark, steel, rr(0.15, 0.6)), 10), rr(0.3, 0.7), true);
        }
        for (q = 0; q < 34; q++) {
          t = R();
          dab(lerp(a[0], b[0], t) + nx * w * 0.4, lerp(a[1], b[1], t) + ny * w * 0.4, rr(6, 16) * u, ang + rr(-0.05, 0.05), rr(1, 2.2) * u, vary(C(rimc), 14), rr(0.35, 0.8), false);
        }
      }
      limb(sh, el, 30 * k);
      limb(el, wr, 22 * k);
      limb(wr, tip, 15 * k);
      var ga = Math.atan2(tip[1] - wr[1], tip[0] - wr[0]);
      [-0.55, 0.55].forEach(function (o) { seg(tip[0], tip[1], tip[0] + Math.cos(ga + o) * 24 * k, tip[1] + Math.sin(ga + o) * 24 * k, 5 * k, dark); });
      [sh, el, wr].forEach(function (q, n) {
        var r = [19, 15, 11][n] * k;
        ctx.fillStyle = css(C(dark), 1);
        ctx.beginPath();
        ctx.arc(q[0], q[1], r, 0, TAU);
        ctx.fill();
        glow(q[0], q[1], r * 2.4, eye, 0.75);
        light(function () {
          for (var j = 0; j < 40; j++) { var a = R() * TAU; dab(q[0] + Math.cos(a) * r * 0.55, q[1] + Math.sin(a) * r * 0.55, r * 0.5, a + HALF, 1.4 * u, vary(C(eye), 14), rr(0.4, 0.9), false); }
        });
      });
      return [sh, el, wr, tip];
    }
    /* A hospital with a lit cross on its face. Returns the cross. */
    function hospital(x, base, w, h, dark, lite, win, cross) {
      var glass = mix(dark, lite, 0.45), cx = x + w * 0.5, cy = base - h * 0.82, s = h * 0.08;
      block(x - w * 0.46, base - h * 0.4, w * 0.5, h * 0.4, dark, lite);
      windows(x - w * 0.42, base - h * 0.35, w * 0.4, h * 0.26, 6, 4, 0.3, win, glass);
      block(x, base - h, w, h, dark, lite);
      windows(x + w * 0.07, base - h * 0.64, w * 0.86, h * 0.5, 7, 8, 0.3, win, glass);
      rim([[x, base - h], [x + w, base - h]], [0], mix(lite, '#ffffff', 0.4), 0.8);
      block(x + w * 0.38, base - h * 0.1, w * 0.24, h * 0.1, mix(win, '#000000', 0.2), '#fff6e0', { den: 10, len: 0.3, hatch: HALF, fall: 0.4 });
      glow(x + w * 0.5, base - h * 0.04, w * 0.45, win, 0.35);
      glow(cx, cy, s * 6, cross, 0.5);
      ctx.fillStyle = css(mix(cross, '#ffffff', 0.35), 0.97);
      ctx.fillRect(cx - s * 0.34, cy - s, s * 0.68, s * 2);
      ctx.fillRect(cx - s, cy - s * 0.34, s * 2, s * 0.68);
      return [cx, cy, s];
    }
    /* A domed hall of government. Returns the dome's middle and the spire tip. */
    function capitol(cx, base, w, h, dark, lite, rimc, win) {
      var glass = mix(dark, lite, 0.4), wingH = h * 0.24, pw = w * 0.3, ph = h * 0.36, px = cx - pw / 2, pt = base - ph;
      var dw = w * 0.2, dt = pt - h * 0.2, rx = dw * 0.56, ry = h * 0.2, top = dt - ry, k, dome = [];
      block(cx - w / 2, base - wingH, w, wingH, dark, lite);
      windows(cx - w * 0.47, base - wingH * 0.84, w * 0.94, wingH * 0.6, 24, 2, 0.28, win, glass);
      block(cx - dw / 2, dt, dw, pt - dt + h * 0.04, dark, lite);
      for (k = 0; k < 9; k++) {
        var dx = cx - dw / 2 + dw * (0.06 + k * 0.88 / 8);
        seg(dx, dt + h * 0.02, dx, pt, Math.max(1.2, dw * 0.018), mix(lite, rimc, 0.3), 0.75);
      }
      for (k = 0; k <= 28; k++) { var a = Math.PI + k / 28 * Math.PI; dome.push([cx + Math.cos(a) * rx, dt + Math.sin(a) * ry]); }
      fillPoly(dome, dark, lite, { den: 20, len: 0.5, hatch: 0.6, grad: 'x', fall: 1.3 });
      rim(dome, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], rimc, 0.9);
      block(cx - dw * 0.07, top - h * 0.06, dw * 0.14, h * 0.065, dark, lite, { den: 10, len: 0.3, hatch: HALF });
      seg(cx, top - h * 0.06, cx, top - h * 0.13, Math.max(1.2, u * 1.4), dark);
      block(px, pt, pw, ph, dark, lite);
      for (k = 0; k < 8; k++) {
        var colx = px + pw * (0.08 + k * 0.84 / 7);
        seg(colx, pt + ph * 0.14, colx, base - h * 0.03, Math.max(1.4, pw * 0.022), mix(lite, rimc, 0.35), 0.8);
      }
      var ped = [[px - pw * 0.05, pt], [cx, pt - h * 0.09], [px + pw * 1.05, pt]];
      fillPoly(ped, dark, lite, { den: 20, len: 0.5, hatch: 0.02, fall: 1.1 });
      rim(ped, [0, 1], rimc, 0.9);
      return [cx, dt - ry * 0.4, top - h * 0.13];
    }

    /* Paper tooth, a soft vignette and fine grain to finish. */
    function finish() {
      var k;
      grained = true;
      for (k = 0; k < W * H / 240; k++) {
        ctx.fillStyle = R() < 0.6 ? css([6, 7, 12], rr(0.05, 0.2)) : css([255, 244, 230], rr(0.03, 0.1));
        ctx.fillRect(rr(0, W), rr(0, H), rr(0.6, 2.2) * u, rr(0.6, 2.2) * u);
      }
      var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.78);
      v.addColorStop(0, 'rgba(4,4,10,0)');
      v.addColorStop(1, 'rgba(4,4,10,0.4)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
      /* Grain comes from one small tile, repeated. Reading a whole canvas
         back to add noise pixel by pixel was the slowest step by far. */
      var tile = document.createElement('canvas'), tc, im, d;
      tile.width = tile.height = 128;
      tc = tile.getContext('2d');
      im = tc.createImageData(128, 128);
      d = im.data;
      for (k = 0; k < d.length; k += 4) {
        d[k] = d[k + 1] = d[k + 2] = R() < 0.5 ? 0 : 255;
        d[k + 3] = R() * 13;
      }
      tc.putImageData(im, 0, 0);
      ctx.fillStyle = ctx.createPattern(tile, 'repeat');
      ctx.fillRect(0, 0, W, H);
    }

    /* A light to keep alive once the picture is done (see FX below). */
    function fx() { effects.push([].slice.call(arguments)); }
    /* Everything painted after this call goes on a sheet of its own. Given a
       motion, the sheet moves (clouds drift, a beam sways, a corona turns; the
       art-* animations live in home.css). Given nothing, it is a still sheet
       laid over whatever moves beneath it.
       m = { kind, amt, dur, delay, lo, at: [x, y], box: [x0, y0, x1, y1], blend, res } */
    function layer(m) { cuts.push({ at: ctx.ops.length, m: m || null }); }
    function pct(v) { return (v * 100).toFixed(3) + '%'; }
    function sheet(stage, m) {
      var pad = m && m.kind !== 'still' && !m.box ? 0.04 : 0;
      var box = (m && m.box) || [-W * pad, -H * pad, W * (1 + pad), H * (1 + pad)];
      var bw = box[2] - box[0], bh = box[3] - box[1], k = RES * ((m && m.res) || 1), c = document.createElement('canvas'), g;
      c.width = Math.ceil(bw * k);
      c.height = Math.ceil(bh * k);
      c.setAttribute('aria-hidden', 'true');
      c.className = m && m.kind !== 'still' ? 'lay m-' + m.kind + (m.blend ? ' b-screen' : '') : 'top';
      c.style.cssText = 'left:' + pct(box[0] / W) + ';top:' + pct(box[1] / H) + ';width:' + pct(bw / W) + ';height:' + pct(bh / H) + ';right:auto;bottom:auto';
      if (m) {
        if (m.amt != null) c.style.setProperty('--amt', m.amt);
        if (m.dur) c.style.setProperty('--dur', m.dur + 's');
        if (m.delay) c.style.setProperty('--delay', m.delay + 's');
        if (m.lo != null) c.style.setProperty('--lo', m.lo);
        if (m.at) c.style.transformOrigin = pct((m.at[0] - box[0]) / bw) + ' ' + pct((m.at[1] - box[1]) / bh);
      }
      stage.appendChild(c);
      g = c.getContext('2d');
      g.scale(k, k);
      g.translate(-box[0], -box[1]);
      return g;
    }
    /* Lays the recorded strokes down: the first run on the canvas itself, each
       later run on its own sheet. The work is cut into short slices so the
       page stays smooth; the stage is shown only when the picture is whole. */
    function render(stage, done) {
      var ops = ctx.ops, plan = [], prev = 0, cur = null, target = real, moved = false, pi = 0, i = 0;
      cuts.push({ at: ops.length, m: null });
      cuts.forEach(function (c) {
        if (c.at > prev) {
          if (cur && !still) { target = sheet(stage, cur); moved = true; }
          else if (moved) { target = sheet(stage, null); moved = false; }
          plan.push([target, prev, c.at]);
        }
        prev = c.at;
        cur = c.m;
      });
      (function step() {
        var t0 = Date.now();
        while (pi < plan.length) {
          var g = plan[pi][0], end = plan[pi][2];
          if (i < plan[pi][1]) i = plan[pi][1];
          for (; i < end; i++) {
            var o = ops[i];
            if (typeof g[o[0]] === 'function') g[o[0]].apply(g, o[1]); else g[o[0]] = o[1];
            if ((i & 127) === 127 && Date.now() - t0 > 8) { i++; setTimeout(step, 0); return; }
          }
          pi++;
        }
        ops.length = 0;
        done();
      })();
    }

    return {
      render: render, layer: layer, fx: fx, effects: effects, finished: function () { return grained; },
      W: W, H: H, u: u, fbm: fbm, sky: sky, stars: stars, bands: bands, cloud: cloud, water: water, ridge: ridge, groundAt: groundAt,
      skyline: skyline, moon: moon, sun: sun, eclipse: eclipse, beam: beam, lighthouse: lighthouse, dome: dome, strike: strike,
      tower: tower, wall: wall, crack: crack, keyhole: keyhole, spill: spill, person: person, fox: fox, robot: robot, shield: shield, rings: rings, factory: factory, finish: finish,
      glow: glow, rim: rim, seg: seg, wire: wire, block: block, windows: windows, pylon: pylon, bank: bank, arm: arm, hospital: hospital, capitol: capitol
    };
  }

  /* ── The paintings ──────────────────────────────────────────────────────
     Each scene paints back to front. p.layer({...}) starts a sheet that moves;
     p.layer() goes back to a still one. A scene that ends with moving lights
     calls p.finish() itself, before them, so the paper grain stays beneath. */
  var SCENES = {
    /* Offense-proven: the wall, and the way in that was opened for us. */
    gate: function (p, W, H, u) {
      p.sky([[0, '#05081c'], [0.55, '#14204e'], [1, '#2d4f7a']], H * 0.36);
      p.stars(130, H * 0.3);
      p.wall(-20, W + 20, H * 0.31, H * 0.85, '#090c1d', '#222b52', '#8fa6d8');
      p.keyhole(W * 0.56, H * 0.47, 33 * u, '#ffe9b0', '#ff9a4a');
      p.layer({ kind: 'drift', amt: '2.4%', dur: 52, res: 0.7 });
      p.bands(H * 0.79, 22 * u, 54, '#8fa6d8', 0.34);
      p.layer();
      p.ridge(H * 0.85, H * 0.015, 2, 3.7, '#06080f', '#181f3c', { rim: '#c98f5a' });
      p.spill(W * 0.56, H * 0.855, 38 * u, H * 0.14, '#ffd89a');
      p.person(W * 0.46, H * 0.885, 1.5 * u, '#02030a', '#ffd89a');
      p.fx('twinkle', 26, H * 0.3, 11);
      p.fx('meteor', H * 0.27, 11, 3);
      p.fx('pulse', W * 0.56, H * 0.47 + 40 * u, 190 * u, [255, 176, 96], 1.6, 0.08, 0.26);
    },
    /* The model: a singularity rising over the range. */
    model: function (p, W, H, u) {
      var cx = W * 0.5, cy = H * 0.36, r = 74 * u, R = r * 4.4;
      p.sky([[0, '#05071a'], [0.42, '#16184a'], [0.7, '#4a2f78'], [0.88, '#c9736f'], [1, '#f7c796']], H * 0.76);
      p.stars(170, H * 0.52);
      p.eclipse(cx, cy, r, '#fff1d8', '#f2a37c', { kind: 'spin', dur: 280, at: [cx, cy], box: [cx - R, cy - R, cx + R, cy + R], blend: true, res: 0.8 });
      p.layer({ kind: 'drift', amt: '1.6%', dur: 58, res: 0.7 });
      p.bands(H * 0.66, 26 * u, 60, '#f0a98c', 0.55);
      p.bands(H * 0.58, 20 * u, 30, '#8a5a9a', 0.4);
      p.layer();
      p.ridge(H * 0.76, H * 0.2, 2.1, 3.1, '#1b1640', '#4e3b82', { rim: '#f5b48e' });
      p.ridge(H * 0.87, H * 0.14, 3.0, 9.4, '#0d0b22', '#2c2456', { rim: '#b77e92' });
      p.ridge(H * 1.0, H * 0.11, 4.2, 21.7, '#05050f', '#16122c');
      p.fx('twinkle', 40, H * 0.5, 12);
      p.fx('meteor', H * 0.3, 13, 5);
      p.fx('pulse', cx, cy, 310 * u, [242, 163, 124], 1.1, 0.06, 0.24);
    },
    /* AutoSecOps: the lighthouse that watches a sleeping city. */
    autosecops: function (p, W, H, u) {
      p.sky([[0, '#030d14'], [0.5, '#0a2c35'], [0.84, '#2b6b63'], [1, '#a8d8b6']], H * 0.7);
      p.stars(110, H * 0.42);
      var pal = { lit: '#3d7d76', shade: '#0d2c34', rim: '#c4ecd0', lx: 0.75, ly: -0.45 };
      p.layer({ kind: 'drift', amt: '1.8%', dur: 64 });
      p.cloud(W * 0.2, H * 0.42, W * 0.26, H * 0.24, pal, 18);
      p.cloud(W * 0.55, H * 0.3, W * 0.18, H * 0.15, pal, 12);
      p.layer();
      p.water(H * 0.7, H, [[0, '#8fcab0'], [0.22, '#1f5b5a'], [1, '#051820']], '#e9fff0', W * 0.3);
      p.skyline(W * 0.04, W * 0.6, H * 0.705, H * 0.03, H * 0.13, '#051318', '#ffd58c', 0.14);
      var g = p.ridge(H * 0.92, H * 0.32, 1, 0, '#03080b', '#113038', { rim: '#8fd3b6', shape: function (t) { return ease(clamp((t - 0.56) / 0.3, 0, 1)) * (0.8 + 0.2 * p.fbm(t * 6)); } });
      var lamp = p.lighthouse(W * 0.81, p.groundAt(g, W * 0.81) + 4 * u, H * 0.36, '#e6efe2', '#c5584a', '#0a1a1e');
      p.finish();
      p.layer({ kind: 'sway', amt: '2.4deg', dur: 7, at: lamp, blend: true, res: 0.6 });
      p.beam(lamp[0], lamp[1], Math.PI + 0.1, W * 0.8, 0.075, '#fff4c8');
      p.beam(lamp[0], lamp[1], -0.32, W * 0.32, 0.09, '#fff4c8');
      p.fx('twinkle', 26, H * 0.4, 13);
      p.fx('glint', W * 0.3, H * 0.73, H * 0.98, 90 * u, 30, 5, [233, 255, 240]);
      p.fx('pulse', lamp[0], lamp[1], 96 * u, [255, 244, 200], 2.6, 0.08, 0.6);
    },
    /* AIDR: a town under glass. What comes for it stops at the shield. */
    aidr: function (p, W, H) {
      p.sky([[0, '#0b0722'], [0.5, '#291c62'], [0.82, '#7b4b9e'], [1, '#f1aac2']], H * 0.78);
      p.stars(120, H * 0.5);
      var pal = { lit: '#8a62b8', shade: '#231650', rim: '#f6c3d6', lx: -0.7, ly: -0.4 }, r = W * 0.175, cx = W * 0.5, base = H * 0.81;
      var a = [cx + Math.cos(-2.4) * r, base + Math.sin(-2.4) * r], b = [cx + Math.cos(-0.62) * r, base + Math.sin(-0.62) * r];
      p.layer({ kind: 'drift', amt: '1.6%', dur: 70 });
      p.cloud(W * 0.84, H * 0.44, W * 0.22, H * 0.2, pal, 15);
      p.cloud(W * 0.12, H * 0.52, W * 0.18, H * 0.13, pal, 11);
      p.layer();
      p.ridge(H * 0.78, H * 0.09, 2, 4.2, '#190f38', '#4b2f7c', { rim: '#f1aac2' });
      p.skyline(W * 0.37, W * 0.63, base, H * 0.04, H * 0.19, '#0a061e', '#ffdca6', 0.4);
      p.ridge(H * 0.97, H * 0.1, 3, 12.5, '#06041a', '#1d1444');
      p.finish();
      p.layer({ kind: 'breathe', lo: 0.66, dur: 3.4, blend: true, res: 0.8 });
      p.dome(cx, base, r, '#8ff2c4', '#cbb7ff');
      p.layer({ kind: 'flash', dur: 6.4, blend: true, res: 0.7 });
      p.strike(W * 0.14, H * 0.1, a[0], a[1], '#ff6b5a');
      p.layer({ kind: 'flash', dur: 6.4, delay: -3.1, blend: true, res: 0.7 });
      p.strike(W * 0.9, H * 0.2, b[0], b[1], '#ff8a4a');
      p.fx('twinkle', 30, H * 0.5, 14);
      p.fx('pulse', cx, base - r * 0.4, r * 1.5, [143, 242, 196], 1.4, 0.04, 0.2);
    },
    /* IT Ops: three in the morning, one window still lit. */
    itops: function (p, W, H, u) {
      p.sky([[0, '#040714'], [0.55, '#0f1c44'], [0.9, '#25496a'], [1, '#3d7684']], H * 0.88);
      p.stars(150, H * 0.62);
      p.moon(W * 0.78, H * 0.2, 24 * u, '#f6eed8');
      p.layer({ kind: 'drift', amt: '2%', dur: 76 });
      p.cloud(W * 0.24, H * 0.36, W * 0.36, H * 0.16, { lit: '#35507f', shade: '#0b1533', rim: '#b6c6e6', lx: 0.8, ly: -0.4 }, 13);
      p.layer();
      p.skyline(0, W, H * 0.9, H * 0.08, H * 0.34, '#060a1b', '#ffd07c', 0.035);
      p.tower(W * 0.4, H * 0.99, W * 0.24, H * 0.7, '#070b1d', '#1b2a55', 5, 11, [[3, 4]], '#ffcf7a');
      p.ridge(H * 1.01, H * 0.05, 3, 6, '#02030a', '#0a1024');
      p.fx('twinkle', 40, H * 0.6, 15);
      p.fx('meteor', H * 0.3, 14, 8);
      p.fx('pulse', W * 0.568, H * 0.586, 74 * u, [255, 207, 122], 2, 0.12, 0.42);
      p.fx('pulse', W * 0.52, H * 0.206, 18 * u, [255, 90, 74], 3.2, 0, 0.9);
    },
    /* Breakpoint: the wall everyone trusted, and the light through it. */
    breakpoint: function (p, W, H) {
      p.sky([[0, '#12060c'], [0.48, '#481423'], [0.8, '#c0502f'], [1, '#ffc27a']], H * 0.68);
      var pal = { lit: '#c8573a', shade: '#3a1220', rim: '#ffd9a0', lx: 0.5, ly: 0.5 };
      p.layer({ kind: 'drift', amt: '1.8%', dur: 66 });
      p.cloud(W * 0.2, H * 0.34, W * 0.34, H * 0.2, pal, 14);
      p.cloud(W * 0.86, H * 0.26, W * 0.24, H * 0.14, pal, 10);
      p.layer();
      p.ridge(H * 0.68, H * 0.09, 2, 3.3, '#2c0f19', '#73302c', { rim: '#ffb574' });
      p.wall(W * 0.06, W * 0.94, H * 0.46, H * 0.93, '#14080f', '#4a1c22', '#ffb574');
      p.ridge(H * 1.0, H * 0.07, 3, 11, '#070308', '#1f0b12');
      p.finish();
      p.layer({ kind: 'breathe', lo: 0.6, dur: 2.3, blend: true });
      p.crack(W * 0.53, H * 0.43, H * 0.92, '#fff0c0', '#ff7a3a');
      p.fx('pulse', W * 0.53, H * 0.47, 150 * p.u, [255, 122, 58], 3.1, 0.06, 0.3);
    },
    /* Fennec: small, fast, hears everything. */
    fennec: function (p, W, H, u) {
      p.sky([[0, '#171231'], [0.42, '#553a76'], [0.76, '#de876b'], [1, '#fad89e']], H * 0.64);
      p.stars(60, H * 0.3);
      p.sun(W * 0.7, H * 0.6, 44 * u, '#fff0c4', '#ff9a58');
      p.layer({ kind: 'drift', amt: '2.2%', dur: 54, res: 0.7 });
      p.bands(H * 0.5, 18 * u, 34, '#f7b98d', 0.5);
      p.layer();
      p.ridge(H * 0.66, H * 0.07, 1.3, 2.2, '#7c4a54', '#dd9066', { rim: '#ffdba4', hatch: 0.12 });
      p.ridge(H * 0.8, H * 0.13, 1.0, 8.6, '#4c2c3e', '#ad6641', { rim: '#f5b477', hatch: 0.2 });
      var g = p.ridge(H * 0.97, H * 0.16, 0.8, 15.3, '#1b1124', '#5c3542', { rim: '#e99c68', hatch: 0.26 });
      p.fox(W * 0.32, p.groundAt(g, W * 0.32) + 3 * u, 1.05 * u, '#0f0a16', '#f3a672');
      p.fx('twinkle', 14, H * 0.3, 16);
      p.fx('pulse', W * 0.7, H * 0.6, 220 * u, [255, 154, 88], 0.9, 0.06, 0.22);
    },
    /* Sonar: the plant, and everything it is quietly saying. */
    sonar: function (p, W, H, u) {
      p.sky([[0, '#03101a'], [0.5, '#0a3442'], [0.84, '#3c988a'], [1, '#bbe8c4']], H * 0.76);
      p.stars(80, H * 0.4);
      p.rings(W * 0.46, H * 0.78, [70 * u, 125 * u, 185 * u, 250 * u, 320 * u], '#a6f7d2');
      p.ridge(H * 0.76, H * 0.07, 2, 5.5, '#0a2a33', '#2a6f6a', { rim: '#bbe8c4' });
      p.factory(W * 0.14, H * 0.86, u, '#04121a', '#12333c', '#ffd58c', { kind: 'rise', amt: '1.3%', dur: 9 });
      p.ridge(H * 1.0, H * 0.08, 3, 14, '#020a0f', '#0c2229');
      p.fx('twinkle', 22, H * 0.4, 17);
      p.fx('rings', W * 0.46, H * 0.78, 330 * u, [166, 247, 210], 3.4, 0.86);
    },
    /* RoboDR: the robot stays on its feet, inside its shield. */
    robodr: function (p, W, H, u) {
      p.sky([[0, '#060b1b'], [0.5, '#1d3256'], [0.84, '#86778c'], [1, '#f1c892']], H * 0.72);
      p.stars(110, H * 0.45);
      p.moon(W * 0.22, H * 0.22, 28 * u, '#f7ecd4');
      p.layer({ kind: 'drift', amt: '2%', dur: 72 });
      p.cloud(W * 0.76, H * 0.36, W * 0.3, H * 0.16, { lit: '#5b6e98', shade: '#182746', rim: '#f1d2a8', lx: -0.7, ly: -0.3 }, 12);
      p.layer();
      p.ridge(H * 0.72, H * 0.14, 2.2, 2.7, '#1b2748', '#4a5a86', { rim: '#f1c892' });
      var g = p.ridge(H * 0.93, H * 0.16, 1.1, 6.6, '#070b18', '#1c2a4a', { rim: '#d9a878' });
      var gx = W * 0.54, gy = p.groundAt(g, gx), sr = 104 * u;
      p.robot(gx, gy + 2 * u, 1.25 * u, '#04060e', '#8ff2c4');
      p.finish();
      p.layer({ kind: 'breathe', lo: 0.5, dur: 3, blend: true, box: [gx - sr * 1.5, gy - 34 * u - sr * 1.5, gx + sr * 1.5, gy - 34 * u + sr * 1.5] });
      p.shield(gx, gy - 34 * u, sr, '#8ff2c4');
      p.fx('twinkle', 30, H * 0.45, 18);
      p.fx('pulse', gx + 77 * u, gy - 72 * u, 30 * u, [143, 242, 196], 2.4, 0.15, 0.9);
    },
    /* Contact: first light over the range. */
    dawn: function (p, W, H) {
      p.sky([[0, '#0e1434'], [0.38, '#383c84'], [0.68, '#c47d90'], [0.88, '#f7ba8a'], [1, '#ffe4b4']], H * 0.72);
      p.stars(60, H * 0.28);
      var pal = { lit: '#f7cba8', shade: '#4b4a8e', rim: '#fff3da', lx: 0.7, ly: -0.45 };
      p.layer({ kind: 'drift', amt: '1.2%', dur: 84 });
      p.cloud(W * 0.7, H * 0.58, W * 0.44, H * 0.46, pal, 40);
      p.layer({ kind: 'drift', amt: '2.4%', dur: 62, delay: -20 });
      p.cloud(W * 0.2, H * 0.5, W * 0.3, H * 0.24, pal, 20);
      p.cloud(W * 0.97, H * 0.62, W * 0.2, H * 0.18, pal, 12);
      p.layer();
      p.ridge(H * 0.72, H * 0.17, 1.7, 2.4, '#2c2b5c', '#6c5c98', { rim: '#f7ba8a' });
      p.water(H * 0.75, H, [[0, '#eaa98c'], [0.3, '#5b4b88'], [1, '#0b0d22']], '#fff0d0', W * 0.62);
      p.ridge(H * 0.93, H * 0.12, 2.6, 11.2, '#090a1b', '#272b57', { rim: '#b98ba2' });
      p.fx('twinkle', 20, H * 0.28, 19);
      p.fx('glint', W * 0.62, H * 0.77, H * 0.92, 110 * p.u, 34, 9, [255, 240, 208]);
      p.fx('pulse', W * 0.62, H * 0.72, 280 * p.u, [255, 217, 160], 0.8, 0.03, 0.14);
    },

    /* ── Industries: one small picture per sector ── */
    /* Factories and energy: the plant, and the line that feeds it. */
    'ind-ot': function (p, W, H, u) {
      p.sky([[0, '#06121c'], [0.45, '#123b48'], [0.8, '#4f8a7c'], [1, '#f2c48a']], H * 0.72);
      p.stars(50, H * 0.34);
      p.bands(H * 0.6, 14 * u, 24, '#f5c890', 0.4);
      p.ridge(H * 0.72, H * 0.06, 2, 4.1, '#123039', '#3f7570', { rim: '#f2c48a' });
      var far = p.pylon(W * 0.68, H * 0.73, H * 0.28, '#0f2c35');
      far.forEach(function (q) { p.wire(q[0], q[1], -20, q[1] + H * 0.05, H * 0.03, 0.9 * u, '#0f2c35', 0.8); });
      var k = 0.92 * u, x0 = W * 0.04, base = H * 0.8;
      p.factory(x0, base, k, '#04121a', '#163b44', '#ffd58c', { kind: 'rise', amt: '1.3%', dur: 8 });
      p.ridge(H * 0.84, H * 0.035, 3, 7.3, '#030c12', '#0f2a31');
      var px = W * 0.86, pb = H * 0.88, ph = H * 0.7, near = p.pylon(px, pb, ph, '#03090f');
      near.forEach(function (q, j) {
        p.wire(q[0], q[1], far[j][0], far[j][1], H * 0.04, 1.1 * u, '#03090f', 0.9);
        p.wire(q[0], q[1], W + 30, q[1] + H * 0.03, H * 0.02, 1.1 * u, '#03090f', 0.9);
      });
      p.fx('twinkle', 16, H * 0.34, 21);
      p.fx('pulse', x0 + 230 * k * 0.45, base - 32 * k, 120 * k, [255, 213, 140], 1.3, 0.05, 0.22);
      p.fx('pulse', px, pb - ph * 1.06, 9 * u, [255, 90, 74], 2.8, 0, 0.9);
    },
    /* Banks and finance: the hall, lit late. */
    'ind-finance': function (p, W, H, u) {
      p.sky([[0, '#0a0b22'], [0.5, '#1f2458'], [0.84, '#5a4a86'], [1, '#c58e8a']], H * 0.8);
      p.stars(80, H * 0.45);
      p.layer({ kind: 'drift', amt: '2.2%', dur: 50, res: 0.7 });
      p.bands(H * 0.5, 20 * u, 26, '#8f7fc0', 0.38);
      p.layer();
      p.skyline(-10, W + 10, H * 0.8, H * 0.08, H * 0.38, '#0d0e2a', '#ffd58c', 0.07);
      var cx = W * 0.5, base = H * 0.86, h = H * 0.64;
      p.bank(cx, base, W * 0.5, h, '#0b0a1c', '#3a3566', '#ffc98a', '#f3d2a6');
      p.ridge(H * 1.02, H * 0.05, 3, 8, '#05050f', '#16122c');
      p.fx('twinkle', 24, H * 0.45, 22);
      p.fx('meteor', H * 0.22, 12, 2);
      p.fx('pulse', cx, base - h * 0.3, W * 0.3, [255, 201, 138], 1.1, 0.06, 0.24);
    },
    /* Robotics: the arm keeps working, inside its shield. */
    'ind-robotics': function (p, W, H, u) {
      p.sky([[0, '#060b1b'], [0.5, '#162a4c'], [0.85, '#4c5e88'], [1, '#c9b2bc']], H * 0.78);
      p.stars(70, H * 0.42);
      p.ridge(H * 0.78, H * 0.06, 2, 5, '#111c36', '#36466e', { rim: '#d9c2c6' });
      p.ridge(H * 0.86, H * 0.008, 4, 2, '#070b16', '#1c2744');
      var bx = W * 0.36, base = H * 0.86, k = 1.12 * u, belt = base - 44 * k, sr = H * 0.66;
      p.block(W * 0.58, belt, W * 0.5, 9 * k, '#05070f', '#2a3658', { den: 12, len: 0.6, hatch: 0.02, fall: 1.1 });
      [0.62, 0.8, 0.96].forEach(function (f) { p.seg(W * f, belt + 9 * k, W * f, base, 3 * k, '#05070f'); });
      var j = p.arm(bx, base, k, '#04060e', '#3e4f78', '#cfe0ff', '#8ff2c4');
      [[j[3][0], 40], [W * 0.86, 34]].forEach(function (c) {
        p.block(c[0] - c[1] * 0.5 * k, belt - c[1] * 0.9 * k, c[1] * k, c[1] * 0.9 * k, '#2c1a10', '#c08a52', { den: 12, len: 0.4, hatch: HALF, grad: 'x', fall: 1.3 });
      });
      p.finish();
      p.layer({ kind: 'breathe', lo: 0.5, dur: 3.2, blend: true });
      p.shield(W * 0.5, base, sr, '#8ff2c4');
      p.fx('twinkle', 20, H * 0.42, 23);
      j.slice(0, 3).forEach(function (q, n) { p.fx('pulse', q[0], q[1], [44, 36, 28][n] * k, [143, 242, 196], 2 + n * 0.7, 0.1, 0.7); });
    },
    /* Hospitals: the lights stay on. */
    'ind-health': function (p, W, H, u) {
      p.sky([[0, '#04101a'], [0.5, '#0d2c3c'], [0.85, '#2f6a74'], [1, '#9fd2c2']], H * 0.8);
      p.stars(90, H * 0.45);
      p.moon(W * 0.14, H * 0.2, 15 * u, '#f3f0dc');
      p.layer({ kind: 'drift', amt: '2.2%', dur: 56, res: 0.7 });
      p.bands(H * 0.56, 22 * u, 30, '#5c9a98', 0.4);
      p.layer();
      p.skyline(-10, W + 10, H * 0.82, H * 0.05, H * 0.22, '#061722', '#ffd58c', 0.06);
      var c = p.hospital(W * 0.42, H * 0.86, W * 0.3, H * 0.66, '#06121c', '#1f4a58', '#ffe1a6', '#8ff2c4');
      p.ridge(H * 1.02, H * 0.05, 3, 9, '#020a0f', '#0c2229');
      p.fx('twinkle', 24, H * 0.45, 24);
      p.fx('pulse', c[0], c[1], c[2] * 7, [143, 242, 196], 1.6, 0.08, 0.42);
    },
    /* Defense and government: the dome at first light. */
    'ind-gov': function (p, W, H, u) {
      p.sky([[0, '#0d0a2a'], [0.42, '#2d2468'], [0.75, '#8a5a96'], [0.92, '#f0a28e'], [1, '#ffd2a0']], H * 0.8);
      p.stars(70, H * 0.4);
      p.layer({ kind: 'drift', amt: '2.2%', dur: 60, res: 0.7 });
      p.bands(H * 0.66, 14 * u, 24, '#f6b494', 0.45);
      p.layer();
      var t = p.capitol(W * 0.5, H * 0.86, W * 0.8, H * 0.74, '#0d0a20', '#3a2e66', '#ffcf9e', '#ffd58c');
      p.ridge(H * 1.02, H * 0.05, 3, 6, '#05040f', '#1a1236');
      p.fx('twinkle', 20, H * 0.4, 25);
      p.fx('pulse', t[0], t[1], W * 0.2, [255, 207, 158], 0.9, 0.05, 0.2);
      p.fx('pulse', t[0], t[2], 8 * u, [255, 240, 210], 2.2, 0.1, 0.9);
    },
    /* Enterprise IT: the whole company, still at work. */
    'ind-it': function (p, W, H, u) {
      p.sky([[0, '#050818'], [0.55, '#111d48'], [0.88, '#2c3f78'], [1, '#6a6aa8']], H * 0.74);
      p.stars(90, H * 0.42);
      p.skyline(-10, W + 10, H * 0.74, H * 0.1, H * 0.3, '#0c1334', '#bcc8ff', 0.08);
      p.skyline(-10, W + 10, H * 0.81, H * 0.1, H * 0.4, '#070b20', '#ffd58c', 0.24);
      var tx = W * 0.43, tw = W * 0.13, tb = H * 0.82, th = H * 0.68, mast = tb - th - H * 0.08;
      p.rim(p.block(tx, tb - th, tw, th, '#060a1d', '#22336a'), [0, 1], '#9fb2ff', 0.8);
      p.windows(tx + tw * 0.08, tb - th * 0.93, tw * 0.84, th * 0.88, 5, 16, 0.42, '#ffd58c', '#141f44');
      p.seg(tx + tw * 0.5, tb - th, tx + tw * 0.5, mast, 1.6 * u, '#060a1d');
      p.glow(tx + tw * 0.5, mast, 10 * u, '#ff5a4a', 0.95);
      p.water(H * 0.81, H, [[0, '#33427a'], [0.3, '#121c42'], [1, '#03050f']], '#ffd58c', tx + tw * 0.5);
      p.fx('twinkle', 26, H * 0.4, 26);
      p.fx('glint', tx + tw * 0.5, H * 0.83, H * 0.98, 60 * u, 22, 4, [255, 213, 140]);
      p.fx('pulse', tx + tw * 0.5, mast, 16 * u, [255, 90, 74], 3, 0, 0.9);
    },

    /* ── Footer: everything we defend, under one sky ──
       Left to right: the lighthouse (AutoSecOps), the town under glass (AIDR),
       the lit window (IT Ops), the breached wall (Breakpoint) beneath the
       singularity, the fox (Fennec), the plant (Sonar), the robot (RoboDR). */
    world: function (p, W, H, u) {
      var cx = W * 0.5, cy = H * 0.3, r = 44 * u, R = r * 4.4;
      p.sky([[0, '#04061a'], [0.4, '#131a4c'], [0.7, '#4a2f78'], [0.9, '#c9736f'], [1, '#f7c796']], H * 0.82);
      p.stars(560, H * 0.58);
      p.eclipse(cx, cy, r, '#fff1d8', '#f2a37c', { kind: 'spin', dur: 300, at: [cx, cy], box: [cx - R, cy - R, cx + R, cy + R], blend: true, res: 0.8 });
      var pal = { lit: '#7b5a9c', shade: '#1c1846', rim: '#f5b48e', lx: 0.1, ly: 0.7 };
      p.layer({ kind: 'drift', amt: '0.9%', dur: 96, res: 0.7 });
      p.bands(H * 0.62, 30 * u, 170, '#f0a98c', 0.5);
      p.cloud(W * 0.145, H * 0.36, W * 0.1, H * 0.2, pal, 13);
      p.cloud(W * 0.3, H * 0.27, W * 0.07, H * 0.13, pal, 9);
      p.cloud(W * 0.7, H * 0.3, W * 0.09, H * 0.17, pal, 11);
      p.cloud(W * 0.865, H * 0.4, W * 0.08, H * 0.14, pal, 9);
      p.layer();
      p.ridge(H * 0.8, H * 0.17, 5.5, 3.1, '#1b1640', '#4e3b82', { rim: '#f5b48e' });
      var g = p.ridge(H * 0.86, H * 0.05, 6, 6.6, '#0b0a20', '#2b2456', { rim: '#b77e92' });
      function gy(x) { return p.groundAt(g, x); }
      /* AIDR: the town */
      var dx = W * 0.215, db = gy(dx) + 2 * u, dr = H * 0.205;
      p.skyline(dx - dr * 0.72, dx + dr * 0.72, db, H * 0.05, H * 0.2, '#090620', '#ffdca6', 0.42);
      /* IT Ops: the tower and its one window */
      var tx = W * 0.352, tw = W * 0.028, tb = gy(tx) + 4 * u, th = H * 0.5;
      p.skyline(tx - W * 0.04, tx + tw + W * 0.04, tb, H * 0.05, H * 0.16, '#080a22', '#ffd07c', 0.06);
      p.tower(tx, tb, tw, th, '#070b1d', '#1e2c5a', 4, 11, [[2, 4]], '#ffcf7a');
      /* Breakpoint: the wall */
      var wx = cx, wb = gy(wx) + 6 * u, wt = wb - H * 0.2;
      p.wall(wx - W * 0.046, wx + W * 0.046, wt, wb, '#120a16', '#40243a', '#ffb574');
      /* Fennec */
      var fx0 = W * 0.64;
      p.fox(fx0, gy(fx0) + 3 * u, 0.62 * u, '#0c0814', '#f3a672');
      /* Sonar: the plant */
      var sx = W * 0.735, sb = gy(sx + 110 * u) + 5 * u, sk = 0.62 * u;
      p.rings(sx + 150 * sk, sb, [70 * u, 120 * u, 172 * u], '#a6f7d2');
      p.factory(sx, sb, sk, '#06101c', '#1a3046', '#ffd58c');
      /* RoboDR */
      var rx = W * 0.925, rb = gy(rx) + 2 * u, rk = 0.86 * u, sr = 74 * u;
      p.robot(rx, rb, rk, '#04060e', '#8ff2c4');
      /* AutoSecOps: the lighthouse */
      var lx = W * 0.072, lamp = p.lighthouse(lx, gy(lx) + 5 * u, H * 0.4, '#e6efe2', '#c5584a', '#0a1022');
      p.ridge(H * 1.03, H * 0.1, 7, 21.7, '#04040d', '#14112a');
      p.finish();
      p.layer({ kind: 'sway', amt: '3deg', dur: 8, at: lamp, blend: true, res: 0.6, box: [lamp[0] - W * 0.09, lamp[1] - H * 0.36, lamp[0] + W * 0.17, lamp[1] + H * 0.36] });
      p.beam(lamp[0], lamp[1], -0.14, W * 0.14, 0.08, '#fff4c8');
      p.beam(lamp[0], lamp[1], Math.PI + 0.2, W * 0.06, 0.1, '#fff4c8');
      p.layer({ kind: 'breathe', lo: 0.62, dur: 3.4, blend: true, res: 0.8, box: [dx - dr * 1.6, db - dr * 1.8, dx + dr * 1.6, db + dr * 0.4] });
      p.dome(dx, db, dr, '#8ff2c4', '#cbb7ff');
      p.layer({ kind: 'flash', dur: 7, blend: true, res: 0.8, box: [dx - dr * 2.4, db - dr * 2.6, dx, db - dr * 0.3] });
      p.strike(dx - dr * 2.1, db - dr * 2.3, dx + Math.cos(-2.3) * dr, db + Math.sin(-2.3) * dr, '#ff6b5a');
      p.layer({ kind: 'breathe', lo: 0.55, dur: 2.4, blend: true, box: [wx - 200 * u, wt - 200 * u, wx + 200 * u, wb + 30 * u] });
      p.crack(wx + 4 * u, wt - 6 * u, wb - 4 * u, '#fff0c0', '#ff7a3a');
      p.layer({ kind: 'breathe', lo: 0.5, dur: 3, blend: true, box: [rx - sr * 1.5, rb - 30 * u - sr * 1.5, rx + sr * 1.5, rb - 30 * u + sr * 1.5] });
      p.shield(rx, rb - 30 * u, sr, '#8ff2c4');
      p.fx('twinkle', 90, H * 0.55, 31);
      p.fx('meteor', H * 0.3, 9, 6);
      p.fx('pulse', cx, cy, 190 * u, [242, 163, 124], 1.1, 0.05, 0.22);
      p.fx('pulse', lamp[0], lamp[1], 60 * u, [255, 244, 200], 2.6, 0.08, 0.6);
      p.fx('pulse', tx + tw * 0.625, tb - th + (4.9 / 11.6) * th, 46 * u, [255, 207, 122], 2, 0.1, 0.42);
      p.fx('pulse', tx + tw * 0.5, tb - th * 1.12, 12 * u, [255, 90, 74], 3.2, 0, 0.9);
      p.fx('rings', sx + 150 * sk, sb, 185 * u, [166, 247, 210], 3.6, 0.86);
      p.fx('pulse', rx + 53 * u, rb - 51 * u, 22 * u, [143, 242, 196], 2.4, 0.15, 0.9);
    }
  };
  var SEEDS = { gate: 909, model: 88, autosecops: 101, aidr: 202, itops: 303, breakpoint: 404, fennec: 505, sonar: 606, robodr: 707, dawn: 808, 'ind-ot': 1101, 'ind-finance': 1202, 'ind-robotics': 1303, 'ind-health': 1404, 'ind-gov': 1505, 'ind-it': 1606, world: 2026 };

  /* ── Lights that stay alive on the finished picture ───────────────────── */
  function rgba(c, al) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, al).toFixed(3) + ')'; }
  /* A small repeatable random list, so a light show is the same on every visit. */
  function seeded(seed, n, each) {
    var s = seed * 9973 + 7, out = [], k;
    function next() { s = (s * 16807 + 11) % 2147483647; return s / 2147483647; }
    for (k = 0; k < n; k++) out.push(each(next));
    return out;
  }
  var FX = {
    /* ['pulse', x, y, radius, [r,g,b], speed, min, max]: a glow that breathes. */
    pulse: function (g, t, e) {
      var al = e[6] + (e[7] - e[6]) * (0.5 + 0.5 * Math.sin(t * e[5] + e[1] * 0.01)), gr = g.createRadialGradient(e[1], e[2], 0, e[1], e[2], e[3]);
      gr.addColorStop(0, rgba(e[4], al));
      gr.addColorStop(1, rgba(e[4], 0));
      g.fillStyle = gr;
      g.fillRect(e[1] - e[3], e[2] - e[3], e[3] * 2, e[3] * 2);
    },
    /* ['twinkle', count, skyBottom, seed]: stars that brighten and fade. */
    twinkle: function (g, t, e, W, u) {
      if (!e.pts) e.pts = seeded(e[3], e[1], function (r) { var x = r(), y = r(); return [x * W, Math.pow(y, 1.5) * e[2], x * 40, 0.7 + y * 1.8]; });
      e.pts.forEach(function (q) {
        var al = Math.pow(0.5 + 0.5 * Math.sin(t * q[3] + q[2]), 4);
        g.fillStyle = rgba([255, 244, 222], al * 0.9);
        g.beginPath();
        g.arc(q[0], q[1], (0.9 + al) * u, 0, TAU);
        g.fill();
      });
    },
    /* ['rings', x, y, maxRadius, [r,g,b], period, squash]: arcs that spread and fade. */
    rings: function (g, t, e, W, u) {
      g.lineWidth = 2 * u;
      for (var k = 0; k < 3; k++) {
        var ph = (t / e[5] + k / 3) % 1;
        g.strokeStyle = rgba(e[4], (1 - ph) * 0.55);
        g.beginPath();
        g.ellipse(e[1], e[2], e[3] * ph, e[3] * ph * e[6], 0, Math.PI, TAU);
        g.stroke();
      }
    },
    /* ['meteor', skyBottom, period, seed]: now and then, a shooting star. */
    meteor: function (g, t, e, W, u) {
      var n = Math.floor(t / e[2]), ph = (t / e[2]) % 1, span = 1.1 / e[2];
      if (ph > span) return;
      var a = Math.sin((n + e[3]) * 12.9898) * 43758.5453, b = Math.sin((n + e[3]) * 78.233) * 12543.123;
      var r1 = a - Math.floor(a), r2 = b - Math.floor(b), k = ph / span, dir = r2 < 0.5 ? 1 : -1, len = 170 * u, f = Math.min(1, k * 3);
      var x = W * (0.2 + r1 * 0.6) + dir * k * len * 1.6, y = e[1] * (0.08 + r2 * 0.45) + k * len * 0.62;
      var tx = x - dir * len * 0.5 * f, ty = y - len * 0.194 * f, gr = g.createLinearGradient(tx, ty, x, y);
      gr.addColorStop(0, 'rgba(255,244,222,0)');
      gr.addColorStop(1, rgba([255, 244, 222], Math.sin(k * Math.PI) * 0.95));
      g.strokeStyle = gr;
      g.lineWidth = 1.7 * u;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(tx, ty);
      g.lineTo(x, y);
      g.stroke();
    },
    /* ['glint', x, y0, y1, spread, count, seed, [r,g,b]]: light breaking on water. */
    glint: function (g, t, e, W, u) {
      if (!e.pts) e.pts = seeded(e[6], e[5], function (r) { return [Math.pow(r(), 0.8), r() * 2 - 1, r() * 40, 0.9 + r() * 2.2, 5 + r() * 16]; });
      g.lineCap = 'round';
      e.pts.forEach(function (q) {
        var al = Math.pow(0.5 + 0.5 * Math.sin(t * q[3] + q[2]), 3), y = e[2] + (e[3] - e[2]) * q[0], x = e[1] + q[1] * (12 * u + q[0] * e[4]), half = q[4] * u * (0.5 + q[0]);
        g.strokeStyle = rgba(e[7], al * 0.75 * (1 - q[0] * 0.45));
        g.lineWidth = (1 + q[0] * 1.6) * u;
        g.beginPath();
        g.moveTo(x - half, y);
        g.lineTo(x + half, y);
        g.stroke();
      });
    }
  };

  /* The stage holds a picture and its sheets at the picture's own shape, and
     covers its frame the way object-fit: cover would, so every sheet lines up. */
  function fit(box) {
    var st = box.__stage, bw = box.clientWidth, bh = box.clientHeight;
    if (!st || !bw || !bh) return;
    var k = Math.max(bw / st.__w, bh / st.__h), w = st.__w * k, h = st.__h * k;
    st.style.width = w.toFixed(2) + 'px';
    st.style.height = h.toFixed(2) + 'px';
    st.style.left = ((bw - w) / 2).toFixed(2) + 'px';
    st.style.top = ((bh - h) / 2).toFixed(2) + 'px';
  }
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target); }); }) : null;
  if (!ro) window.addEventListener('resize', function () { list.forEach(function (cv) { if (cv.__box) fit(cv.__box); }); });

  /* While a picture is on screen its sheets move (CSS) and its lights play
     (a half-size canvas, drawn about thirty times a second). Off screen, both rest. */
  function life(box, stage, effects, W, H, u) {
    var fxc = null, g = null, raf = 0, last = 0, seen = false;
    if (effects.length) {
      fxc = document.createElement('canvas');
      fxc.width = Math.ceil(W * RES / 2);
      fxc.height = Math.ceil(H * RES / 2);
      fxc.className = 'fx';
      fxc.setAttribute('aria-hidden', 'true');
      stage.appendChild(fxc);
      g = fxc.getContext('2d');
      g.scale(RES / 2, RES / 2);
    }
    function draw(now) {
      raf = 0;
      if (!seen) return;
      if (now - last > 33) {
        last = now;
        g.clearRect(0, 0, W, H);
        for (var k = 0; k < effects.length; k++) FX[effects[k][0]](g, now / 1000, effects[k], W, u);
      }
      raf = requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (entries) {
      seen = entries[entries.length - 1].isIntersecting;
      if (seen) box.classList.add('live'); else box.classList.remove('live');
      if (seen && g && !raf) raf = requestAnimationFrame(draw);
    }, { threshold: 0.02 }).observe(box);
  }

  function paint(cv, done) {
    if (cv.__painted) { done(); return; }
    cv.__painted = true;
    var name = cv.getAttribute('data-art'), scene = SCENES[name], box = cv.parentNode;
    if (!scene || !box) { done(); return; }
    try {
      var p = painter(cv, SEEDS[name] || 7), stage = document.createElement('div');
      scene(p, p.W, p.H, p.u);
      if (!p.finished()) { p.layer(); p.finish(); }
      stage.className = 'stage' + (p.W >= 1000 && name !== 'world' ? ' kb' : '');
      stage.__w = p.W;
      stage.__h = p.H;
      box.insertBefore(stage, cv);
      stage.appendChild(cv);
      box.__stage = stage;
      cv.__box = box;
      fit(box);
      if (ro) ro.observe(box);
      p.render(stage, function () {
        if (!still) life(box, stage, p.effects, p.W, p.H, p.u);
        /* The picture arrives whole: a short fade, never a build-up. */
        requestAnimationFrame(function () { stage.classList.add('on'); });
        setTimeout(function () { stage.classList.add('on'); }, 300);
        done();
      });
    } catch (err) {
      if (window.console) console.error('art: ' + name, err);
      done();
    }
  }

  /* One picture is prepared at a time. Those near the screen go first; the
     rest are prepared in quiet moments, so they are ready before they are seen. */
  var queue = [], busy = false;
  function pump() {
    if (busy) return;
    var cv = queue.shift();
    if (!cv) return;
    busy = true;
    paint(cv, function () { setTimeout(function () { busy = false; pump(); }, 30); });
  }
  function enqueue(cv, first) {
    if (cv.__queued) return;
    cv.__queued = true;
    if (first) queue.unshift(cv); else queue.push(cv);
    pump();
  }
  function sweep() {
    var vh = window.innerHeight || 800;
    list.forEach(function (cv) {
      if (cv.__queued) return;
      var r = cv.getBoundingClientRect();
      if (r.width && r.top < vh * 1.8 && r.bottom > -vh * 0.8) enqueue(cv, true);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        enqueue(e.target, true);
      });
    }, { rootMargin: '800px 0px' });
    list.forEach(function (cv) { io.observe(cv); });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    setTimeout(function () { ticking = false; sweep(); }, 160);
  }, { passive: true });
  window.addEventListener('resize', sweep);
  setTimeout(sweep, 400);
  function rest() {
    for (var k = 0; k < list.length; k++) if (!list[k].__queued) { enqueue(list[k]); break; }
    if (k < list.length) later(rest);
  }
  function later(f) { if (window.requestIdleCallback) window.requestIdleCallback(f, { timeout: 3000 }); else setTimeout(f, 700); }
  setTimeout(function () { later(rest); }, 1500);
})();
