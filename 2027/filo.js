// Fleet data. One line per boat; the fleet grid and the weeks filter are built from this.
// durum: 'aktif' (shown with details and weeks); 'yakinda' (not confirmed yet) and 'pasif' (not for charter) are not shown.
// sayfa: the boat's page on freyayachting.com; its card opens it (new tab).
// dil: language of the boat's name when it is not Turkish (keeps 'Life Is Beautiful' from becoming 'LİFE')
// saat: [TR, EN] check-in / check-out line when it differs from Freya's (boats other than Freya: Saturday 15:00 – the following Saturday 09:00).
// takvim: 'sor' = no calendar, the weeks list shows an 'ask about availability' button instead.
// takvim: 'canli' = weeks come from the live calendar (shared/musaitlik-public.json, the same source
//   freya-musaitlik.js reads); only 'bos' weeks are listed. That calendar is Freya's.
// vitrin: the only weeks listed on /2027 (promotion or priority sale), date -> short note; shown while still 'bos'.
//   The full calendar is one link away (freya.html).
// 'yakinda' lines keep a slot for boats not yet confirmed (the grid is laid out for up to 5): each shows as a 'Yakında' tile, no name.
window.FILO = [
  { id: 'freya', ad: 'Freya', durum: 'aktif', amiral: true, model: 'Bavaria Cruiser 46', yil: 2024, kabin: 4, wc: 3, kisi: 7, fiyat: 2425, sayfa: 'https://freyayachting.com/freya.html', takvim: 'canli', vitrin: {} },   // e.g. vitrin: { '2027-05-01': 'Erken rezervasyon fiyatı' }
  { id: 'life-is-beautiful', ad: 'Life Is Beautiful', dil: 'en', durum: 'pasif', model: 'Bavaria Cruiser 46', yil: 2024 },   // not for charter in 2027; removed from freyayachting.com on 2 Oct 2026
  { id: 'beneteau-oceanis-423', ad: 'Beneteau Oceanis 423', dil: 'en', durum: 'aktif', model: 'Beneteau Oceanis Clipper 423', yil: 2007, kabin: 3, wc: 2, kisi: 6, fiyat: 1800, sayfa: 'https://freyayachting.com/beneteau-oceanis-423.html', takvim: 'sor', saat: ['Cumartesi 15:00 – Cumartesi 09:00', 'Saturday 15:00 – Saturday 09:00'] },   // bareboat; no calendar: 'Müsaitliği sorun' button instead of weeks (Tolga, 29 Oct 2026)
  { id: 'tekne-4', ad: 'Yeni tekne', durum: 'yakinda' },
  { id: 'tekne-5', ad: 'Yeni tekne', durum: 'yakinda' },
  { id: 'tekne-6', ad: 'Yeni tekne', durum: 'yakinda' },
];
