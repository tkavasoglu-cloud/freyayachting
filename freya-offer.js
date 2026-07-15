/* ══════════════════════════════════════════════════════════
   FREYA YACHTING — freya-offer.html only: teklif formu.
   Promosyon kodu doğrulama (client-side) + n8n webhook'una POST
   ederek dinamik fiyat teklifi alma. Türkçe, tek dil.
══════════════════════════════════════════════════════════ */

const WEBHOOK_URL = 'https://freyayachting.app.n8n.cloud/webhook/offer-request';

const PROMO_CODES = {
  SUMMER10: { discount: 10, type: 'percent' },
  EARLY15: { discount: 15, type: 'percent' },
  WELCOME5: { discount: 5, type: 'percent' },
  VIP20: { discount: 20, type: 'percent' },
  FLAT200: { discount: 200, type: 'fixed' },
};

const SEASON_LABELS = { HIGH: 'Yüksek Sezon', MID: 'Orta Sezon', LOW: 'Düşük Sezon' };

let activePromo = null;

function applyPromo() {
  const input = document.getElementById('inputPromo');
  const status = document.getElementById('promoStatus');
  const btn = document.getElementById('promoApplyBtn');
  const code = input.value.trim().toUpperCase();

  btn.classList.remove('valid', 'invalid');
  status.classList.remove('valid', 'invalid');

  if (!code) { activePromo = null; status.textContent = ''; return; }

  const promo = PROMO_CODES[code];
  if (promo) {
    activePromo = { code, ...promo };
    btn.classList.add('valid');
    status.classList.add('valid');
    status.textContent = promo.type === 'percent'
      ? '%' + promo.discount + ' indirim uygulanacak.'
      : '€' + promo.discount + ' indirim uygulanacak.';
  } else {
    activePromo = null;
    btn.classList.add('invalid');
    status.classList.add('invalid');
    status.textContent = 'Geçersiz kod.';
  }
}

