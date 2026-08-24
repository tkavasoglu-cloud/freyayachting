/* ══════════════════════════════════════════════════════════
   FREYA YACHTING — freya.html only: Müsaitlik Takvimi widget.
   Reads weekly availability + price from the public Firebase
   RTDB JSON export (shared/musaitlik-public, written by the
   Freya Finans panel) and renders week-card-2026 cards. Falls
   back to a single WhatsApp CTA line if the fetch fails, returns
   nothing, or any error is thrown — the calendar section and the
   fallback line both start hidden so a broken/empty grid is
   never shown. Result is cached in localStorage for 5 minutes
   to avoid re-fetching on every page load.
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DATA_URL = 'https://freya-finans-default-rtdb.europe-west1.firebasedatabase.app/shared/musaitlik-public.json';
  var CACHE_KEY = 'freya_musaitlik_cache';
  var CACHE_TTL_MS = 5 * 60 * 1000;
  var WHATSAPP_NUMBER = '908508402465';
  var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  function showFallback() {
    var calendarEl = document.getElementById('musaitlik-calendar');
    var fallbackEl = document.getElementById('musaitlik-fallback');
    if (calendarEl) calendarEl.hidden = true;
    if (fallbackEl) fallbackEl.hidden = false;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function addDays(dateStr, days) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatRange(startStr, endStr) {
    var s = new Date(startStr + 'T00:00:00');
    var e = new Date(endStr + 'T00:00:00');
    if (s.getMonth() === e.getMonth()) {
      return s.getDate() + '–' + e.getDate() + ' ' + MONTHS[s.getMonth()];
    }
    return s.getDate() + ' ' + MONTHS[s.getMonth()] + ' – ' + e.getDate() + ' ' + MONTHS[e.getMonth()];
  }

  function normalizePrice(fiyat) {
    if (typeof fiyat === 'number' && !isNaN(fiyat)) return '€' + fiyat.toLocaleString('tr-TR');
    return '';
  }

  function waLink(rangeLabel) {
    var text = 'Merhaba, ' + rangeLabel + ' haftası için rezervasyon bilgisi almak istiyorum.';
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function buildCard(week) {
    var range = formatRange(week.hafta_baslangic, week.hafta_bitis);
    var price = normalizePrice(week.fiyat);

    if (week.durum === 'dolu') {
      var card = el('div', 'week-card-2026 week-card-2026--dolu');
      card.appendChild(el('div', 'week-card-2026__dates', range));
      card.appendChild(el('div', 'week-card-2026__status', 'DOLU'));
      return card;
    }

    var link = el('a', null);
    link.href = waLink(range);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    if (week.durum === 'ozel') {
      link.className = 'week-card-2026 week-card-2026--ozel';
      link.appendChild(el('span', 'week-card-2026__badge', 'Özel Teklif'));
      link.appendChild(el('div', 'week-card-2026__dates', range));
      if (price) link.appendChild(el('div', 'week-card-2026__price', price));
    } else {
      link.className = 'week-card-2026 week-card-2026--bos';
      link.appendChild(el('div', 'week-card-2026__dates', range));
      if (price) link.appendChild(el('div', 'week-card-2026__price', price));
      link.appendChild(el('div', 'week-card-2026__status', 'Müsait'));
    }
    return link;
  }

  function weeksFromMap(map) {
    return Object.keys(map).map(function (start) {
      var entry = map[start] || {};
      return { hafta_baslangic: start, hafta_bitis: addDays(start, 6), durum: entry.durum, fiyat: entry.fiyat };
    });
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || !parsed.data) return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (err) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (err) { /* storage unavailable/full — cache is best-effort */ }
  }

  function renderWeeks(gridEl, calendarEl, map) {
    if (!map || typeof map !== 'object' || !Object.keys(map).length) { showFallback(); return; }

    var today = todayStr();
    var upcoming = weeksFromMap(map)
      .filter(function (w) { return w.hafta_bitis >= today; })
      .sort(function (a, b) { return a.hafta_baslangic < b.hafta_baslangic ? -1 : 1; });

    if (!upcoming.length) { showFallback(); return; }

    upcoming.forEach(function (w) { gridEl.appendChild(buildCard(w)); });
    calendarEl.hidden = false;
  }

  try {
    var gridEl = document.getElementById('week-grid');
    var calendarEl = document.getElementById('musaitlik-calendar');
    if (!gridEl || !calendarEl) return;

    var cached = readCache();
    if (cached) {
      renderWeeks(gridEl, calendarEl, cached);
      return;
    }

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('musaitlik data: bad response');
        return res.json();
      })
      .then(function (map) {
        writeCache(map);
        renderWeeks(gridEl, calendarEl, map);
      })
      .catch(showFallback);
  } catch (err) {
    showFallback();
  }
})();
