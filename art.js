/* Generative paintings for the homepage.
 *
 * Every <canvas data-art="name"> is painted once, in the browser, from a fixed
 * seed: a few thousand short pastel strokes laid down the way a painter would,
 * sky first, then clouds, then land, then the one object that tells the
 * product's story. There are no image files to download, and a canvas is only
 * painted when it is about to scroll into view. */
(function () {
  'use strict';
  var list = [].slice.call(document.querySelectorAll('canvas[data-art]'));
  if (!list.length) return;

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

  /* ── The painter: one canvas, one seeded hand ─────────────────────────── */
  function painter(cv, seed) {
    var ctx = cv.getContext('2d'), W = cv.width, H = cv.height, u = Math.min(W, H) / 460, s = seed >>> 0;
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
    function eclipse(cx, cy, r, core, corona) {
      core = C(core); corona = C(corona);
      var k, a, d;
      glow(cx, cy, r * 5.2, corona, 0.5);
      glow(cx, cy, r * 2.2, core, 0.55);
      light(function () {
        for (k = 0; k < 900; k++) {
          a = R() * TAU;
          var far = Math.pow(R(), 2.1);
          d = r * (1.03 + far * 2.7);
          dab(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * rr(0.25, 0.95) * (1.25 - far * 0.6), a + rr(-0.1, 0.1), rr(1.4, 4) * u, vary(mix(core, corona, clamp(far * 1.4, 0, 1)), 18), rr(0.1, 0.42) * (1 - far * 0.8), true);
        }
      });
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
    function factory(x, base, k, dark, lite, win) {
      var hw = 230 * k, hh = 64 * k, teeth = 4, tw = hw / teeth, hall = [[x, base], [x, base - hh]], j;
      for (j = 0; j < teeth; j++) { hall.push([x + j * tw + tw * 0.72, base - hh - 26 * k]); hall.push([x + (j + 1) * tw, base - hh]); }
      hall.push([x + hw, base]);
      [[hw + 96, 196], [hw + 134, 150]].forEach(function (q) {
        var cx = x + q[0] * k, ch = q[1] * k;
        cloud(cx + 40 * k, base - ch - 14 * k, 96 * k, 46 * k, { lit: '#6fb7a8', shade: '#143b44', rim: '#d6f5e0', lx: -0.6, ly: -0.5 }, 7);
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

    /* Paper tooth, a soft vignette and fine grain to finish. */
    function finish() {
      var k;
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

    return {
      W: W, H: H, u: u, fbm: fbm, sky: sky, stars: stars, bands: bands, cloud: cloud, water: water, ridge: ridge, groundAt: groundAt,
      skyline: skyline, moon: moon, sun: sun, eclipse: eclipse, beam: beam, lighthouse: lighthouse, dome: dome, strike: strike,
      tower: tower, wall: wall, crack: crack, fox: fox, robot: robot, shield: shield, rings: rings, factory: factory, finish: finish
    };
  }

  /* ── The paintings ────────────────────────────────────────────────────── */
  var SCENES = {
    /* The model: a singularity rising over the range. */
    model: function (p, W, H, u) {
      p.sky([[0, '#05071a'], [0.42, '#16184a'], [0.7, '#4a2f78'], [0.88, '#c9736f'], [1, '#f7c796']], H * 0.76);
      p.stars(170, H * 0.52);
      p.eclipse(W * 0.5, H * 0.36, 74 * u, '#fff1d8', '#f2a37c');
      p.bands(H * 0.66, 26 * u, 60, '#f0a98c', 0.55);
      p.bands(H * 0.58, 20 * u, 30, '#8a5a9a', 0.4);
      p.ridge(H * 0.76, H * 0.2, 2.1, 3.1, '#1b1640', '#4e3b82', { rim: '#f5b48e' });
      p.ridge(H * 0.87, H * 0.14, 3.0, 9.4, '#0d0b22', '#2c2456', { rim: '#b77e92' });
      p.ridge(H * 1.0, H * 0.11, 4.2, 21.7, '#05050f', '#16122c');
    },
    /* AutoSecOps: the lighthouse that watches a sleeping city. */
    autosecops: function (p, W, H, u) {
      p.sky([[0, '#030d14'], [0.5, '#0a2c35'], [0.84, '#2b6b63'], [1, '#a8d8b6']], H * 0.7);
      p.stars(110, H * 0.42);
      var pal = { lit: '#3d7d76', shade: '#0d2c34', rim: '#c4ecd0', lx: 0.75, ly: -0.45 };
      p.cloud(W * 0.2, H * 0.42, W * 0.26, H * 0.24, pal, 18);
      p.cloud(W * 0.55, H * 0.3, W * 0.18, H * 0.15, pal, 12);
      p.water(H * 0.7, H, [[0, '#8fcab0'], [0.22, '#1f5b5a'], [1, '#051820']], '#e9fff0', W * 0.3);
      p.skyline(W * 0.04, W * 0.6, H * 0.705, H * 0.03, H * 0.13, '#051318', '#ffd58c', 0.14);
      var g = p.ridge(H * 0.92, H * 0.32, 1, 0, '#03080b', '#113038', { rim: '#8fd3b6', shape: function (t) { return ease(clamp((t - 0.56) / 0.3, 0, 1)) * (0.8 + 0.2 * p.fbm(t * 6)); } });
      var lamp = p.lighthouse(W * 0.81, p.groundAt(g, W * 0.81) + 4 * u, H * 0.36, '#e6efe2', '#c5584a', '#0a1a1e');
      p.beam(lamp[0], lamp[1], Math.PI + 0.1, W * 0.8, 0.075, '#fff4c8');
      p.beam(lamp[0], lamp[1], -0.32, W * 0.32, 0.09, '#fff4c8');
    },
    /* AIDR: a town under glass. What comes for it stops at the shield. */
    aidr: function (p, W, H) {
      p.sky([[0, '#0b0722'], [0.5, '#291c62'], [0.82, '#7b4b9e'], [1, '#f1aac2']], H * 0.78);
      p.stars(120, H * 0.5);
      var pal = { lit: '#8a62b8', shade: '#231650', rim: '#f6c3d6', lx: -0.7, ly: -0.4 }, r = W * 0.175, cx = W * 0.5, base = H * 0.81;
      p.cloud(W * 0.84, H * 0.44, W * 0.22, H * 0.2, pal, 15);
      p.cloud(W * 0.12, H * 0.52, W * 0.18, H * 0.13, pal, 11);
      p.ridge(H * 0.78, H * 0.09, 2, 4.2, '#190f38', '#4b2f7c', { rim: '#f1aac2' });
      p.skyline(W * 0.37, W * 0.63, base, H * 0.04, H * 0.19, '#0a061e', '#ffdca6', 0.4);
      p.dome(cx, base, r, '#8ff2c4', '#cbb7ff');
      p.strike(W * 0.14, H * 0.1, cx + Math.cos(-2.4) * r, base + Math.sin(-2.4) * r, '#ff6b5a');
      p.strike(W * 0.9, H * 0.2, cx + Math.cos(-0.62) * r, base + Math.sin(-0.62) * r, '#ff8a4a');
      p.ridge(H * 0.97, H * 0.1, 3, 12.5, '#06041a', '#1d1444');
    },
    /* IT Ops: three in the morning, one window still lit. */
    itops: function (p, W, H, u) {
      p.sky([[0, '#040714'], [0.55, '#0f1c44'], [0.9, '#25496a'], [1, '#3d7684']], H * 0.88);
      p.stars(150, H * 0.62);
      p.moon(W * 0.78, H * 0.2, 24 * u, '#f6eed8');
      p.cloud(W * 0.24, H * 0.36, W * 0.36, H * 0.16, { lit: '#35507f', shade: '#0b1533', rim: '#b6c6e6', lx: 0.8, ly: -0.4 }, 13);
      p.skyline(0, W, H * 0.9, H * 0.08, H * 0.34, '#060a1b', '#ffd07c', 0.035);
      p.tower(W * 0.4, H * 0.99, W * 0.24, H * 0.7, '#070b1d', '#1b2a55', 5, 11, [[3, 4]], '#ffcf7a');
      p.ridge(H * 1.01, H * 0.05, 3, 6, '#02030a', '#0a1024');
    },
    /* Breakpoint: the wall everyone trusted, and the light through it. */
    breakpoint: function (p, W, H) {
      p.sky([[0, '#12060c'], [0.48, '#481423'], [0.8, '#c0502f'], [1, '#ffc27a']], H * 0.68);
      var pal = { lit: '#c8573a', shade: '#3a1220', rim: '#ffd9a0', lx: 0.5, ly: 0.5 };
      p.cloud(W * 0.2, H * 0.34, W * 0.34, H * 0.2, pal, 14);
      p.cloud(W * 0.86, H * 0.26, W * 0.24, H * 0.14, pal, 10);
      p.ridge(H * 0.68, H * 0.09, 2, 3.3, '#2c0f19', '#73302c', { rim: '#ffb574' });
      p.wall(W * 0.06, W * 0.94, H * 0.46, H * 0.93, '#14080f', '#4a1c22', '#ffb574');
      p.crack(W * 0.53, H * 0.43, H * 0.92, '#fff0c0', '#ff7a3a');
      p.ridge(H * 1.0, H * 0.07, 3, 11, '#070308', '#1f0b12');
    },
    /* Fennec: small, fast, hears everything. */
    fennec: function (p, W, H, u) {
      p.sky([[0, '#171231'], [0.42, '#553a76'], [0.76, '#de876b'], [1, '#fad89e']], H * 0.64);
      p.stars(60, H * 0.3);
      p.sun(W * 0.7, H * 0.6, 44 * u, '#fff0c4', '#ff9a58');
      p.bands(H * 0.5, 18 * u, 34, '#f7b98d', 0.5);
      p.ridge(H * 0.66, H * 0.07, 1.3, 2.2, '#7c4a54', '#dd9066', { rim: '#ffdba4', hatch: 0.12 });
      p.ridge(H * 0.8, H * 0.13, 1.0, 8.6, '#4c2c3e', '#ad6641', { rim: '#f5b477', hatch: 0.2 });
      var g = p.ridge(H * 0.97, H * 0.16, 0.8, 15.3, '#1b1124', '#5c3542', { rim: '#e99c68', hatch: 0.26 });
      p.fox(W * 0.32, p.groundAt(g, W * 0.32) + 3 * u, 1.05 * u, '#0f0a16', '#f3a672');
    },
    /* Sonar: the plant, and everything it is quietly saying. */
    sonar: function (p, W, H, u) {
      p.sky([[0, '#03101a'], [0.5, '#0a3442'], [0.84, '#3c988a'], [1, '#bbe8c4']], H * 0.76);
      p.stars(80, H * 0.4);
      p.rings(W * 0.46, H * 0.78, [70 * u, 125 * u, 185 * u, 250 * u, 320 * u], '#a6f7d2');
      p.ridge(H * 0.76, H * 0.07, 2, 5.5, '#0a2a33', '#2a6f6a', { rim: '#bbe8c4' });
      p.factory(W * 0.14, H * 0.86, u, '#04121a', '#12333c', '#ffd58c');
      p.ridge(H * 1.0, H * 0.08, 3, 14, '#020a0f', '#0c2229');
    },
    /* RoboDR: the robot stays on its feet, inside its shield. */
    robodr: function (p, W, H, u) {
      p.sky([[0, '#060b1b'], [0.5, '#1d3256'], [0.84, '#86778c'], [1, '#f1c892']], H * 0.72);
      p.stars(110, H * 0.45);
      p.moon(W * 0.22, H * 0.22, 28 * u, '#f7ecd4');
      p.cloud(W * 0.76, H * 0.36, W * 0.3, H * 0.16, { lit: '#5b6e98', shade: '#182746', rim: '#f1d2a8', lx: -0.7, ly: -0.3 }, 12);
      p.ridge(H * 0.72, H * 0.14, 2.2, 2.7, '#1b2748', '#4a5a86', { rim: '#f1c892' });
      var g = p.ridge(H * 0.93, H * 0.16, 1.1, 6.6, '#070b18', '#1c2a4a', { rim: '#d9a878' });
      var gx = W * 0.54, gy = p.groundAt(g, gx);
      p.shield(gx, gy - 34 * u, 104 * u, '#8ff2c4');
      p.robot(gx, gy + 2 * u, 1.25 * u, '#04060e', '#8ff2c4');
    },
    /* Contact: first light over the range. */
    dawn: function (p, W, H) {
      p.sky([[0, '#0e1434'], [0.38, '#383c84'], [0.68, '#c47d90'], [0.88, '#f7ba8a'], [1, '#ffe4b4']], H * 0.72);
      p.stars(60, H * 0.28);
      var pal = { lit: '#f7cba8', shade: '#4b4a8e', rim: '#fff3da', lx: 0.7, ly: -0.45 };
      p.cloud(W * 0.7, H * 0.58, W * 0.44, H * 0.46, pal, 40);
      p.cloud(W * 0.2, H * 0.5, W * 0.3, H * 0.24, pal, 20);
      p.cloud(W * 0.97, H * 0.62, W * 0.2, H * 0.18, pal, 12);
      p.ridge(H * 0.72, H * 0.17, 1.7, 2.4, '#2c2b5c', '#6c5c98', { rim: '#f7ba8a' });
      p.water(H * 0.75, H, [[0, '#eaa98c'], [0.3, '#5b4b88'], [1, '#0b0d22']], '#fff0d0', W * 0.62);
      p.ridge(H * 0.93, H * 0.12, 2.6, 11.2, '#090a1b', '#272b57', { rim: '#b98ba2' });
    }
  };
  var SEEDS = { model: 88, autosecops: 101, aidr: 202, itops: 303, breakpoint: 404, fennec: 505, sonar: 606, robodr: 707, dawn: 808 };

  function paint(cv) {
    if (cv.__painted) return;
    cv.__painted = true;
    var name = cv.getAttribute('data-art'), scene = SCENES[name];
    if (!scene) return;
    try {
      var p = painter(cv, SEEDS[name] || 7);
      scene(p, p.W, p.H, p.u);
      p.finish();
      cv.classList.add('is-painted');
    } catch (err) {
      if (window.console) console.error('art: ' + name, err);
    }
  }

  /* Paint one canvas at a time so the page never stalls. */
  var queue = [], busy = false;
  function pump() {
    if (busy) return;
    busy = true;
    (function next() {
      var cv = queue.shift();
      if (!cv) { busy = false; return; }
      paint(cv);
      setTimeout(next, 30);
    })();
  }
  function enqueue(cv) {
    if (cv.__queued) return;
    cv.__queued = true;
    queue.push(cv);
    pump();
  }
  /* Anything within a screen and a half of the viewport gets painted. The
     observer does the work; the sweep covers webviews where it stays silent. */
  function sweep() {
    var vh = window.innerHeight || 800;
    list.forEach(function (cv) {
      if (cv.__queued) return;
      var r = cv.getBoundingClientRect();
      if (r.width && r.top < vh * 1.8 && r.bottom > -vh * 0.8) enqueue(cv);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        enqueue(e.target);
      });
    }, { rootMargin: '700px 0px' });
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
})();