async function submitForm() {
  const btn = document.getElementById('btnSubmit');
  const resultArea = document.getElementById('resultArea');
  resultArea.hidden = true;
  resultArea.innerHTML = '';

  const payload = {
    name: document.getElementById('inputName').value.trim(),
    phone: document.getElementById('inputPhone').value.trim(),
    email: document.getElementById('inputEmail').value.trim(),
    startDate: document.getElementById('inputStartDate').value,
    nights: Number(document.getElementById('inputNights').value),
    guests: Number(document.getElementById('inputGuests').value),
    source: 'Website',
  };

  if (!payload.startDate) { alert('Lütfen tarih seçin.'); return; }

  btn.classList.add('loading');
  btn.disabled = true;
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.reason === 'NotAvailable' || data.ok === false) {
      showNotAvailable();
    } else if (data.DynamicPrice || data.dynamicPrice) {
      showResult(data, payload);
    } else {
      showError();
    }
  } catch (err) {
    console.error(err);
    showError();
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function resultRow(label, value) {
  const row = el('div', 'offer-result-row-2026');
  row.appendChild(el('span', 'offer-result-row-2026__label', label));
  row.appendChild(el('span', 'offer-result-row-2026__value', value));
  return row;
}

function showResult(data, payload) {
  const area = document.getElementById('resultArea');

  let price = Number(data.DynamicPrice || data.dynamicPrice);
  if (activePromo) {
    price = activePromo.type === 'percent' ? price * (1 - activePromo.discount / 100) : price - activePromo.discount;
    price = Math.max(0, Math.round(price / 10) * 10);
  }

  const season = data.Season || data.season;
  const nights = data.Nights || data.nights || payload.nights;
  const guests = data.Guests || data.guests || payload.guests;
  const occupancy = data.Occupancy || data.occupancy || 0;
  const minNights = data.MinNights || data.minNights;
  const minWarn = data.MinNightsWarning || data.minNightsWarning;
  const allExtras = Number(data.AllExtrasTotal || data.allExtrasTotal || 0);
  const expiry = data.ExpiresAt || data.expiresAt;

  let extras = null;
  try {
    const upsells = typeof data.UpsellsJSON === 'string' ? JSON.parse(data.UpsellsJSON) : (data.upsellsJSON || null);
    if (upsells && upsells.extras && upsells.extras.length) extras = upsells.extras;
  } catch (e) { extras = null; }

  const totalPrice = Number(price) + allExtras;
  const expiryDate = expiry
    ? new Date(expiry).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const card = el('div', 'offer-result-card-2026');

  if (minWarn) {
    card.appendChild(el('p', 'offer-minnights-2026', 'Bu dönem için minimum konaklama ' + minNights + ' gecedir.'));
  }

  card.appendChild(el('span', 'offer-badge-2026 offer-badge-2026--available', 'Müsait'));
  if (activePromo) {
    const promoLabel = activePromo.code + (activePromo.type === 'percent' ? ' (-%' + activePromo.discount + ')' : ' (-€' + activePromo.discount + ')');
    card.appendChild(el('span', 'offer-badge-2026 offer-badge-2026--promo', promoLabel));
  }

  card.appendChild(el('h2', null, 'Teklifiniz'));
  card.appendChild(resultRow('Başlangıç Tarihi', payload.startDate + ' · ' + nights + ' gece'));
  card.appendChild(resultRow('Misafir Sayısı', guests + ' misafir'));
  card.appendChild(resultRow('Sezon', SEASON_LABELS[season] || season));
  card.appendChild(resultRow('Aylık Doluluk', '%' + occupancy));
  card.appendChild(resultRow('Tekne + Kaptan', '€' + Number(price).toLocaleString('tr-TR')));

  if (extras) {
    const box = el('div', 'offer-result-extras-2026');
    box.appendChild(el('p', 'offer-result-extras-2026__title', 'Opsiyonel Ekstralar'));
    extras.forEach((e) => {
      const item = el('div', 'offer-extra-item-2026');
      item.appendChild(el('span', null, e.name + ' — ' + e.desc));
      item.appendChild(el('span', null, '€' + e.total));
      box.appendChild(item);
    });
    card.appendChild(box);
  }

  const total = el('div', 'offer-result-total-2026');
  total.appendChild(el('span', 'offer-result-row-2026__label', 'Her Şey Dahil Toplam'));
  total.appendChild(el('span', 'offer-result-total-2026__value', '€' + totalPrice.toLocaleString('tr-TR')));
  card.appendChild(total);

  if (expiryDate) {
    const p = el('p', 'offer-result-expiry-2026');
    p.append('Teklif geçerlilik süresi: ');
    p.appendChild(el('strong', null, expiryDate));
    card.appendChild(p);
  }

  area.innerHTML = '';
  area.appendChild(card);
  area.hidden = false;
  area.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const CALENDAR_X_ICON = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9.5" y1="14.5" x2="14.5" y2="19.5"/><line x1="14.5" y1="14.5" x2="9.5" y2="19.5"/></svg>';
const ALERT_ICON = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

function showNotAvailable() {
  const area = document.getElementById('resultArea');
  const card = el('div', 'offer-na-card-2026');
  card.innerHTML = CALENDAR_X_ICON;
  card.appendChild(el('h2', null, 'Tarihler Müsait Değil'));
  card.appendChild(el('p', null, 'Seçtiğiniz tarihler maalesef dolu. Lütfen farklı tarih deneyin.'));
  area.innerHTML = '';
  area.appendChild(card);
  area.hidden = false;
}

function showError() {
  const area = document.getElementById('resultArea');
  const card = el('div', 'offer-na-card-2026');
  card.innerHTML = ALERT_ICON;
  card.appendChild(el('p', null, 'Bir hata oluştu. Lütfen tekrar deneyin.'));
  area.innerHTML = '';
  area.appendChild(card);
  area.hidden = false;
}

const today = new Date().toISOString().split('T')[0];
document.getElementById('inputStartDate').setAttribute('min', today);
