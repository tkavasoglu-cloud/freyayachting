/* ══════════════════════════════════════════════════════════
   FREYA YACHTING — 2026 REDESIGN motion, shared (all pages)
   Batched fade-up reveal for any [data-reveal-group] wrapper via GSAP
   ScrollTrigger. Bails out completely under prefers-reduced-motion or
   if GSAP failed to load — content in site.css is visible with no JS
   either way. Index-only hero stagger + offer-bar lives in home.js.
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  function run() {
    var groups = document.querySelectorAll('[data-reveal-group]');
    groups.forEach(function (group) {
      var els = group.querySelectorAll('.gsap-reveal');
      if (!els.length) return;
      els.forEach(function (el) { el.classList.add('gsap-armed'); });
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.08 });
        },
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
