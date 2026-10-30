/* Filomuz carousel (taslak) — bağımlılıksız; kaydırma tarayıcıda native (scroll-snap), JS yalnız kontrolleri ekler. */
(function () {
  'use strict';
  var azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OK_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg>';
  var OK_SAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>';

  function kur(kok) {
    var iz = kok.querySelector('.fc__track');
    if (!iz) return;
    var slaytlar = Array.prototype.slice.call(iz.children);
    var n = slaytlar.length;
    var ad = kok.getAttribute('data-ad') || 'Tekne';
    kok.classList.add('fc--js');
    slaytlar.forEach(function (s, i) { s.setAttribute('aria-label', (i + 1) + ' / ' + n); });
    if (n < 2) return; // tek fotoğraf: ok ve nokta çıkmaz

    kok.classList.add('fc--coklu');
    var onceki = düğme('fc__btn fc__btn--prev', ad + ' önceki fotoğraf', OK_SOL);
    var sonraki = düğme('fc__btn fc__btn--next', ad + ' sonraki fotoğraf', OK_SAG);
    var noktalar = document.createElement('div');
    noktalar.className = 'fc__dots';
    var dots = slaytlar.map(function (_, i) {
      var d = düğme('fc__dot', ad + ': fotoğraf ' + (i + 1) + ' / ' + n, '');
      d.addEventListener('click', function () { git(i); });
      noktalar.appendChild(d);
      return d;
    });
    var sayac = document.createElement('span');
    sayac.className = 'fc__sayac';
    sayac.setAttribute('aria-live', 'polite');
    kok.appendChild(onceki); kok.appendChild(sonraki); kok.appendChild(noktalar); kok.appendChild(sayac);

    var simdi = 0, bekle = false;
    function düğme(sinif, etiket, html) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = sinif; b.setAttribute('aria-label', etiket); b.innerHTML = html;
      return b;
    }
    function guncelle(i) {
      simdi = i;
      dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      onceki.disabled = i === 0; sonraki.disabled = i === n - 1;
    }
    function git(i) {
      i = Math.max(0, Math.min(n - 1, i));
      iz.scrollTo({ left: i * iz.clientWidth, behavior: azHareket ? 'auto' : 'smooth' });
      guncelle(i);
      sayac.textContent = ad + ' fotoğraf ' + (i + 1) + ' / ' + n;
    }
    onceki.addEventListener('click', function () { git(simdi - 1); });
    sonraki.addEventListener('click', function () { git(simdi + 1); });
    iz.addEventListener('scroll', function () {
      if (bekle) return; bekle = true;
      window.requestAnimationFrame(function () {
        bekle = false;
        var i = Math.round(iz.scrollLeft / (iz.clientWidth || 1));
        if (i !== simdi) guncelle(i);
      });
    }, { passive: true });
    iz.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); git(simdi - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); git(simdi + 1); }
    });
    window.addEventListener('resize', function () { iz.scrollTo({ left: simdi * iz.clientWidth, behavior: 'auto' }); });
    guncelle(0);
  }

  function basla() { Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), kur); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
