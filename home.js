/* ══════════════════════════════════════════════════════════
   FREYA YACHTING — 2026 REDESIGN, INDEX-ONLY (index.html only)
   1) Offer bar: builds a WhatsApp message from Date/Guests/Boat
      and opens wa.me with it. Real booking widget is a later phase.
   2) Hero above-the-fold stagger reveal. Below-the-fold
      [data-reveal-group] batching (shared across all pages) lives in
      site.js, loaded before this file. Bails out completely under
      prefers-reduced-motion or if GSAP failed to load — content in
      home.css is visible with no JS either way. The hero's Ken Burns
      zoom is pure CSS (no JS dependency).
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Offer bar → WhatsApp ── */
  var offerBar = document.getElementById('offerBar');
  if (offerBar) {
    offerBar.addEventListener('submit', function (e) {
      e.preventDefault();
      var date  = offerBar.querySelector('#offer-date').value;
      var guests = offerBar.querySelector('#offer-guests').value;
      var boat  = offerBar.querySelector('#offer-boat').value;

      var dateText = date
        ? new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'belirtilecek bir tarihte';

      var guestCount = guests.replace(/\s*Kişi$/, '');

      var message = boat === 'Fark Etmez'
        ? 'Merhaba, ' + dateText + ' için ' + guestCount + ' kişilik rezervasyon hakkında teklif almak istiyorum.'
        : 'Merhaba, ' + dateText + ' için ' + guestCount + ' kişilik ' + boat + ' rezervasyonu hakkında teklif almak istiyorum.';

      window.open('https://wa.me/908508402465?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
    });
  }

  /* ── Hero above-the-fold stagger ── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || typeof gsap === 'undefined') return;

  function run() {
    var heroEls = document.querySelectorAll(
      '.hero-2026__badge, .hero-2026__title, .hero-2026__desc, .hero-2026__actions, .hero-2026__social, .offer-bar-2026'
    );
    if (!heroEls.length) return;
    heroEls.forEach(function (el) { el.classList.add('gsap-reveal', 'gsap-armed'); });
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } })
      .to('.hero-2026__badge.gsap-armed',   { opacity: 1, y: 0 }, 0)
      .to('.hero-2026__title.gsap-armed',   { opacity: 1, y: 0 }, 0.1)
      .to('.hero-2026__desc.gsap-armed',    { opacity: 1, y: 0 }, 0.2)
      .to('.hero-2026__actions.gsap-armed', { opacity: 1, y: 0 }, 0.3)
      .to('.hero-2026__social.gsap-armed',  { opacity: 1, y: 0 }, 0.35)
      .to('.offer-bar-2026.gsap-armed',     { opacity: 1, y: 0 }, 0.4);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
