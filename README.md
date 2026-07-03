# Kese — Backend (API)

NestJS + Prisma + PostgreSQL. Harcama takip uygulamasının API'si. Kimlik doğrulama JWT ile; AI yerel Ollama ile (ücretsiz).

## Kurulum

```bash
npm install
cp .env.example .env          # DATABASE_URL + JWT_SECRET'i düzenle
npx prisma generate
npx prisma migrate dev --name init
npm run seed                  # demo giriş: ada@kese.app / demo1234
npm run start:dev             # http://localhost:3000/api
```

`.env` değişkenleri: `DATABASE_URL`, `PORT`, `JWT_SECRET` ve (opsiyonel AI için) `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_VISION_MODEL`.

## Kimlik doğrulama

- `POST /api/auth/register` ve `POST /api/auth/login` **herkese açık** (`@Public`), gövde: `{ email, password }`, yanıt: `{ token, user }`.
- Diğer **tüm uçlar** `Authorization: Bearer <token>` ister (global `JwtAuthGuard`).
- Kayıtta kullanıcıya varsayılan kategoriler oluşturulur. JWT + şifre (scrypt) bağımlılıksız, Node `crypto` ile (`src/auth/security.ts`).

## Uçlar (hepsi `/api` önekli, auth hariç token ister)

| Uç | Açıklama |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Kayıt / giriş (public) |
| `GET  /users/me` | Oturumdaki kullanıcı |
| `GET  /dashboard/summary` | Toplam + kategori dağılımı |
| `GET  /dashboard/insights` | AI içgörü (Ollama; veriye göre önbellekli) |
| `GET  /dashboard/trend` | Günlük harcama serisi |
| `GET  /transactions` | İşlemler (`?categoryId` ile filtre) |
| `POST /transactions` | İşlem ekle (kategori boşsa AI/kural önerir) |
| `PATCH /transactions/:id`, `DELETE /transactions/:id` | Güncelle / sil |
| `GET  /categories` | Kategoriler |
| `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` | Ekle / düzenle / sil |
| `POST /categories/suggest` | Açıklamadan kategori önerisi |
| `POST /receipts` | Fiş yükle (data URL) → AI okur + kategori önerir |
| `POST /receipts/:id/confirm` | Okunan alanları onayla → RECEIPT işlemi oluştur |
| `POST /import/csv` | Eşlenmiş satırlardan toplu CSV işlemi |
| `GET  /budgets`, `PUT /budgets` | Aktif ay kategori limiti + harcama; limit ata/kaldır |

## AI nerede? (`src/ai/ai.service.ts`)

- `generateInsight` → yerel **Ollama** (`/api/chat`, `OLLAMA_MODEL`, varsayılan `llama3.2`). Veri değişmedikçe yeniden üretilmez (önbellek).
- `extractReceipt` → **Ollama görsel** modeli (`OLLAMA_VISION_MODEL`, ör. `llava` / `llama3.2-vision`). Fiş data URL'inin base64'ü modele gönderilir.
- `suggestCategory` → kural-tabanlı (ücretsiz/hızlı).

Ollama kurulu/açık değilse her metod ücretsiz **placeholder**'a düşer; uygulama uçtan uca çalışmaya devam eder. Ücretli bulut LLM'i kullanılmaz.

## Notlar

- Prisma `Decimal` para için; API'ye dönerken sayıya çevrilir (`.toNumber()`).
- Yeni kaynak eklerken `src/transactions/` klasörünü örnek al (modül/servis/controller/dto).
- Fiş fotoğrafı JSON gövdesinde geldiği için gövde limiti 15 MB'a çıkarılmıştır (`main.ts`).
