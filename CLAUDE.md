# Freya Yachting — freyayachting.com

## Ne işe yarıyor
Freya Yachting'in (Bavaria Cruiser 46 charter, Ecesaray Marina/Fethiye) müşteriye
dönük tanıtım/rezervasyon sitesi. Ana özelliği: haftalık müsaitlik takvimini
gösteren booking widget (`freya-musaitlik.js`).

## Önemli mimari karar (24 Ağu 2026)
Booking widget artık müsaitlik/fiyat verisini **finans.freyayachting.com**
panelinin arkasındaki Firebase Realtime Database'den okuyor — eski Google
Sheets + n8n webhook akışı tamamen bırakıldı, artık kullanılmıyor.

Veri kaynağı (public, auth gerektirmez):
```
GET https://freya-finans-default-rtdb.europe-west1.firebasedatabase.app/shared/musaitlik-public.json
```

Dönen format:
```json
{ "2027-05-01": { "durum": "bos|ozel|dolu", "fiyat": 2425 }, ... }
```

- `durum`: `bos` = müsait, `dolu` = kesin rezervasyon, `ozel` = opsiyon/tentatif
  (widget'ta farklı renkle, "özel teklif" gibi gösteriliyor)
- `fiyat`: o haftanın € cinsinden fiyatı — artık burada güncel tutuluyor,
  sitede ayrı/statik bir fiyat tablosu olmamalı

## Widget davranışı (freya-musaitlik.js)
- Geçmiş haftaları filtreler (bugünden önceki haftaları göstermez)
- 5 dakikalık localStorage cache kullanır (her istekte Firebase'e gitmez)
- Fetch başarısız olursa veya veri boşsa WhatsApp fallback'ine düşer
  ("müsaitlik için WhatsApp'tan sor" gibi bir mesaj/link gösterir)
- Fonksiyonel testlerle doğrulanmış: geçmiş hafta filtreleme, cache
  hit/miss, fetch hata fallback'i, boş veri fallback'i

## Dikkat edilmesi gerekenler
- Bu widget'ın veri kaynağını değiştirirken finans.freyayachting.com
  tarafındaki `shared/musaitlik-public` yazma mantığına (finans-web
  reposu, `musaitlikOzetiCikar()` fonksiyonu) dokunmadığından emin ol —
  iki repo birbirine bu path üzerinden bağlı.
- Firebase endpoint'i herkese açık okunur ama sadece bu tek path için;
  başka bir path'e genişletme (finansal veri barındıran diğer yollar
  auth gerektiriyor, kasıtlı olarak kapalı tutuluyor).
- Repo'nun gerçek dosya/klasör yapısı (home.js/main.js, build sistemi
  varsa hangisi, deploy yöntemi) bu dosyaya henüz eklenmedi — ilk fırsatta
  gerçek yapıya göre güncelle, burada tahmini/hatırlanan bilgiler var.

## TODO (bu dosyayı tamamlamak için)
- Gerçek build/deploy komutlarını ekle (statik mi, bir framework mi kullanıyor?)
- Domain/hosting bilgisini ekle (GitHub Pages mi, başka bir yer mi?)
- Widget dosyasının gerçek yolunu doğrula
