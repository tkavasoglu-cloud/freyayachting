/* ══════════════════════════════════
   FREYA YACHTING — SHARED JS
══════════════════════════════════ */

/* MOBILE MENU */
function toggleMobile() {
  var drawer = document.getElementById('mobileDrawer');
  var btn = document.getElementById('ham-btn');
  var isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open');
  btn.classList.toggle('open');
  btn.setAttribute('aria-expanded', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeMobile() {
  var drawer = document.getElementById('mobileDrawer');
  var btn = document.getElementById('ham-btn');
  if (drawer) drawer.classList.remove('open');
  if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
}

/* NAVBAR SCROLL */
window.addEventListener('scroll', function() {
  var nav = document.getElementById('navbar');
  if (nav) {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
}, { passive: true });

/* FAQ ACCORDION */
function toggleFAQ(btn) {
  var item = btn.closest('.faq-item');
  var body = item.querySelector('.faq-body');
  var isOpen = item.classList.contains('open');

  document.querySelectorAll('.faq-item.open').forEach(function(el) {
    el.classList.remove('open');
    el.querySelector('.faq-body').style.maxHeight = null;
    el.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    btn.setAttribute('aria-expanded', 'true');
  }
}

/* SCROLL REVEAL */
function initReveal() {
  if (!window.IntersectionObserver) {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
    observer.observe(el);
  });
}

/* FORM SUBMIT */
function submitForm() {
  var name = document.getElementById('form-name');
  var email = document.getElementById('form-email');
  var msg = document.getElementById('form-message');
  if (!name || !name.value.trim()) { name && name.focus(); return; }
  if (!email || !email.value.trim()) { email && email.focus(); return; }

  var btn = event.currentTarget;
  var orig = btn.innerHTML;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Gönderildi!';
  btn.style.background = '#16a34a';
  setTimeout(function() { btn.innerHTML = orig; btn.style.background = ''; }, 3000);
  if (name) name.value = '';
  if (email) email.value = '';
  if (msg) msg.value = '';
}

/* KEYBOARD */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeMobile();
});

/* INIT */
document.addEventListener('DOMContentLoaded', initReveal);
