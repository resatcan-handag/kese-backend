# Kese — Backend (API)

NestJS + Prisma + PostgreSQL. Harcama takip uygulamasinin API'si.

## Kurulum

1. Bagimliliklari kur: `npm install`
2. `.env` olustur (`.env.example`'i kopyala) ve `DATABASE_URL`'i kendi veritabanina gore ayarla.
3. Prisma client uret ve tablolari olustur:
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
4. Ornek veriyi yukle: `npm run seed`
5. Calistir: `npm run start:dev`

API: http://localhost:3000/api

## Uclar
- GET    /api/dashboard/summary    Pano ozeti (toplam + kategori dagilimi)
- GET    /api/dashboard/insights   AI icgoru (simdilik stub)
- GET    /api/transactions         Islemler (?categoryId ile filtre)
- POST   /api/transactions         Islem ekle (kategori bossa AI onerir)
- PATCH  /api/transactions/:id     Guncelle
- DELETE /api/transactions/:id     Sil
- GET    /api/categories           Kategoriler
- POST   /api/categories           Kategori ekle
- POST   /api/categories/suggest   Aciklamadan AI kategori onerisi

## AI nerede?
`src/ai/ai.service.ts` icinde uc yer tutucu var: suggestCategory, generateInsight, extractReceipt.
Su an basit kural/sabit donuyorlar; gercek LLM (or. Anthropic) cagrisini buraya koyacaksin.

## Onyuze baglama
Onyuzdeki `src/data.ts` yerine bu uclara fetch atilir (or. GET /api/dashboard/summary).
CORS acik oldugundan localhost:5173'ten cagrilabilir.

## Siradaki adimlar
- Receipts uclari (POST /receipts, /receipts/:id/confirm) + dosya yukleme.
- Auth (kayit/giris, JWT) ve kullanici bazli filtreleme (su an tek demo kullanici).
