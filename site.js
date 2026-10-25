/* Shared header behaviour for the article and case-study pages: solid
   header on scroll and the compact mobile menu. The homepage runs the
   same logic from home.js. */
(function () {
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('mobile-nav');
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
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 980) close(); });
})();
