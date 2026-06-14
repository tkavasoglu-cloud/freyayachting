/* Freya Yachting — main.js
   Craft-quality interactions following Emil Kowalski principles */

(function () {
  'use strict';

  /* ── NAV scroll state ─────────────────── */
  const nav = document.getElementById('navbar');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // init state
  }

  /* ── Hamburger / mobile drawer ────────── */
  window.toggleMobile = function () {
    const btn    = document.getElementById('ham-btn');
    const drawer = document.getElementById('mobileDrawer');
    if (!btn || !drawer) return;

    const open = btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    drawer.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  /* ── Dropdown keyboard a11y ───────────── */
  document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
    dd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const panel = dd.querySelector('.dropdown-panel');
        if (panel) panel.style.pointerEvents = 'none';
        dd.querySelector('.nav-dropdown-btn')?.blur();
      }
    });
  });

  /* ── Scroll reveal — IntersectionObserver ─
     Safety: elements are visible by default; observer ADDS the
     initial hidden state via data-reveal, then triggers visible.
     This means content never ships blank on headless renderers. */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    // Only hide elements that are below the fold at load time
    const viewH = window.innerHeight;
    els.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top > viewH * 0.92) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
      } else {
        // Already in view — mark visible immediately
        el.classList.add('visible');
      }
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          // Reset inline styles so CSS transition takes over
          el.style.opacity   = '';
          el.style.transform = '';
          // requestAnimationFrame ensures the transition fires
          requestAnimationFrame(function () {
            el.classList.add('visible');
          });
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) {
      if (!el.classList.contains('visible')) {
        observer.observe(el);
      }
    });
  }

  /* ── FAQ accordion ───────────────────── */
  function initFAQ() {
    document.querySelectorAll('.faq-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = btn.closest('.faq-item');
        const body = item.querySelector('.faq-body');
        const isOpen = item.classList.contains('open');

        // Close all others
        document.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-body').style.maxHeight = '0';
            other.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          body.style.maxHeight = '0';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── Bottom bar active state ─────────── */
  function initBottomBar() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-bar-btn').forEach(function (btn) {
      const href = btn.getAttribute('href') || '';
      if (href && href.includes(path)) {
        btn.classList.add('active');
      }
    });
  }

  /* ── Init ────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initReveal();
      initFAQ();
      initBottomBar();
    });
  } else {
    initReveal();
    initFAQ();
    initBottomBar();
  }
})();
