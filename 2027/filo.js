// Fleet data. One line per boat; the fleet grid and the weeks filter are built from this.
// durum: 'aktif' (shown with details and weeks); 'yakinda' (not confirmed yet) and 'pasif' (not for charter) are not shown.
// sayfa: the boat's page on freyayachting.com; its card opens it (new tab).
// dil: language of the boat's name when it is not Turkish (keeps 'Life Is Beautiful' from becoming 'LİFE')
// takvim: 'canli' = weeks come from the live calendar (shared/musaitlik-public.json, the same source
//   freya-musaitlik.js reads); only 'bos' weeks are listed. That calendar is Freya's.
// 'yakinda' lines keep a slot for boats not yet confirmed (the grid is laid out for up to 5).
window.FILO = [
  { id: 'freya', ad: 'Freya', durum: 'aktif', amiral: true, model: 'Bavaria Cruiser 46', yil: 2024, kabin: 4, wc: 3, kisi: 7, fiyat: 2425, sayfa: 'https://freyayachting.com/freya.html', takvim: 'canli' },
  { id: 'life-is-beautiful', ad: 'Life Is Beautiful', dil: 'en', durum: 'pasif', model: 'Bavaria Cruiser 46', yil: 2024 },   // not for charter in 2027; removed from freyayachting.com on 2 Oct 2026
  { id: 'derin', ad: 'Derin', durum: 'yakinda', model: 'Beneteau Clipper 423', yil: 2007, sayfa: 'https://freyayachting.com/derin.html' },   // status not settled yet: hidden until it is
  { id: 'tekne-4', ad: 'Yeni tekne', durum: 'yakinda' },
  { id: 'tekne-5', ad: 'Yeni tekne', durum: 'yakinda' },
];
