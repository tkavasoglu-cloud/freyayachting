# freya-offer.html — SEO Güncellemeleri

## 1. `<head>` Bölümüne Eklenecek Meta Taglar

Mevcut `<title>` satırını (muhtemelen "Freya Yachting") bulun ve aşağıdakiyle DEĞİŞTİRİN:

```html
<title>Teklif Al — Fethiye & Göcek Yelkenli Yat Kiralama | Freya Yachting</title>
<meta name="description" content="Freya Yachting ile Fethiye ve Göcek'te yelkenli yat kiralama teklifi alın. Bavaria Cruiser 46 ve Beneteau Clipper 423 teknelerimiz ile unutulmaz bir tatil planlayın.">
<link rel="canonical" href="https://www.freyayachting.com/freya-offer.html">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="Teklif Al — Fethiye & Göcek Yelkenli Yat Kiralama | Freya Yachting">
<meta property="og:description" content="Freya Yachting ile Fethiye ve Göcek'te yelkenli yat kiralama teklifi alın. Hemen online fiyat hesaplayın.">
<meta property="og:url" content="https://www.freyayachting.com/freya-offer.html">
<meta property="og:site_name" content="Freya Yachting">
<meta property="og:locale" content="tr_TR">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:locale:alternate" content="ru_RU">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Teklif Al — Yelkenli Yat Kiralama | Freya Yachting">
<meta name="twitter:description" content="Fethiye ve Göcek'te yelkenli yat kiralama teklifi alın. Online fiyat hesaplayın.">

<!-- Ek SEO meta tagları -->
<meta name="robots" content="index, follow">
<meta name="author" content="Freya Yachting">
```

## 2. `<head>` Bölümüne Eklenecek Structured Data (JSON-LD)

`</head>` kapanışından hemen önce ekleyin:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Teklif Al — Yelkenli Yat Kiralama",
  "description": "Freya Yachting ile Fethiye ve Göcek'te yelkenli yat kiralama teklifi alın.",
  "url": "https://www.freyayachting.com/freya-offer.html",
  "inLanguage": ["tr", "en", "ru"],
  "isPartOf": {
    "@type": "WebSite",
    "name": "Freya Yachting",
    "url": "https://www.freyayachting.com"
  },
  "provider": {
    "@type": "LocalBusiness",
    "name": "Freya Yachting",
    "telephone": "+90-533-811-00-50",
    "email": "info@freyayachting.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ecesaray Marina",
      "addressLocality": "Fethiye",
      "addressRegion": "Muğla",
      "addressCountry": "TR"
    },
    "url": "https://www.freyayachting.com",
    "sameAs": [
      "https://www.instagram.com/freyayachting/"
    ]
  },
  "potentialAction": {
    "@type": "ReserveAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.freyayachting.com/freya-offer.html"
    },
    "object": {
      "@type": "BoatTrip",
      "name": "Yelkenli Yat Kiralama — Fethiye / Göcek"
    }
  }
}
</script>
```

## 3. Güncellenmiş Dosyalar

Bu rehberle birlikte aşağıdaki dosyalar da güncellendi:

- **sitemap.xml** → `freya-offer.html` eklendi (priority: 0.8)
- **robots.txt** → `ucus.html` engellemesi mevcut, diğer tüm sayfalar açık

## 4. Sunucuya Yükleme Adımları

1. `sitemap.xml` ve `robots.txt` dosyalarını sunucuya yükleyin (mevcut dosyaları değiştirin)
2. `freya-offer.html` dosyasının `<head>` bölümüne yukarıdaki meta tagları ve structured data'yı ekleyin
3. Google Search Console'da sitemap'i yeniden gönderin
