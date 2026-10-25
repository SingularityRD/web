/* Homepage behaviour: header, reveal-on-scroll and the product scenes.
 *
 * Every scene starts from markup that already shows its finished state,
 * so visitors without JavaScript, or with reduced motion, still see a
 * complete page. Scenes only play while they are on screen. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var animate = !reduced && hasIO;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  /* Visibility tracking: fn runs once, the first time el is on screen, and
     el.__visible stays current so looping scenes can pause off-screen. */
  function whenSeen(el, fn, threshold) {
    if (!el) return;
    var started = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        el.__visible = e.isIntersecting;
        if (e.isIntersecting && !started) { started = true; fn(el); }
      });
    }, { threshold: threshold || 0.3 }).observe(el);
  }
  function untilVisible(el) {
    return new Promise(function (r) {
      (function check() { el.__visible ? r() : setTimeout(check, 250); })();
    });
  }
  async function type(el, text, speed) {
    el.classList.add('typing');
    for (var i = 1; i <= text.length; i++) {
      el.textContent = text.slice(0, i);
      await sleep(speed);
    }
    el.classList.remove('typing');
  }

  /* Header: solid on scroll, compact mobile menu ------------------------ */
  (function () {
    var header = $('.site-header'), burger = $('.burger'), nav = $('#mobile-nav');
    if (!header) return;
    function sync() { header.classList.toggle('is-scrolled', window.scrollY > 12); }
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    if (!burger || !nav) return;
    function close() {
      header.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      nav.hidden = true;
    }
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      header.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.hidden = !open;
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) close(); });
  })();

  /* Use-case tabs work with or without motion --------------------------- */
  var CASES = [
    { name: 'Phishing triage', goal: 'Check every reported email. If it’s malicious, remove it everywhere and protect anyone who clicked.',
      tools: ['Microsoft 365', 'CrowdStrike', 'Okta', 'Slack'], alert: 'Reported: “Q3 invoice overdue”',
      lines: ['Fake Microsoft login page behind the link', '41 people received it, 3 entered a password', 'Email removed from 37 inboxes, 3 sessions reset'],
      verdict: ['bad', 'Malicious · contained'], time: 'Closed in 3m 12s' },
    { name: 'Endpoint response', goal: 'When a laptop behaves like it’s infected, confirm it, cut it off the network and tell the owner.',
      tools: ['CrowdStrike', 'SentinelOne', 'Jira', 'Teams'], alert: 'PowerShell started by Word on FIN-LT-0412',
      lines: ['Word opened a hidden script from a downloaded invoice', 'The script tried to reach a known attacker server', 'Laptop isolated in 84 ms, owner and IT notified'],
      verdict: ['bad', 'Malicious · isolated'], time: 'Closed in 46s' },
    { name: 'Login review', goal: 'Look at unusual sign-ins and decide if it’s really the employee or someone with their password.',
      tools: ['Okta', 'Entra ID', 'Google Workspace'], alert: 'j.morgan@ signed in from Frankfurt',
      lines: ['Istanbul to Frankfurt in 40 minutes looked impossible', 'Traffic came from the company VPN exit in Frankfurt', 'Same laptop and browser as usual, MFA passed'],
      verdict: ['ok', 'False alarm · closed'], time: 'Closed in 19s' },
    { name: 'Cloud guard', goal: 'Review risky changes in the cloud and undo anything nobody planned.',
      tools: ['AWS', 'Azure', 'GCP', 'ServiceNow'], alert: 'New admin user created in the prod AWS account',
      lines: ['Created by the deploy pipeline, not a person', 'Matches approved change ticket CHG-4412', 'Permissions match what the ticket asked for'],
      verdict: ['ok', 'Planned change · closed'], time: 'Closed in 27s' },
    { name: 'AI agent watch', goal: 'Watch the company’s AI agents and stop any that are tricked into doing something harmful.',
      tools: ['AIDR', 'Slack', 'GitHub'], alert: 'Support bot tried to run a downloaded script',
      lines: ['A customer email hid instructions for the bot', 'AIDR blocked the script before it ran', 'The bot kept answering customers safely'],
      verdict: ['ask', 'Blocked · review suggested'], time: 'Stopped in 1 ms' }
  ];

  (function () {
    var uc = $('[data-tabs]');
    if (!uc) return;
    var tabs = $$('.uc-tab', uc), f = {};
    $$('[data-f]', uc).forEach(function (el) { f[el.dataset.f] = el; });
    var cur = 0, timer = null, paused = false, DUR = 6500;
    uc.style.setProperty('--tab-ms', DUR + 'ms');

    function fill(c) {
      f.name.textContent = c.name;
      f.goal.textContent = c.goal;
      f.alert.textContent = c.alert;
      f.time.textContent = c.time;
      f.verdict.className = 'v v-' + c.verdict[0];
      f.verdict.textContent = c.verdict[1];
      f.tools.innerHTML = '';
      c.tools.forEach(function (t) { var s = document.createElement('span'); s.textContent = t; f.tools.appendChild(s); });
      f.lines.innerHTML = '';
      c.lines.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; f.lines.appendChild(li); });
    }
    async function show(i) {
      cur = i;
      tabs.forEach(function (t, k) {
        t.classList.toggle('is-on', k === i);
        t.setAttribute('aria-selected', String(k === i));
        // Restart the progress bar on the active tab.
        var bar = t.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
      if (!animate) { fill(CASES[i]); return; }
      uc.classList.add('swap');
      await sleep(260);
      fill(CASES[i]);
      uc.classList.add('reveal');
      uc.classList.remove('swap');
      $$('.uc-lines li', uc).forEach(function (li, k) {
        li.style.transitionDelay = (0.12 + k * 0.14) + 's';
      });
      await sleep(60);
      uc.classList.remove('reveal');
    }
    function schedule() {
      clearTimeout(timer);
      if (!animate || paused) return;
      timer = setTimeout(function () {
        if (uc.__visible) show((cur + 1) % CASES.length);
        schedule();
      }, DUR);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () {
        paused = true;
        uc.classList.add('is-paused');
        clearTimeout(timer);
        show(k);
      });
    });
    if (animate) whenSeen(uc, function () { show(0); schedule(); }, 0.4);
  })();

  if (!animate) return;

  /* Reveal on scroll, with a small stagger between siblings ------------- */
  (function () {
    var els = $$('.sec-title, .sec-sub, .app, .marquee, .uc, .card, .term, .aidr-points li, .mini > div, .canvas, .case-ui, .agents > div, .ready li, .cmp, .stat, .prices article, .faq-item, .cta');
    els.forEach(function (el) {
      var i = 0, s = el;
      while ((s = s.previousElementSibling)) if (s.__rv) i++;
      el.__rv = true;
      el.style.setProperty('--rvd', Math.min(i * 0.07, 0.42).toFixed(2) + 's');
      el.classList.add('rv');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // Safety net for webviews where IO is unreliable.
    function sweep() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('in');
      });
    }
    window.addEventListener('scroll', function () { setTimeout(sweep, 200); }, { passive: true });
    setTimeout(sweep, 1500);
  })();

  /* Logo marquee: duplicate the list so the loop is seamless ------------ */
  (function () {
    var list = $('.mq-list');
    if (!list) return;
    $$('.mq-item', list).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      list.appendChild(c);
    });
    list.classList.add('loop');
  })();

  /* Count-ups ------------------------------------------------------------ */
  $$('[data-count]').forEach(function (el) {
    var to = parseFloat(el.dataset.count), suf = el.dataset.suf || '';
    el.textContent = '0' + suf;
    whenSeen(el, function () {
      var t0 = performance.now(), dur = 1400;
      (function frame(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e) + suf;
        if (k < 1) requestAnimationFrame(frame);
      })(t0);
    }, 0.6);
  });

  /* Product shot: the AI analyst works the phishing report, then loops -- */
  (function () {
    var app = $('[data-app]');
    if (!app) return;
    var chat = $('[data-chat]', app);
    var items = [].slice.call(chat.children);
    var say = $('[data-type]', chat);
    var sayText = say.textContent;
    var task = $('[data-app-task]', app);
    var taskSub = $('[data-app-task-sub]', app);
    var yes = $('.yes', chat);
    chat.classList.add('play');

    whenSeen(app, async function () {
      for (;;) {
        await untilVisible(app);
        items.forEach(function (el) { el.classList.remove('shown', 'done'); });
        say.textContent = '';
        yes.classList.remove('pressed'); yes.textContent = 'Approve';
        task.classList.remove('is-done');
        taskSub.textContent = 'Agent investigating…';
        await sleep(500);

        for (var i = 0; i < items.length; i++) {
          var el = items[i];
          el.classList.add('shown');
          if (el.classList.contains('astep')) {
            await sleep(1100);
            el.classList.add('done');
            await sleep(500);
          } else if (el === say) {
            await sleep(250);
            await type(say, sayText, 18);
            await sleep(400);
          } else {
            await sleep(700);
          }
        }
        await sleep(1400);
        yes.classList.add('pressed'); yes.textContent = 'Approved';
        task.classList.add('is-done');
        taskSub.textContent = 'Contained · 3 people protected';
        await sleep(4200);
      }
    }, 0.35);
  })();

  /* Bento: prompt → workflow, approval, audit log ------------------------ */
  (function () {
    var p = $('[data-typeloop]');
    if (p) {
      var out = p.nextElementSibling, text = p.dataset.typeloop;
      whenSeen(p, async function () {
        for (;;) {
          await untilVisible(p);
          out.classList.add('hide');
          p.textContent = '';
          await sleep(500);
          await type(p, text, 32);
          await sleep(300);
          out.classList.remove('hide');
          [].slice.call(out.children).forEach(function (s, k) { s.style.transitionDelay = (k * 0.15) + 's'; });
          await sleep(4200);
        }
      });
    }

    var card = $('.art-approve .ap-card');
    if (card) {
      var y = $('.yes', card), k = $('.ap-k', card);
      whenSeen(card, async function () {
        for (;;) {
          await untilVisible(card);
          await sleep(2200);
          y.classList.add('pressed'); y.textContent = 'Approved';
          card.classList.add('ok'); k.textContent = 'Approved by m.kaya'; k.style.color = 'var(--ok)';
          await sleep(2600);
          y.classList.remove('pressed'); y.textContent = 'Approve';
          card.classList.remove('ok'); k.textContent = 'Pending approval'; k.style.color = '';
        }
      });
    }

    var log = $('[data-log]');
    if (log) {
      var POOL = ['Phishing email removed from 37 inboxes', 'Suspicious login confirmed safe', 'AIDR blocked a script from support-bot',
                  'Laptop FIN-LT-0412 isolated', 'Risky OAuth app access revoked', 'Case CASE-2291 closed with report'];
      var n = 0;
      whenSeen(log, async function () {
        for (;;) {
          await sleep(2400);
          await untilVisible(log);
          var li = document.createElement('li');
          li.innerHTML = '<i></i>';
          li.appendChild(document.createTextNode(POOL[n++ % POOL.length]));
          li.className = 'enter';
          log.insertBefore(li, log.firstChild);
          if (log.children.length > 4) log.lastElementChild.remove();
        }
      });
    }
  })();

  /* AIDR: events arrive one by one and verdicts stamp in ----------------- */
  (function () {
    var term = $('[data-aidr]');
    if (!term) return;
    var list = $('.kt', term), rows = [].slice.call(list.children);
    list.classList.add('play');
    whenSeen(term, async function () {
      for (;;) {
        await untilVisible(term);
        rows.forEach(function (r) { r.classList.remove('shown', 'stamped'); });
        await sleep(500);
        for (var i = 0; i < rows.length; i++) {
          rows[i].classList.add('shown');
          await sleep(450);
          rows[i].classList.add('stamped');
          await sleep(500);
        }
        await sleep(4500);
      }
    }, 0.4);
  })();

  /* Workflow: one run, step by step, mirrored in the events list --------- */
  (function () {
    var flow = $('[data-flow]');
    if (!flow) return;
    var status = $('[data-run-status]');
    var par = $('.flow-par', flow);
    var nodes = $$('[data-step]', flow);
    var evs = $$('[data-ev]');
    var busy = $('[data-busy]', flow);
    var verdict = busy ? busy.textContent : '';
    var yes = $('.gate-btns .yes', flow);
    var run = 4811;
    nodes.forEach(function (n) {
      var st = document.createElement('span');
      st.className = 'n-state';
      st.setAttribute('aria-hidden', 'true');
      n.appendChild(st);
    });
    function mark(k, cls) {
      nodes.concat(evs).forEach(function (n) {
        if ((n.dataset.step || n.dataset.ev) !== String(k)) return;
        n.classList.remove('run', 'wait', 'done');
        if (cls) n.classList.add(cls);
      });
    }
    whenSeen(flow, async function () {
      for (;;) {
        await untilVisible(flow);
        run++;
        if (status) status.textContent = '#' + run;
        [1, 2, 3, 4, 5].forEach(function (k) { mark(k, null); });
        par.classList.remove('lit', 'joined');
        yes.classList.remove('pressed'); yes.textContent = 'Approve';
        if (busy) busy.textContent = busy.dataset.busy;
        flow.classList.add('is-running');
        await sleep(400);

        mark(1, 'run'); await sleep(800); mark(1, 'done');
        mark(2, 'run'); await sleep(1800);
        if (busy) busy.textContent = verdict;
        mark(2, 'done');
        par.classList.add('lit');
        mark(3, 'run'); await sleep(1300); mark(3, 'done');
        par.classList.add('joined');
        mark(4, 'wait'); await sleep(2000);
        yes.classList.add('pressed'); yes.textContent = 'Approved';
        await sleep(500); mark(4, 'done');
        mark(5, 'run'); await sleep(700); mark(5, 'done');
        flow.classList.remove('is-running');
        await sleep(4000);
      }
    }, 0.35);
  })();

  /* Cases: affected users get handled one after another, copilot answers - */
  (function () {
    var cs = $('[data-case]');
    if (!cs) return;
    var cells = $$('[data-host]', cs);
    var ans = $('[data-case-ans]', cs);
    var text = ans.textContent;
    cells.forEach(function (c) { c.innerHTML = '<span class="st-run">Working</span>'; });
    ans.textContent = '';
    whenSeen(cs, async function () {
      await sleep(600);
      for (var i = 0; i < cells.length; i++) {
        await sleep(800);
        cells[i].innerHTML = '<span class="st-done">Done</span>';
      }
      await sleep(500);
      await type(ans, text, 22);
    }, 0.4);
  })();
})();
