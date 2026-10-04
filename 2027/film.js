(() => {
  'use strict';

  const root = document.documentElement;
  const WA = 'https://wa.me/908508402465';
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  // Fleet and availability come from filo.js (window.FILO).
  const FILO = Array.isArray(window.FILO) ? window.FILO : [];
  const aktifler = FILO.filter(t => t.durum === 'aktif');
  const fiyatYaz = n => new Intl.NumberFormat('tr-TR').format(n);

  // Early-booking perk disappears at 1 May 2027 00:00 Istanbul (UTC+3).
  // ?tarih=2027-05-01T00:00:00+03:00 overrides "now" for testing.
  const ERKEN_BITIS = Date.parse('2027-05-01T00:00:00+03:00');

  const simdi = () => {
    const t = new URLSearchParams(location.search).get('tarih');
    const d = t ? Date.parse(t) : NaN;
    return Number.isNaN(d) ? Date.now() : d;
  };

  function erkenRezervasyon() {
    const acik = simdi() < ERKEN_BITIS;
    document.querySelectorAll('.erken').forEach(el => { el.hidden = !acik; });
    document.querySelectorAll('.erken-yerine').forEach(el => { el.hidden = acik; });
  }

  function haftaMetni(anahtar) {
    const [y, m, d] = anahtar.split('-').map(Number);
    const bas = new Date(Date.UTC(y, m - 1, d));
    const bit = new Date(bas.getTime() + 6 * 864e5);
    return bas.getUTCMonth() === bit.getUTCMonth()
      ? `${bas.getUTCDate()}–${bit.getUTCDate()} ${AYLAR[bit.getUTCMonth()]} ${bit.getUTCFullYear()}`
      : `${bas.getUTCDate()} ${AYLAR[bas.getUTCMonth()]} – ${bit.getUTCDate()} ${AYLAR[bit.getUTCMonth()]} ${bit.getUTCFullYear()}`;
  }

  // ---------- fleet grid ----------
  function filoKur() {
    const izgara = document.getElementById('filo-izgara');
    // boats that are not confirmed yet ('yakinda') get an empty 'Yakında' tile, no name
    if (!izgara || !aktifler.length) return;
    // a second boat on sale brings back the wording for the rest of the fleet
    if (aktifler.length > 1) document.getElementById('filo-not').textContent = 'Amiral teknemiz Freya ve filomuzdaki diğer tekneler';
    izgara.replaceChildren(...aktifler.map(t => {
      const li = document.createElement('li');
      li.className = 'filo-kart' + (t.amiral ? ' filo-amiral' : '');
      const a = document.createElement('a');
      a.className = 'kart-bag filo-bag';
      if (t.sayfa) {
        // the boat's own page on freyayachting.com, in a new tab so this page stays open
        a.href = t.sayfa; a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('aria-label', t.ad + ' tekne sayfası, freyayachting.com (yeni sekmede açılır)');
      } else {
        a.href = '#bos-haftalar';
        a.dataset.tekne = t.id;
      }
      a.innerHTML =
        (t.gorsel ? '<span class="filo-gorsel"><img data-src="' + t.gorsel + '-700.webp" data-srcset="' + t.gorsel + '-700.webp 700w, ' + t.gorsel + '-1200.webp 1200w" sizes="(min-width: 900px) 50vw, 100vw" alt="" width="1200" height="675" decoding="async"></span>' : '') +
        '<span class="filo-metin">' +
          (t.amiral ? '<span class="mini filo-rozet">Amiral tekne</span>' : '') +
          '<span class="filo-ad"' + (t.dil ? ' lang="' + t.dil + '"' : '') + '>' + t.ad + '</span>' +
          '<span class="filo-alt">' + [t.model, t.yil, t.kabin && t.kabin + ' kabin', t.kisi && 'en fazla ' + t.kisi + ' kişi'].filter(Boolean).join(' · ') + '</span>' +
          (t.fiyat ? '<span class="mini">2027 haftalık ' + fiyatYaz(t.fiyat) + " EUR'dan</span>" : '') +
          (t.sayfa ? '<span class="mini filo-git">Tekne sayfası ↗</span>' : '') +
        '</span>';
      li.append(a);
      return li;
    }), ...FILO.filter(t => t.durum === 'yakinda').map(() => {
      const li = document.createElement('li');
      li.className = 'filo-kart';
      li.innerHTML = '<div class="filo-bos"><span class="filo-ad">Yakında</span><span class="mini">Yeni tekne</span></div>';
      return li;
    }));
  }

  // ---------- live calendar ----------
  // Same source, cache key and 5-minute lifetime as freya-musaitlik.js on freyayachting.com.
  const TAKVIM_URL = 'https://freya-finans-default-rtdb.europe-west1.firebasedatabase.app/shared/musaitlik-public.json';
  const TAKVIM_ANAHTAR = 'freya_musaitlik_cache', TAKVIM_OMUR = 5 * 60 * 1000;
  let takvim = null;
  const gecerli = v => v && typeof v === 'object' && Object.keys(v).length ? v : null;
  function takvimiOku() {
    try {
      const k = JSON.parse(localStorage.getItem(TAKVIM_ANAHTAR));
      if (k && k.ts && Date.now() - k.ts <= TAKVIM_OMUR && gecerli(k.data)) return k.data;
    } catch (e) { /* no storage: fetch instead */ }
    return null;
  }
  function takvimiGetir() {
    takvim = takvimiOku();
    if (takvim) return;
    if (!aktifler.some(t => t.takvim === 'canli') || !window.fetch) return;
    const iptal = window.AbortController ? new AbortController() : null;
    const sure = setTimeout(() => iptal && iptal.abort(), 10000);
    fetch(TAKVIM_URL, iptal ? { signal: iptal.signal } : {})
      .then(r => { if (!r.ok) throw new Error('takvim ' + r.status); return r.json(); })
      .then(v => {
        takvim = gecerli(v);
        if (!takvim) return;
        try { localStorage.setItem(TAKVIM_ANAHTAR, JSON.stringify({ ts: Date.now(), data: takvim })); } catch (e) { /* best effort */ }
        haftalariYaz();
      })
      .catch(() => { /* the WhatsApp row stays */ })
      .finally(() => clearTimeout(sure));
  }

  // ---------- weeks, filtered by boat ----------
  const yedekSatir = document.querySelector('#hafta-liste .hafta-yedek');
  let seciliTekne = (aktifler.find(t => t.amiral) || aktifler[0] || {}).id;
  function haftalariYaz() {
    const liste = document.getElementById('hafta-liste');
    const not = document.getElementById('hafta-not');
    if (!liste) return;
    // the week row in <template id="hafta-kalip"> is the pattern for every row
    const kalip = document.getElementById('hafta-kalip')?.content.querySelector('.hafta');
    const tekne = FILO.find(t => t.id === seciliTekne);
    if (!kalip || !tekne) return;
    // live calendar not here (yet, or at all): the WhatsApp row from the HTML stays
    if (tekne.takvim === 'canli' && !takvim) { liste.replaceChildren(yedekSatir); return; }
    const veri = (tekne.takvim === 'canli' ? takvim : tekne.musaitlik) || {};
    const bugun = new Date(simdi() + 3 * 36e5).toISOString().slice(0, 10);   // today in Istanbul
    const bosHaftalar = Object.keys(veri).sort().filter(k => {
      const [y, m, d] = k.split('-').map(Number);
      const bitis = new Date(Date.UTC(y, m - 1, d + 6)).toISOString().slice(0, 10);
      return y === 2027 && veri[k] && veri[k].durum === 'bos' && new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 6 && bitis >= bugun;
    });
    // only the weeks picked for the page (vitrin) are listed; the rest are on the full calendar link
    const vitrin = tekne.vitrin || {};
    const haftalar = bosHaftalar.filter(k => k in vitrin);
    if (tekne.takvim === 'canli' && bosHaftalar.length) {
      // "from" price = the lowest price among all open weeks
      const fiyatlar = bosHaftalar.map(k => veri[k].fiyat).filter(f => typeof f === 'number' && f > 0);
      if (fiyatlar.length && Math.min(...fiyatlar) !== tekne.fiyat) { tekne.fiyat = Math.min(...fiyatlar); filoKur(); }
    }
    if (not) not.innerHTML = 'Cumartesi 15:00 – Cuma' + (tekne.fiyat ? ' · ' + tekne.ad + ' haftalık <span class="kirmizi">' + fiyatYaz(tekne.fiyat) + " EUR</span>'dan" : '');
    if (!haftalar.length && tekne.takvim === 'canli') { liste.replaceChildren(yedekSatir); return; }
    if (!haftalar.length) {
      const li = document.createElement('li');
      li.className = 'cam hafta hafta-bos';
      li.innerHTML = '<span class="hafta-tarih">Haftalar yakında</span><span class="hafta-not mini">' + tekne.ad + ' için takvim henüz açılmadı</span>';
      const a = kalip.querySelector('a').cloneNode(true);
      a.textContent = 'WhatsApp\'tan sorun';
      a.href = WA + '?text=' + encodeURIComponent('Merhaba, 2027 haftaları hakkında bilgi almak istiyorum.');
      li.append(a);
      liste.replaceChildren(li);
      return;
    }
    liste.replaceChildren(...haftalar.map(k => {
      const li = kalip.cloneNode(true);
      const metin = haftaMetni(k);
      li.querySelector('a').dataset.konum = 'hafta';
      li.querySelector('.hafta-tarih').textContent = metin;
      if (vitrin[k]) li.querySelector('.hafta-not').textContent = vitrin[k];
      li.querySelector('a').href = WA + '?text=' + encodeURIComponent('Merhaba, 2027 haftaları hakkında bilgi almak istiyorum: ' + tekne.ad + ', ' + metin + '.');
      return li;
    }));
  }

  function filtreKur() {
    const filtre = document.getElementById('filtre');
    // with a single boat on show there is nothing to choose between
    if (!filtre || aktifler.length < 2) return;
    filtre.hidden = false;
    const dugmeler = aktifler.map(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'filtre-dugme';
      b.dataset.tekne = t.id;
      b.textContent = t.ad;
      b.setAttribute('aria-pressed', String(t.id === seciliTekne));
      return b;
    });
    filtre.replaceChildren(...dugmeler);
    filtre.addEventListener('click', e => {
      const b = e.target.closest('.filtre-dugme');
      if (b && !b.disabled) tekneSec(b.dataset.tekne);
    });
  }
  function tekneSec(id) {
    seciliTekne = id;
    document.querySelectorAll('.filtre-dugme').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tekne === id)));
    haftalariYaz();
  }
  // a fleet card selects its boat before the page glides down to the weeks
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-tekne]');
    if (a) tekneSec(a.dataset.tekne);
  }, true);

  erkenRezervasyon();

  // ---------- letter wave on the big headings ----------
  // Each letter arrives a little low, then rises and fades in, one after
  // another, so the word ripples in. Words stay unbroken; the heading keeps its full text for
  // screen readers. Skipped entirely when the visitor prefers reduced motion.
  const harfDalgasi = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function harflereBol(baslik) {
    if (baslik.dataset.harf) return;
    baslik.dataset.harf = '1';
    baslik.setAttribute('aria-label', baslik.textContent.replace(/\s+/g, ' ').trim());
    // each line (each .b-kalin / .b-italik span) gets its own start; letters count from zero per line
    baslik.querySelectorAll('.b-kalin, .b-italik').forEach((parca, satir) => {
      let sira = 0;
      parca.style.setProperty('--satir', satir);
      const kelimeler = parca.textContent.split(/(\s+)/);
      parca.textContent = '';
      kelimeler.forEach(k => {
        if (!k) return;
        if (/^\s+$/.test(k)) { parca.append(' '); return; }
        const kelime = document.createElement('span');
        kelime.className = 'kelime'; kelime.setAttribute('aria-hidden', 'true');
        for (const harf of k) {
          const h = document.createElement('span');
          h.className = 'harf'; h.textContent = harf; h.style.setProperty('--h', sira++);
          kelime.append(h);
        }
        parca.append(kelime);
      });
    });
  }
  function harfleriOynat(el) {
    const hedefler = el.matches('[data-harf]') ? [el] : [...el.querySelectorAll('[data-harf]')];
    hedefler.forEach(h => { h.classList.remove('harf-oynat'); void h.offsetWidth; h.classList.add('harf-oynat'); });
  }
  if (harfDalgasi) {
    root.classList.add('harf-hazir');
    document.querySelectorAll('.kahraman .baslik-sol, .kahraman .baslik-sag, .kahraman .ozellik, .kahraman .bolum-sol, .kahraman .bolum-sag, .bolum-baslik').forEach(harflereBol);
    // section headings ripple in when they come into view
    const io = 'IntersectionObserver' in window && new IntersectionObserver(g => g.forEach(x => { if (x.isIntersecting) { io.unobserve(x.target); harfleriOynat(x.target); } }), { threshold: 0.4 });
    document.querySelectorAll('.bolum-baslik').forEach(h => (io ? io.observe(h) : harfleriOynat(h)));
  }
  filoKur();
  filtreKur();
  takvimiGetir();
  haftalariYaz();

  // WhatsApp clicks are counted in Google Analytics (the site's GA4 tag, added on the live build only)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="https://wa.me/"]');
    if (!a || typeof window.gtag !== 'function') return;
    const konum = a.dataset.konum || (a.closest('.alt-sabit') ? 'sabit' : a.closest('.hafta-yedek') ? 'hafta-yedek' : a.closest('#iletisim') ? 'son' : 'diger');
    window.gtag('event', 'whatsapp_tiklama', { sayfa: '2027', konum, link_url: a.href });
  });

  // Section photographs load only as their section nears the screen, so the opening stays light.
  const gorseller = [...document.querySelectorAll('.bolum-gorsel, .filo-gorsel')];
  const gorselYukle = pic => {
    pic.querySelectorAll('source[data-srcset]').forEach(s => { s.srcset = s.dataset.srcset; });
    const img = pic.querySelector('img');
    img.addEventListener('load', () => img.classList.add('yuklendi'), { once: true });
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
  };
  // The weeks section touches the opening's bottom edge, so watching starts only after the
  // first scroll, or once the opening has loaded and settled for a moment.
  let izleniyor = false;
  const izle = () => {
    if (izleniyor) return; izleniyor = true;
    if (!('IntersectionObserver' in window)) { gorseller.forEach(gorselYukle); return; }
    const io = new IntersectionObserver(girdiler => girdiler.forEach(g => {
      if (g.isIntersecting) { io.unobserve(g.target); gorselYukle(g.target); }
    }), { rootMargin: '0px 0px 500px 0px' });
    gorseller.forEach(p => io.observe(p));
  };
  addEventListener('scroll', izle, { once: true, passive: true });
  addEventListener('load', () => setTimeout(izle, 3500), { once: true });

  const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Browsers send a pointer move when the page changes under a cursor that has not moved.
  // Count a move only when the position really changed, so the opening never steers on its own.
  let sonImlec = null;
  const gercekHareket = e => {
    const once = sonImlec; sonImlec = [e.clientX, e.clientY];
    if (e.movementX || e.movementY) return true;
    return !!once && (once[0] !== e.clientX || once[1] !== e.clientY);
  };
  const ince = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Cards route to this page's own sections and never expand in place.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hedef = document.getElementById(a.getAttribute('href').slice(1));
    if (!hedef) return;
    e.preventDefault();
    const y = hedef.id === 'acilis' ? 0 : hedef.getBoundingClientRect().top + scrollY;
    scrollTo({ top: y, behavior: azHareket ? 'auto' : 'smooth' });
    if (hedef.id !== 'acilis') { hedef.setAttribute('tabindex', '-1'); hedef.focus({ preventScroll: true }); }
  });

  // Top bar turns solid once the opening has scrolled away.
  const kahraman = document.getElementById('acilis');
  const ustDurum = () => root.classList.toggle('kaydirildi', kahraman.getBoundingClientRect().bottom < innerHeight * 0.6);
  addEventListener('scroll', ustDurum, { passive: true });
  ustDurum();

  // Floating tiles are ornament on touch screens.
  if (!ince) document.querySelectorAll('.kutu > a').forEach(a => { a.tabIndex = -1; a.setAttribute('aria-hidden', 'true'); });

  // Final state only: poster plus headline, WhatsApp and "Haftaları görün".
  if (azHareket) {
    // still picture: stop the opening video on its poster
    const v = document.querySelector('.video.duz'); if (v) { v.removeAttribute('autoplay'); v.pause(); v.hidden = true; }
    root.classList.add('durgun'); return;
  }

  // ---------- the yacht: frame sequence on a canvas ----------
  // Tuning in one place. yon: 'pruva' = the bow turns toward the cursor / finger,
  // 'kamera' = the camera swings to that side (the yacht turns the other way).
  const AYAR = {
    mod: 'duz',          // 'duz' = the opening video simply plays (current choice) · older experiments below
    // mod: 'kamera',       // 'kamera' = the yacht stays centred; the camera swings up to ±20° around it, following the cursor
                         // 'genis' / 'index' = the two supplied index.html steerings, on the live bow video
    kameraAci: 20,       // kamera: largest swing either side of the bow, degrees (1 frame ≈ 1.5°)
    kameraTakipSn: 0.8,  // kamera: how long the camera takes to catch up with the cursor, s
    kameraEgri: 'power3.out',
    kameraElPx: 4,       // kamera: handheld drift so the picture never sits perfectly still, px
    kameraElDerece: 0.25,
                         // 'yon' = three live clips (port · bow · starboard), the cursor steers between them
    // index: values as in the supplied index.html
    indexLerp: 0.035,    // share of the remaining distance covered each frame
    indexDonus: 2.2,     // largest turn, degrees
    indexKaymaX: 18,     // largest sideways shift, px
    indexKaymaY: 10,     // largest up / down shift, px
    indexOlcek: 1.04,    // enlargement, on top of the 4% bleed on every side
                         // other modes kept for comparison: 'rota' · 'kareler' · 'takip' · 'uclu'
    yonTepkiSn: 0.9,     // yon: how long the "rudder" takes to settle on a new course, s
    yonSonum: 0.86,      // yon: damping (1 = none past the target, lower = a little carry-on)
    yonPay: 0.05,        // yon: margin at each third's edge, so a resting cursor never flickers
    // rota: the cursor only steers. Largest heading change, and how the "rudder" answers:
    rotaYawDerece: 4,    // left / right heading, degrees
    rotaPitchDerece: 2,  // up / down, degrees
    rotaRollDerece: 0.7, // slight heel against the turn, degrees
    rotaKaymaX: 0.025,   // course drift toward the cursor side, share of the width
    rotaKaymaY: 0.015,   // and up / down, share of the height
    rotaTepkiSn: 1.1,    // how long the rudder takes to settle on a new course, s
    rotaSonum: 0.82,     // damping: 1 = no overshoot, lower = a little inertia carry-on
    takipAlan: 0.6,      // takip: how far the bow may travel, as a share of the screen width (0.6 = ±30%)
    yon: 'pruva',
    takipSn: 0.6,        // kareler: how long the yacht takes to catch up with the cursor, s (GSAP)
    takipEgri: 'power3.out',
    donusSn: 1.4,        // kareler: return to the bow when the cursor leaves, s
    donusEgri: 'power2.inOut',
    dinlenMs: 350,       // kareler: how long the cursor rests before the camera drifts on, ms
    suruklenmeHiz: 3,    // kareler: drift speed at rest, frames per second (12 = real time, 3 = quarter speed)
    elKameraPx: 6,       // kareler: handheld pan / tilt, px
    elKameraDerece: 0.35,// kareler: handheld roll, degrees
    takipMs: 420,        // takip / uclu modes: follow time, ms
    donusMs: 1200,       // takip / uclu modes: return time, ms
    surukleKat: 1.1,     // touch: a full-width drag turns this many half-turns
    surukleBekle: 1200,  // touch: after a drag, wait this long before the camera drifts on, ms
  };
  const tuval = kahraman.querySelector('.tuval');
  const yatay = matchMedia('(min-aspect-ratio: 1/1)').matches;
  function karelerModu() {
  tuval.hidden = false;
  const poster = kahraman.querySelector('.poster');
  poster.querySelector('source').srcset = tuval.dataset.pruvaBilgisayar;
  poster.querySelector('img').src = tuval.dataset.pruvaTelefon;
  const ctx = tuval.getContext('2d');
  const SET = yatay ? tuval.dataset.bilgisayar : tuval.dataset.telefon;
  const N = +tuval.dataset.kare || 120;
  const ORTA = (N - 1) / 2;                 // the bow frame sits in the middle of the turn
  const isaret = AYAR.yon === 'kamera' ? -1 : 1;
  const kareler = new Array(N);

  // the bow frame is the poster file (already in cache); the other frames wait for the page's
  // load event so they never hold up the opening, then fill in outwards from the middle
  const PRUVA = yatay ? tuval.dataset.pruvaBilgisayar : tuval.dataset.pruvaTelefon;
  (function yukle() {
    const sira = [], goruldu = new Set();
    const ekle = i => { if (i >= 0 && i < N && !goruldu.has(i)) { goruldu.add(i); sira.push(i); } };
    ekle(Math.round(ORTA));
    for (const adimK of [16, 8, 4, 2, 1]) for (let d = 0; d <= N; d += adimK) { ekle(Math.round(ORTA) + d); ekle(Math.round(ORTA) - d); }
    let aktif = 0, k = 0;
    const sonraki = () => {
      while (aktif < 6 && k < sira.length) {
        const i = sira[k++], img = new Image();
        img.decoding = 'async'; aktif++;
        img.onload = () => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
          kareler[i] = img; aktif--; cizimIste(); sonraki();
          if (i === Math.round(ORTA)) { root.classList.add('tuval-hazir'); yaziyiBaslat(); }
        });
        img.onerror = () => { aktif--; sonraki(); };
        img.src = i === Math.round(ORTA) && PRUVA ? PRUVA : SET + String(i).padStart(3, '0') + '.webp';
      }
    };
    // bow now (sira[0]); the rest after load
    const geri = sira.splice(1);
    sonraki();
    const devamEt = () => { sira.push(...geri); sonraki(); };
    if (document.readyState === 'complete') devamEt(); else addEventListener('load', devamEt, { once: true });
  })();

  let W = 0, H = 0;
  function boyutla() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = tuval.width = Math.round(tuval.clientWidth * dpr);
    H = tuval.height = Math.round(tuval.clientHeight * dpr);
    cizilen = -1;
  }
  const enYakin = i => { for (let d = 0; d < N; d++) { if (kareler[i - d]) return i - d; if (kareler[i + d]) return i + d; } return -1; };
  function kareyiCiz(img, alfa) {
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alfa;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  // fractional positions crossfade the two neighbouring frames, so slow turns don't step
  let cizilen = -1;
  function ciz(konum) {
    const a = Math.floor(konum), f = konum - a;
    const anahtar = Math.round(konum * 40);
    if (anahtar === cizilen) return;
    const ia = enYakin(a), ib = enYakin(Math.min(N - 1, a + 1));
    if (ia < 0) return;
    cizilen = anahtar;
    kareyiCiz(kareler[ia], 1);
    if (ib >= 0 && ib !== ia && f > 0.02) kareyiCiz(kareler[ib], f);
    ctx.globalAlpha = 1;
  }

  // position follows a target with exponential smoothing; the target comes from cursor, drag or sway
  // GSAP moves the turn: every cursor move retargets one smooth tween (overwrite: 'auto'),
  // so the yacht glides after the cursor without steps or jolts. Without GSAP it simply jumps.
  const durum = { konum: ORTA };
  const sinirla = x => Math.max(0, Math.min(N - 1, x));
  const g = window.gsap;
  function cizimIste() { cizilen = -1; ciz(durum.konum); }
  const ciziver = () => ciz(durum.konum);
  function git(hedef, sure, egri) {
    hedef = sinirla(hedef);
    if (!g) { durum.konum = hedef; ciziver(); return; }
    g.to(durum, { konum: hedef, duration: sure, ease: egri, overwrite: 'auto', onUpdate: ciziver });
  }

  // ---------- never frozen, never cross-faded ----------
  // Every change of view is a real change of camera angle: only the orbit frames are used, no clip
  // ever fades over another. When the cursor (or finger) rests, the camera keeps orbiting slowly
  // forward from where it is, so the boat sails on and the water runs forward. A very light
  // handheld pan / tilt on top keeps the picture alive even at the end of the orbit.
  kahraman.querySelectorAll('.video[data-yon]').forEach(v => v.remove());
  let surukle = null, durgunSayac = null;
  function suruklen() {
    if (!g || durum.konum >= N - 1.01) return;
    const hiz = AYAR.suruklenmeHiz;                         // frames per second while resting
    const kalan = N - 1 - durum.konum;
    const isinma = Math.min(kalan, hiz * 0.6);
    surukle = g.timeline({ onUpdate: ciziver })
      .to(durum, { konum: durum.konum + isinma, duration: 1.2, ease: 'power1.in' })   // eases into the drift
      .to(durum, { konum: N - 1, duration: Math.max(0.1, (kalan - isinma) / hiz), ease: 'none' })
      .to(durum, { konum: N - 1, duration: 0 });
  }
  const hareket = () => { clearTimeout(durgunSayac); if (surukle) { surukle.kill(); surukle = null; } };
  const durunca = ms => { clearTimeout(durgunSayac); durgunSayac = setTimeout(suruklen, ms); };
  // handheld camera: slow, small, independent pan and tilt, so no two moments repeat exactly
  if (g) {
    g.set(tuval, { scale: 1.05, transformOrigin: '50% 50%' });
    const el = (ozellik, deger, sure) => g.to(tuval, { [ozellik]: deger, duration: sure, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    g.set(tuval, { x: -AYAR.elKameraPx, y: -AYAR.elKameraPx * 0.6, rotation: -AYAR.elKameraDerece });
    el('x', AYAR.elKameraPx, 7.3); el('y', AYAR.elKameraPx * 0.6, 9.1); el('rotation', AYAR.elKameraDerece, 11.7);
  }
  durunca(1500);                                             // the opening drifts on its own until touched

  // desktop: the cursor's horizontal position picks the heading
  if (ince) {
    kahraman.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      hareket();
      const x = e.clientX / innerWidth;         // 0 left edge … 1 right edge
      git(ORTA + (x - 0.5) * 2 * ORTA * isaret, AYAR.takipSn, AYAR.takipEgri);
      durunca(AYAR.dinlenMs);
    }, { passive: true });
    const geriDon = () => { hareket(); git(ORTA, AYAR.donusSn, AYAR.donusEgri); durunca(AYAR.donusSn * 1000 + 200); };
    kahraman.addEventListener('pointerleave', geriDon);
    document.addEventListener('mouseleave', geriDon);
  } else {
    // touch: a sideways drag turns the yacht; after release the camera drifts on from there
    const sahne = kahraman.querySelector('.sahne');
    let basX = null, basKonum = ORTA;
    sahne.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' || e.target.closest('a,button')) return;
      hareket(); basX = e.clientX; basKonum = durum.konum;
    });
    sahne.addEventListener('pointermove', e => {
      if (basX === null) return;
      const dx = (e.clientX - basX) / innerWidth;
      git(basKonum + dx * ORTA * 2 * AYAR.surukleKat * isaret, 0.35, 'power2.out');
    });
    const birak = () => { if (basX === null) return; basX = null; durunca(AYAR.surukleBekle); };
    ['pointerup', 'pointercancel'].forEach(t => sahne.addEventListener(t, birak));
  }

  boyutla();
  addEventListener('resize', () => { boyutla(); cizimIste(); });
  cizimIste();

  }

  // ---------- duz: the opening video just plays ----------
  function duzModu() {
    const v = kahraman.querySelector('.video.duz'); if (!v) return;
    v.muted = true;
    const basla = () => { root.classList.add('video-oynuyor'); yaziyiBaslat(); };
    if (!v.paused && v.readyState > 2) basla(); else v.addEventListener('playing', basla, { once: true });
    const p = v.play(); if (p && p.catch) p.catch(() => { if (!basladi) root.classList.add('durgun'); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && v.paused) v.play().catch(() => {}); });
  }

  // ---------- kamera: the camera swings around a fixed, centred yacht ----------
  // Frames come from the orbit video, so every change of view is a real change of camera angle.
  // Only the bow ±kameraAci part of the orbit is used. Each frame is shifted so the bow stem sits
  // exactly in the middle of the screen, which keeps the yacht still while the camera moves.
  function kameraModu() {
    const KARE_DERECE = 1.5;                        // the orbit turns 180° over its 120 frames
    const ORTA = 60, YARI = Math.round(AYAR.kameraAci / KARE_DERECE);
    const ILK = ORTA - YARI, SON = ORTA + YARI;
    // bow stem position in each frame, as a share of the frame width (measured: 0.35 at 47, 0.475 at 60, 0.60 at 73)
    const pruvaX = i => 0.475 + (i - ORTA) * 0.0096;
    const SET = tuval.dataset.bilgisayar;           // landscape frames for every screen; phones see a window around the stem
    const kareler = {};
    const ctx = tuval.getContext('2d');
    tuval.hidden = false;
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => v.remove());
    const poster = kahraman.querySelector('.poster');
    poster.querySelector('source').srcset = tuval.dataset.pruvaBilgisayar;
    poster.querySelector('img').src = tuval.dataset.pruvaBilgisayar;
    poster.querySelector('img').style.objectPosition = `${(pruvaX(ORTA) * 100).toFixed(1)}% 50%`;

    let W = 0, H = 0, olcek = 1, cizilen = '';
    function boyutla() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = tuval.width = Math.round(tuval.clientWidth * dpr);
      H = tuval.height = Math.round(tuval.clientHeight * dpr);
      // wide enough that shifting the stem to the centre never shows an edge
      const enBuyukKayma = Math.max(...[ILK, SON].map(i => Math.abs(0.5 - pruvaX(i))));
      const kapla = Math.max(W / 1280, H / 720);
      olcek = Math.max(kapla, W / (1 - 2 * enBuyukKayma) / 1280);
      cizilen = '';
      // the poster underneath gets the same framing, so nothing jumps when the canvas takes over
      poster.querySelector('img').style.transform = `scale(${(olcek / kapla).toFixed(4)})`;
    }
    function kareyiCiz(i, alfa) {
      const img = kareler[i]; if (!img) return false;
      const w = 1280 * olcek, h = 720 * olcek;
      const x = W / 2 - pruvaX(i) * w;              // the stem lands on the centre line
      ctx.globalAlpha = alfa; ctx.drawImage(img, x, (H - h) / 2, w, h); ctx.globalAlpha = 1;
      return true;
    }
    const enYakin = i => { for (let d = 0; d <= YARI * 2; d++) { if (kareler[i - d]) return i - d; if (kareler[i + d]) return i + d; } return -1; };
    const durum = { konum: ORTA };
    function ciz() {
      const a = Math.floor(durum.konum), f = durum.konum - a;
      const ia = enYakin(a), ib = enYakin(Math.min(SON, a + 1));
      if (ia < 0) return;
      const anahtar = `${ia}|${ib}|${f.toFixed(3)}|${W}`;
      if (anahtar === cizilen) return; cizilen = anahtar;
      kareyiCiz(ia, 1);
      if (ib !== ia && f > 0.01) kareyiCiz(ib, f);   // neighbouring frames cross-dissolve, so slow swings never step
    }

    // load the bow first (the poster file, already cached), then outwards, after the page has loaded
    const sira = [ORTA]; for (let d = 1; d <= YARI; d++) sira.push(ORTA + d, ORTA - d);
    const yukleKare = i => new Promise(res => {
      const img = new Image(); img.decoding = 'async';
      img.onload = () => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => { kareler[i] = img; cizilen = ''; ciz(); res(); });
      img.onerror = res;
      img.src = i === ORTA ? tuval.dataset.pruvaBilgisayar : SET + String(i).padStart(3, '0') + '.webp';
    });
    yukleKare(ORTA).then(() => { root.classList.add('tuval-hazir'); yaziyiBaslat(); });
    const geriKalan = async () => { for (let k = 1; k < sira.length; k += 4) await Promise.all(sira.slice(k, k + 4).map(yukleKare)); };
    if (document.readyState === 'complete') geriKalan(); else addEventListener('load', geriKalan, { once: true });

    const g = window.gsap;
    const git = (hedef, sure, egri) => {
      hedef = Math.max(ILK, Math.min(SON, hedef));
      if (!g) { durum.konum = hedef; ciz(); return; }
      g.to(durum, { konum: hedef, duration: sure, ease: egri, overwrite: 'auto', onUpdate: ciz });
    };
    // cursor to the right: the camera swings right around the yacht (lower frames); to the left, the other way
    const isaret = -1;
    if (ince) {
      kahraman.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || !gercekHareket(e)) return;
        git(ORTA + isaret * (e.clientX / innerWidth - 0.5) * 2 * YARI, AYAR.kameraTakipSn, AYAR.kameraEgri);
      }, { passive: true });
      // leaving keeps the last angle
    } else {
      const sahne = kahraman.querySelector('.sahne');
      let basX = null, basKonum = ORTA;
      sahne.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('a,button')) return; basX = e.clientX; basKonum = durum.konum; });
      sahne.addEventListener('pointermove', e => { if (basX === null) return; git(basKonum + isaret * (e.clientX - basX) / innerWidth * 2 * YARI, 0.35, 'power2.out'); });
      ['pointerup', 'pointercancel'].forEach(t => sahne.addEventListener(t, () => { basX = null; }));   // the angle stays
    }
    // a slow handheld drift keeps the picture alive while the angle is held
    if (g) {
      g.set(tuval, { transformOrigin: '50% 50%', scale: 1.02 });
      [['x', AYAR.kameraElPx, 7.3], ['y', AYAR.kameraElPx * 0.6, 9.1], ['rotation', AYAR.kameraElDerece, 11.7]].forEach(([oz, d, sure]) => {
        g.set(tuval, { [oz]: -d });
        g.to(tuval, { [oz]: d, duration: sure, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    }
    boyutla(); ciz();
    addEventListener('resize', () => { boyutla(); ciz(); });
  }

  // ---------- genis: the second supplied index.html ("wide cursor camera") on the live bow video ----------
  function genisModu() {
    tuval.hidden = true;
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => { if (v.dataset.yon !== 'pruva') v.remove(); });
    const video = kahraman.querySelector('.video[data-yon="pruva"]');
    root.classList.add('mod-genis');
    video.hidden = false; video.muted = true; video.loop = true; video.playsInline = true;
    video.src = yatay ? video.dataset.bilgisayar : video.dataset.telefon; video.preload = 'auto';
    video.addEventListener('playing', () => { video.classList.add('secili'); root.classList.add('video-oynuyor'); yaziyiBaslat(); }, { once: true });
    const p = video.play(); if (p && p.catch) p.catch(() => { if (!basladi) root.classList.add('durgun'); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && video.paused) video.play().catch(() => {}); });
    let hx = innerWidth / 2, hy = innerHeight / 2, cx = 0, cy = 0;
    kahraman.addEventListener('pointermove', e => { if (gercekHareket(e)) { hx = e.clientX; hy = e.clientY; } }, { passive: true });
    kahraman.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) { hx = t.clientX; hy = t.clientY; } }, { passive: true });
    (function adim() {
      const nx = hx / innerWidth - 0.5, ny = hy / innerHeight - 0.5;
      cx += (-nx * innerWidth * 0.13 - cx) * 0.055; cy += (-ny * innerHeight * 0.11 - cy) * 0.055;
      video.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0) rotate(${(nx * 1.15).toFixed(3)}deg) scale(1.075)`;
      requestAnimationFrame(adim);
    })();
  }

  // ---------- index: the supplied index.html steering, on the live bow video ----------
  // The video always plays forward and is never paused or scrubbed by the visitor. The pointer
  // sets a target; every frame the current point covers a fixed share of the gap (lerp), and the
  // picture shifts and turns slightly toward it. When the pointer stops or leaves, it stays put.
  function indexModu() {
    tuval.hidden = true;
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => { if (v.dataset.yon !== 'pruva') v.remove(); });
    const video = kahraman.querySelector('.video[data-yon="pruva"]');
    root.classList.add('mod-index');
    video.hidden = false; video.muted = true; video.loop = true; video.playsInline = true;
    video.src = yatay ? video.dataset.bilgisayar : video.dataset.telefon;
    video.preload = 'auto';
    video.addEventListener('playing', () => { video.classList.add('secili'); root.classList.add('video-oynuyor'); yaziyiBaslat(); }, { once: true });
    const oynat = () => { const p = video.play(); if (p && p.catch) p.catch(() => { if (!basladi) root.classList.add('durgun'); }); };
    oynat();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && video.paused) oynat(); });

    let hedefX = innerWidth * 0.72, hedefY = innerHeight * 0.52, x = hedefX, y = hedefY;
    const nokta = ince ? document.querySelector('.imlec-nokta') : null;
    const isaretle = (cx, cy) => {
      hedefX = cx; hedefY = cy;
      if (nokta) nokta.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
    };
    kahraman.addEventListener('pointermove', e => isaretle(e.clientX, e.clientY), { passive: true });
    kahraman.addEventListener('pointerenter', () => nokta && nokta.classList.add('gorunur'));
    kahraman.addEventListener('pointerleave', () => nokta && nokta.classList.remove('gorunur'));   // the course stays
    kahraman.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) isaretle(t.clientX, t.clientY); }, { passive: true });
    (function adim() {
      x += (hedefX - x) * AYAR.indexLerp;
      y += (hedefY - y) * AYAR.indexLerp;
      const dx = (x - innerWidth * 0.58) / (innerWidth * 0.42);
      const dy = (y - innerHeight * 0.5) / (innerHeight * 0.5);
      const don = Math.max(-AYAR.indexDonus, Math.min(AYAR.indexDonus, dx * AYAR.indexDonus));
      const tx = Math.max(-AYAR.indexKaymaX, Math.min(AYAR.indexKaymaX, dx * AYAR.indexKaymaX));
      const ty = Math.max(-AYAR.indexKaymaY, Math.min(AYAR.indexKaymaY, dy * AYAR.indexKaymaY));
      video.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${don.toFixed(3)}deg) scale(${AYAR.indexOlcek})`;
      requestAnimationFrame(adim);
    })();
  }

  // ---------- yon: three live clips, steered like a rudder ----------
  // Port, bow and starboard clips all play forward together, all the time; the visitor never
  // pauses them or changes their speed. The cursor (or a sideways drag) only sets the course:
  // left third = port, middle = bow, right third = starboard. A lightly damped spring carries the
  // course there, and the course decides how much of a side clip shows over the bow clip. The bow
  // clip stays fully opaque underneath, so a change never dims or flashes. The last course is kept
  // when the cursor rests or leaves. Until both side clips are playing, the course stays on the bow.
  function yonModu() {
    tuval.hidden = true;
    const klip = {};
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => {
      klip[v.dataset.yon] = v; v.hidden = false; v.muted = true; v.loop = true; v.playsInline = true;
    });
    const kaynak = v => (yatay ? v.dataset.bilgisayar : v.dataset.telefon);
    const oynat = v => { const p = v.play(); return p && p.catch ? p : Promise.resolve(); };
    const pruva = klip.pruva;
    pruva.classList.add('taban');
    pruva.src = kaynak(pruva); pruva.preload = 'auto';
    pruva.addEventListener('playing', () => { pruva.classList.add('secili'); root.classList.add('video-oynuyor'); yaziyiBaslat(); }, { once: true });
    oynat(pruva).catch(() => { if (!basladi) root.classList.add('durgun'); });

    let yanHazir = false;
    const yanlar = ['iskele', 'sancak'].map(ad => klip[ad]).filter(Boolean);
    const yanlariYukle = () => {
      let kalan = yanlar.length;
      yanlar.forEach(v => {
        v.src = kaynak(v); v.preload = 'auto';
        v.addEventListener('playing', () => { if (--kalan === 0) { yanHazir = true; iste(); } }, { once: true });
        oynat(v).catch(() => {});
      });
    };
    pruva.addEventListener('playing', () => {
      if (document.readyState === 'complete') yanlariYukle(); else addEventListener('load', yanlariYukle, { once: true });
    }, { once: true });
    // keep sailing: if the browser pauses a clip (tab switch, power saving), start it again
    document.addEventListener('visibilitychange', () => { if (!document.hidden) Object.values(klip).forEach(v => v.src && v.paused && oynat(v).catch(() => {})); });

    // course: -1 port … 0 bow … +1 starboard
    let hedef = 0, rota = 0, donus = 0, son = performance.now(), dongu = 0;
    const iste = () => { if (!dongu) { son = performance.now(); dongu = requestAnimationFrame(adim); } };
    const yumusak = t => t * t * (3 - 2 * t);
    function adim(t) {
      dongu = 0;
      let dt = Math.min(0.05, Math.max(0, (t - son) / 1000)); son = t;
      const amac = yanHazir ? hedef : 0;
      const w = 4 / AYAR.yonTepkiSn, z = AYAR.yonSonum;
      while (dt > 0) { const h = Math.min(dt, 1 / 120); dt -= h; donus += (w * w * (amac - rota) - 2 * z * w * donus) * h; rota += donus * h; }
      rota = Math.max(-1, Math.min(1, rota));
      if (klip.iskele) klip.iskele.style.opacity = yumusak(Math.max(0, -rota)).toFixed(3);
      if (klip.sancak) klip.sancak.style.opacity = yumusak(Math.max(0, rota)).toFixed(3);
      if (Math.abs(amac - rota) > 0.001 || Math.abs(donus) > 0.001) iste();
    }
    // thirds with a margin: the course only changes once the pointer is clearly inside another third
    const bolge = (x, simdiki) => {
      const p = AYAR.yonPay, sol = 1 / 3, sag = 2 / 3;
      if (simdiki === -1) return x < sol + p ? -1 : x > sag + p ? 1 : 0;
      if (simdiki === 1) return x > sag - p ? 1 : x < sol - p ? -1 : 0;
      return x < sol - p ? -1 : x > sag + p ? 1 : 0;
    };
    if (ince) {
      kahraman.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        if (!gercekHareket(e)) return;   // see gercekHareket: the opening always starts on the bow
        const yeni = bolge(e.clientX / innerWidth, hedef);
        if (yeni !== hedef) { hedef = yeni; iste(); }
      }, { passive: true });
      // leaving the window keeps the last course
    } else {
      // touch: a sideways drag steers one third at a time; release keeps the course
      const sahne = kahraman.querySelector('.sahne');
      let basX = null, basHedef = 0;
      sahne.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('a,button')) return; basX = e.clientX; basHedef = hedef; });
      sahne.addEventListener('pointermove', e => {
        if (basX === null) return;
        const dx = (e.clientX - basX) / innerWidth;
        const adimSay = dx <= -0.4 ? -2 : dx <= -0.12 ? -1 : dx >= 0.4 ? 2 : dx >= 0.12 ? 1 : 0;
        const yeni = Math.max(-1, Math.min(1, basHedef + adimSay));
        if (yeni !== hedef) { hedef = yeni; iste(); }
      });
      ['pointerup', 'pointercancel'].forEach(t => sahne.addEventListener(t, () => { basX = null; }));
    }
    iste();
  }

  // ---------- rota: the live bow video, steered by the cursor ----------
  // The video always plays forward (autoplay, muted, loop) and nothing the visitor does pauses it.
  // The cursor (or finger) sets a target course; a lightly damped spring brings the yacht's heading
  // there with a little delay and carry-on, like a rudder. When the cursor stops or leaves, the last
  // course is kept and the yacht sails on. The cursor never touches speed or progress.
  function rotaModu() {
    tuval.hidden = true;
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => { if (v.dataset.yon !== 'pruva') v.remove(); });
    const video = kahraman.querySelector('.video[data-yon="pruva"]');
    video.hidden = false; video.muted = true; video.loop = true; video.playsInline = true;
    video.src = yatay ? video.dataset.bilgisayar : video.dataset.telefon;
    video.preload = 'auto';
    video.addEventListener('playing', () => { video.classList.add('secili'); root.classList.add('video-oynuyor'); yaziyiBaslat(); }, { once: true });
    const oynat = () => { const p = video.play(); if (p && p.catch) p.catch(() => { if (!basladi) root.classList.add('durgun'); }); };
    oynat();
    // keep sailing: if the browser pauses it (tab switch, power saving), start again when possible
    document.addEventListener('visibilitychange', () => { if (!document.hidden && video.paused) oynat(); });
    video.addEventListener('pause', () => { if (!document.hidden) setTimeout(() => video.paused && oynat(), 300); });

    // course: target (from the pointer) and current (heading + rate of turn), both -1 … 1 per axis
    const hedef = { x: 0, y: 0 }, rota = { x: 0, y: 0 }, donus = { x: 0, y: 0 };
    let son = performance.now(), dongu = 0, W = innerWidth, H = innerHeight;
    addEventListener('resize', () => { W = innerWidth; H = innerHeight; iste(); });
    const iste = () => { if (!dongu) { son = performance.now(); dongu = requestAnimationFrame(adim); } };
    function adim(t) {
      dongu = 0;
      let dt = Math.min(0.05, Math.max(0, (t - son) / 1000)); son = t;
      const w = 4 / AYAR.rotaTepkiSn, z = AYAR.rotaSonum;     // spring stiffness and damping
      while (dt > 0) {
        const h = Math.min(dt, 1 / 120); dt -= h;
        for (const e of ['x', 'y']) {
          donus[e] += (w * w * (hedef[e] - rota[e]) - 2 * z * w * donus[e]) * h;
          rota[e] += donus[e] * h;
        }
      }
      const x = rota.x, y = rota.y;
      video.style.transform =
        `perspective(1400px) translate3d(${(x * AYAR.rotaKaymaX * W).toFixed(1)}px,${(y * AYAR.rotaKaymaY * H).toFixed(1)}px,0) ` +
        `rotateY(${(x * AYAR.rotaYawDerece).toFixed(3)}deg) rotateX(${(-y * AYAR.rotaPitchDerece).toFixed(3)}deg) ` +
        `rotateZ(${(-x * AYAR.rotaRollDerece).toFixed(3)}deg) scale(1.12)`;
      const hareketli = Math.abs(hedef.x - x) + Math.abs(hedef.y - y) > 0.0005 || Math.abs(donus.x) + Math.abs(donus.y) > 0.0005;
      if (hareketli) iste();
    }
    adim(son);
    // pointer position relative to the middle of the opening becomes the target course
    const rotaAyarla = (cx, cy) => {
      hedef.x = Math.max(-1, Math.min(1, (cx / W - 0.5) * 2));
      hedef.y = Math.max(-1, Math.min(1, (cy / H - 0.5) * 2));
      iste();
    };
    if (ince) {
      kahraman.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') rotaAyarla(e.clientX, e.clientY); }, { passive: true });
      // leaving the window keeps the last course: nothing to do
    } else {
      const sahne = kahraman.querySelector('.sahne');
      let parmak = false;
      sahne.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('a,button')) return; parmak = true; rotaAyarla(e.clientX, e.clientY); });
      sahne.addEventListener('pointermove', e => { if (parmak) rotaAyarla(e.clientX, e.clientY); });
      ['pointerup', 'pointercancel'].forEach(t => sahne.addEventListener(t, () => { parmak = false; }));   // the course stays
    }
  }

  // ---------- bow follows the cursor ----------
  // The bow is treated as a point: cursor (or finger) to the right, the yacht slides right; to the left,
  // it slides left. The bow clip keeps playing forward throughout. The picture is enlarged just enough
  // that its edges never show at the farthest position.
  function takipModu() {
    tuval.hidden = true;
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => { if (v.dataset.yon !== 'pruva') v.remove(); });
    const video = kahraman.querySelector('.video[data-yon="pruva"]');
    video.hidden = false; video.muted = true;
    video.src = yatay ? video.dataset.bilgisayar : video.dataset.telefon;
    video.preload = 'auto';
    video.addEventListener('playing', () => { video.classList.add('secili'); root.classList.add('video-oynuyor'); yaziyiBaslat(); }, { once: true });
    const oynat = video.play();
    if (oynat && oynat.catch) oynat.catch(() => { if (!basladi) root.classList.add('durgun'); });

    // the element's own box is what gets enlarged and moved, so it must stay wider than the screen
    // by the full travel on both sides; the poster underneath gets the same size so nothing jumps
    const poster = kahraman.querySelector('.poster img');
    let enBuyuk = 0, olcek = 1;
    function olc() {
      const W = kahraman.clientWidth;
      enBuyuk = W * AYAR.takipAlan / 2;
      olcek = (W + 2 * enBuyuk) / W;
      poster.style.transform = `scale(${olcek.toFixed(4)})`;
    }
    video.addEventListener('loadedmetadata', () => { olc(); iste(); });
    addEventListener('resize', () => { olc(); iste(); });
    olc();

    // critically damped spring: eases in, eases out, never overshoots or jolts
    let x = 0, hiz = 0, hedef = 0, sabit = AYAR.takipMs, son = performance.now(), dongu = 0;
    const iste = () => { if (!dongu) { son = performance.now(); dongu = requestAnimationFrame(adim); } };
    function adim(t) {
      dongu = 0;
      let dt = Math.min(48, Math.max(0, t - son)) / 1000; son = t;
      const w = 2.2 / (sabit / 1000);                         // stiffness from the time constant
      while (dt > 0) {                                        // small steps keep the spring stable
        const h = Math.min(dt, 1 / 120); dt -= h;
        hiz += (w * w * (hedef - x) - 2 * w * hiz) * h;
        x += hiz * h;
      }
      video.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scale(${olcek.toFixed(4)})`;
      if (Math.abs(hedef - x) > 0.2 || Math.abs(hiz) > 0.5) iste();
    }
    const sinirla = v => Math.max(-enBuyuk, Math.min(enBuyuk, v));
    adim(son);

    if (ince) {
      kahraman.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        hedef = sinirla(e.clientX - kahraman.clientWidth / 2);   // the bow heads for the cursor
        sabit = AYAR.takipMs; iste();
      }, { passive: true });
      const ortala = () => { hedef = 0; sabit = AYAR.donusMs; iste(); };
      kahraman.addEventListener('pointerleave', ortala);
      document.addEventListener('mouseleave', ortala);
    } else {
      // touch: the yacht follows a sideways drag and drifts back to the middle a little after release
      const sahne = kahraman.querySelector('.sahne');
      let basX = null, basKonum = 0, donus = 0;
      sahne.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('a,button')) return; basX = e.clientX; basKonum = x; clearTimeout(donus); });
      sahne.addEventListener('pointermove', e => { if (basX === null) return; hedef = sinirla(basKonum + (e.clientX - basX)); sabit = 160; iste(); });
      const birak = () => { if (basX === null) return; basX = null; donus = setTimeout(() => { hedef = 0; sabit = AYAR.donusMs; iste(); }, AYAR.surukleBekle); };
      ['pointerup', 'pointercancel'].forEach(t => sahne.addEventListener(t, birak));
    }
  }

  // ---------- three clips: port · bow · starboard ----------
  // All three play forward together (the water never stops or runs back). The cursor's
  // horizontal position (desktop) or a sideways drag (touch) picks which one is visible;
  // the change is a cross-fade. The bow loads first; switching waits until the other two can play.
  function ucluMod() {
    tuval.hidden = true;
    const klip = {};
    kahraman.querySelectorAll('.video[data-yon]').forEach(v => { klip[v.dataset.yon] = v; v.hidden = false; v.muted = true; });
    const kaynak = v => (yatay ? v.dataset.bilgisayar : v.dataset.telefon);
    let secili = 'pruva', hazir = false;
    const goster = yon => {
      if (!hazir && yon !== 'pruva') return;
      if (yon === secili) return;
      secili = yon;
      Object.entries(klip).forEach(([ad, v]) => v.classList.toggle('secili', ad === yon));
    };

    const pruva = klip.pruva;
    pruva.src = kaynak(pruva); pruva.preload = 'auto';
    pruva.addEventListener('playing', () => { pruva.classList.add('secili'); root.classList.add('video-oynuyor'); yaziyiBaslat(); }, { once: true });
    const oynat = pruva.play();
    if (oynat && oynat.catch) oynat.catch(() => { if (!basladi) root.classList.add('durgun'); });

    // the side clips follow once the bow is running and the page has loaded
    const yanlar = ['iskele', 'sancak'].map(ad => klip[ad]).filter(Boolean);
    const yanlariYukle = () => {
      let kalan = yanlar.length;
      yanlar.forEach(v => {
        v.src = kaynak(v); v.preload = 'auto';
        v.addEventListener('playing', () => { if (--kalan === 0) hazir = true; }, { once: true });
        const p = v.play(); if (p && p.catch) p.catch(() => {});
      });
    };
    pruva.addEventListener('playing', () => {
      if (document.readyState === 'complete') yanlariYukle(); else addEventListener('load', yanlariYukle, { once: true });
    }, { once: true });

    // thirds with a margin at each boundary, so a cursor resting on a line doesn't flicker
    const PAY = 0.04;
    const bolge = (x, simdiki) => {
      const sol = 1 / 3, sag = 2 / 3;
      if (simdiki === 'iskele') return x < sol + PAY ? 'iskele' : x > sag + PAY ? 'sancak' : 'pruva';
      if (simdiki === 'sancak') return x > sag - PAY ? 'sancak' : x < sol - PAY ? 'iskele' : 'pruva';
      return x < sol - PAY ? 'iskele' : x > sag + PAY ? 'sancak' : 'pruva';
    };
    if (ince) {
      kahraman.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') goster(bolge(e.clientX / innerWidth, secili)); }, { passive: true });
      const pruvayaDon = () => goster('pruva');
      kahraman.addEventListener('pointerleave', pruvayaDon);
      document.addEventListener('mouseleave', pruvayaDon);
    } else {
      // touch: drag left = port, drag right = starboard; back to the bow a little after release
      const sahne = kahraman.querySelector('.sahne');
      let basX = null, donus = 0;
      sahne.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('a,button')) return; basX = e.clientX; clearTimeout(donus); });
      sahne.addEventListener('pointermove', e => {
        if (basX === null) return;
        const dx = (e.clientX - basX) / innerWidth;
        goster(dx < -0.12 ? 'iskele' : dx > 0.12 ? 'sancak' : 'pruva');
      });
      const birak = () => { if (basX === null) return; basX = null; donus = setTimeout(() => goster('pruva'), AYAR.surukleBekle); };
      ['pointerup', 'pointercancel'].forEach(t => sahne.addEventListener(t, birak));
    }
  }

  // ---------- text timeline ----------
  // Runs on its own clock, independent of the yacht. Timings come from stil.css :root.
  // Read when the sequence starts (the stylesheet may still be arriving when this script runs);
  // the fallbacks match the :root values.
  const sn = (ad, yedek) => { const v = parseFloat(getComputedStyle(root).getPropertyValue(ad)); return Number.isFinite(v) && v > 0 ? v * 1000 : yedek; };
  const SURE = {};
  const sureleriOku = () => Object.assign(SURE, { sahne: sn('--sahne-sure', 5500), dahil: sn('--dahil-sure', 6500), gecis: sn('--gecis', 900), kademe: sn('--kademe', 120) });
  const SAHNE_SAYISI = 3;
  const ogeler = n => [...kahraman.querySelectorAll('[data-sahne="' + n + '"]')].filter(el => !el.hidden);
  const basliklar = [...kahraman.querySelectorAll('.son-kalir')];
  const sonGelir = [...kahraman.querySelectorAll('.son-gelir')];
  const noktalar = [...kahraman.querySelectorAll('.nokta-dugme')];

  // one pause-aware timer drives every step
  let zamanlayici = 0, kalan = 0, adim = null, hedefZaman = 0, duraklatildi = false;
  const programla = (fn, ms) => { clearTimeout(zamanlayici); adim = fn; kalan = ms; if (!duraklatildi) { hedefZaman = performance.now() + ms; zamanlayici = setTimeout(fn, ms); } };
  const duraklat = () => { if (duraklatildi || !adim) return; duraklatildi = true; root.classList.add('duraklatildi'); clearTimeout(zamanlayici); kalan = Math.max(0, hedefZaman - performance.now()); };
  const devam = () => { if (!duraklatildi) return; duraklatildi = false; root.classList.remove('duraklatildi'); if (adim) { hedefZaman = performance.now() + kalan; zamanlayici = setTimeout(adim, kalan); } };

  const goster = (els, gecikmeli = true) => els.forEach((el, k) => {
    el.style.setProperty('--gecikme', el.dataset.gecikme ? el.dataset.gecikme + 'ms' : gecikmeli ? (k * SURE.kademe) + 'ms' : '0ms');
    el.classList.remove('cikti'); el.classList.add('gorunur');
    if (harfDalgasi) harfleriOynat(el);
  });
  const gizle = els => els.forEach(el => {
    el.style.setProperty('--gecikme', '0ms');
    if (el.classList.contains('gorunur')) { el.classList.remove('gorunur'); el.classList.add('cikti'); }
  });

  let aktifSahne = 0;
  function sahneyeGec(n) {
    // leave whatever is showing, bring scene n in, hold it fully visible, move on
    for (let i = 1; i <= SAHNE_SAYISI; i++) if (i !== n) gizle(ogeler(i));
    root.classList.remove('son-durum');
    gizle(sonGelir);
    if (n !== 1) gizle(basliklar);
    for (let i = 1; i <= SAHNE_SAYISI; i++) root.classList.toggle('sahne-' + i, i === n);
    aktifSahne = n;
    noktalar.forEach(d => d.toggleAttribute('aria-current', false));
    if (noktalar[n - 1]) noktalar[n - 1].setAttribute('aria-current', 'step');
    const els = ogeler(n);
    goster(els);
    const enGec = Math.max(0, ...els.map(el => +el.dataset.gecikme || 0));
    const tamGorunur = SURE.gecis + Math.max(enGec + 900, (els.length - 1) * SURE.kademe);   // +900: the letter wave settling
    const bekle = n === 2 ? SURE.dahil : SURE.sahne;
    programla(() => (n < SAHNE_SAYISI ? sahneyeGec(n + 1) : sonDurum()), tamGorunur + bekle);
  }
  function sonDurum() {
    gizle(ogeler(aktifSahne));
    for (let i = 1; i <= SAHNE_SAYISI; i++) root.classList.remove('sahne-' + i);
    aktifSahne = 0; adim = null;
    noktalar.forEach(d => d.toggleAttribute('aria-current', false));
    goster(basliklar); goster(sonGelir);
    root.classList.add('son-durum');
  }

  let basladi = false;
  const yaziyiBaslat = () => {
    if (basladi) return; basladi = true;
    sureleriOku();
    kahraman.querySelector('.noktalar').hidden = false;
    sahneyeGec(1);
  };
  // start the chosen stage; the text starts once the yacht is on screen, or after a short wait over the poster
  ({ duz: duzModu, kamera: kameraModu, genis: genisModu, index: indexModu, yon: yonModu, rota: rotaModu, kareler: karelerModu, uclu: ucluMod, takip: takipModu }[AYAR.mod] || duzModu)();
  setTimeout(yaziyiBaslat, 1200);

  // dots jump to a scene and the sequence carries on from there
  noktalar.forEach(d => d.addEventListener('click', () => { devam(); sahneyeGec(+d.dataset.git); }));

  // hold the text while the visitor reads: touch anywhere on the opening, or rest the cursor on the text
  kahraman.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && !e.target.closest('.nokta-dugme')) duraklat(); });
  ['pointerup', 'pointercancel'].forEach(t => kahraman.addEventListener(t, e => { if (e.pointerType !== 'mouse') devam(); }));
  kahraman.addEventListener('pointerover', e => { if (e.pointerType === 'mouse' && e.target.closest('.anim.gorunur')) duraklat(); });
  kahraman.addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && e.target.closest('.anim') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.anim.gorunur'))) devam(); });

  // Desktop only: cards and tiles also lean a few px with the cursor.
  if (ince) {
    const egilenler = [...kahraman.querySelectorAll('.egil')];
    let istek = 0;
    kahraman.addEventListener('pointermove', e => {
      const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
      cancelAnimationFrame(istek);
      istek = requestAnimationFrame(() => {
        egilenler.forEach(el => {
          const k = el.classList.contains('kutu-liste') ? 10 : 8;
          el.style.transform = `translate3d(${(x * k).toFixed(1)}px,${(y * k).toFixed(1)}px,0)`;
        });
      });
    }, { passive: true });
    kahraman.addEventListener('pointerleave', () => egilenler.forEach(el => { el.style.transform = ''; }));
  }
})();
