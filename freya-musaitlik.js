/* ══════════════════════════════════════════════════════════
   FREYA YACHTING — freya.html only: Müsaitlik Takvimi widget.
   Fetches weekly availability from the n8n webhook and renders
   week-card-2026 cards. Falls back to a single WhatsApp CTA line
   if the fetch fails, returns nothing, or any error is thrown —
   the calendar section and the fallback line both start hidden
   so a broken/empty grid is never shown.
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WEBHOOK_URL = 'https://freyayachting.app.n8n.cloud/webhook/musaitlik';
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

  function formatRange(startStr, endStr) {
    var s = new Date(startStr + 'T00:00:00');
    var e = new Date(endStr + 'T00:00:00');
    if (s.getMonth() === e.getMonth()) {
      return s.getDate() + '–' + e.getDate() + ' ' + MONTHS[s.getMonth()];
    }
    return s.getDate() + ' ' + MONTHS[s.getMonth()] + ' – ' + e.getDate() + ' ' + MONTHS[e.getMonth()];
  }

  function normalizePrice(fiyat) {
    if (typeof fiyat === 'number') return fiyat + ' TL';
    if (typeof fiyat === 'string') return fiyat;
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
      if (week.not) link.appendChild(el('p', 'week-card-2026__note', week.not));
    } else {
      link.className = 'week-card-2026 week-card-2026--bos';
      link.appendChild(el('div', 'week-card-2026__dates', range));
      if (price) link.appendChild(el('div', 'week-card-2026__price', price));
      link.appendChild(el('div', 'week-card-2026__status', 'Müsait'));
    }
    return link;
  }

  try {
    var gridEl = document.getElementById('week-grid');
    var calendarEl = document.getElementById('musaitlik-calendar');
    if (!gridEl || !calendarEl) return;

    fetch(WEBHOOK_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('musaitlik webhook: bad response');
        return res.json();
      })
      .then(function (weeks) {
        if (!Array.isArray(weeks) || !weeks.length) { showFallback(); return; }

        var today = todayStr();
        var upcoming = weeks
          .filter(function (w) { return w && w.hafta_bitis && w.hafta_bitis >= today; })
          .sort(function (a, b) { return a.hafta_baslangic < b.hafta_baslangic ? -1 : 1; });

        if (!upcoming.length) { showFallback(); return; }

        upcoming.forEach(function (w) { gridEl.appendChild(buildCard(w)); });
        calendarEl.hidden = false;
      })
      .catch(showFallback);
  } catch (err) {
    showFallback();
  }
})();
