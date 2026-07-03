import { Injectable, Logger } from "@nestjs/common";

// AI icgorusu icin yerel + ucretsiz motor: Ollama (https://ollama.com).
// Kurulum: `ollama pull llama3.2` sonra `ollama serve` (genelde otomatik acik).
// Ollama calismiyorsa/erisilemezse her metod ucretsiz placeholder'a duser.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
// Fis okuma icin GORSEL model gerekir (metin modeli goruntu okuyamaz).
// Kurulum ornegi: `ollama pull llama3.2-vision` (alternatif: llava, minicpm-v, moondream).
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? "llama3.2-vision";

interface ExtractedReceipt {
  merchant: string;
  total: number;
  date: string;
  items: Array<{ name: string; amount: number }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  // Kullanici basina son icgoru (veri imzasiyla). Veri degismedikce yeniden uretilmez.
  private insightCache = new Map<string, { sig: string; text: string }>();

  // Aciklamadan kategori oner (kural-tabanli, ucretsiz ve hizli — islem eklemeyi yavaslatmaz).
  async suggestCategory(description: string, categories: string[]): Promise<string> {
    const d = (description || "").toLowerCase();
    if (d.includes("market") || d.includes("migros") || d.includes("sok")) return "Market";
    if (d.includes("taksi") || d.includes("otobus") || d.includes("metro")) return "Ulasim";
    if (d.includes("kahve") || d.includes("restoran") || d.includes("yemek")) return "Yemek";
    if (d.includes("fatura") || d.includes("elektrik") || d.includes("internet")) return "Faturalar";
    return categories[0] ?? "Diger";
  }

  // Aylik ozetten dogal dille icgoru uret — yerel Ollama modeliyle (ucretsiz).
  // cache verilirse: ayni veri imzasi (sig) icin onbellekten doner; sadece veri
  // degisince yeniden uretilir (her yenilemede degismesin diye).
  async generateInsight(
    stats: { total: number; topCategory?: string },
    cache?: { userId: string; sig: string },
  ): Promise<string> {
    if (cache) {
      const hit = this.insightCache.get(cache.userId);
      if (hit && hit.sig === cache.sig) return hit.text;
    }
    const user =
      `Bu ay toplam ${stats.total.toLocaleString("tr-TR")} TL harcandi.` +
      (stats.topCategory ? ` En cok "${stats.topCategory}" kategorisinde.` : "") +
      " Bu verilere dayanarak kisa bir icgoru ver.";
    const text = await this.ollamaChat(
      "Sen bir kisisel finans asistanisin. Kisa, samimi ve Turkce bir harcama icgorusu yaz. " +
        "En fazla 2 cumle. Sadece icgoru metnini dondur; baslik, tirnak veya aciklama ekleme.",
      user,
    );
    // Sadece gercek (Ollama) sonuclari onbellekle; placeholder onbelleklenmez
    // ki Ollama sonradan acilinca ilk yenilemede gercek icgoru gelsin.
    if (text) {
      if (cache) this.insightCache.set(cache.userId, { sig: cache.sig, text });
      return text;
    }
    return this.placeholderInsight(stats);
  }

  // Fis gorselinden alanlari cikar — yerel Ollama gorsel modeliyle (ucretsiz).
  // Model yoksa/basarisizsa placeholder'a duser (uygulama uctan uca calisir).
  async extractReceipt(imageUrl: string): Promise<ExtractedReceipt> {
    const base64 = this.dataUrlToBase64(imageUrl);
    if (!base64) {
      this.logger.warn("Fis: gecersiz gorsel (data URL degil) — ornek veriye dusuldu.");
      return this.placeholderReceipt();
    }
    const raw = await this.ollamaVision(base64);
    if (!raw) {
      this.logger.warn(
        `Fis: gorsel model okuyamadi — ornek veriye dusuldu. Model "${OLLAMA_VISION_MODEL}" kurulu mu? (ollama pull ${OLLAMA_VISION_MODEL})`,
      );
      return this.placeholderReceipt();
    }
    this.logger.log(`Fis okundu: ${raw.merchant ?? "?"} / ${raw.total ?? "?"}`);
    return this.normalizeReceipt(raw);
  }

  // --- Yardimcilar ---

  // Ollama /api/chat cagrisi; erisilemezse (kurulu degil/kapali) null doner.
  private async ollamaChat(system: string, user: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          options: { temperature: 0.7 },
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { message?: { content?: string } };
      const text = data.message?.content?.trim();
      return text ? text : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Ollama gorsel modeline fisi ver, yapisal JSON iste. Erisilemezse null.
  private async ollamaVision(imageBase64: string): Promise<Partial<ExtractedReceipt> | null> {
    const controller = new AbortController();
    // Gorsel modeller yavas olabilir (ilk yuklemede model belleklenir).
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_VISION_MODEL,
          stream: false,
          format: "json", // Ollama'yi gecerli JSON dondurmeye zorlar
          messages: [
            {
              role: "user",
              content:
                "Bu fis/fatura gorselini oku ve SADECE su JSON'u dondur: " +
                '{"merchant": string, "total": number, "date": "YYYY-MM-DD", ' +
                '"items": [{"name": string, "amount": number}]}. ' +
                "merchant satici/magaza adi, total genel toplam, date fis tarihi. " +
                "Tutarlar nokta ondalikli sayi (orn. 42.50). Gorunmeyen alani bos birak.",
              images: [imageBase64],
            },
          ],
          options: { temperature: 0 },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        this.logger.warn(`Ollama vision ${res.status}: ${body.slice(0, 200)}`);
        return null;
      }
      const data = (await res.json()) as { message?: { content?: string } };
      const content = data.message?.content?.trim();
      if (!content) return null;
      return JSON.parse(content) as Partial<ExtractedReceipt>;
    } catch (e) {
      this.logger.warn(
        `Ollama vision hata: ${e instanceof Error ? e.message : String(e)} ` +
          `(Ollama calisiyor mu? ${OLLAMA_URL})`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // data:image/...;base64,---- -> ---- (Ollama ham base64 ister, on ek istemez).
  private dataUrlToBase64(url: string): string | null {
    const m = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/i.exec(url ?? "");
    return m ? m[1] : null;
  }

  // Modelin dondurdugu JSON'u guvenli sekilde ExtractedReceipt'e cevir.
  private normalizeReceipt(input: Partial<ExtractedReceipt>): ExtractedReceipt {
    const items = Array.isArray(input?.items)
      ? input.items
          .filter((it) => it && typeof it.name === "string" && it.name.trim())
          .map((it) => ({ name: String(it.name).trim(), amount: Number(it.amount) || 0 }))
      : [];
    const total = Number(input?.total) || items.reduce((s, it) => s + it.amount, 0);
    const date =
      typeof input?.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(input.date)
        ? input.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const merchant =
      typeof input?.merchant === "string" && input.merchant.trim()
        ? input.merchant.trim()
        : "Bilinmiyor";
    return { merchant, total, date, items };
  }

  private placeholderInsight(stats: { total: number; topCategory?: string }): string {
    const top = stats.topCategory ? ` En cok ${stats.topCategory} kategorisinde harcadin.` : "";
    return `Bu ay toplam ${stats.total.toLocaleString("tr-TR")} TL harcadin.${top} (AI icgorusu icin Ollama'yi calistir.)`;
  }

  private placeholderReceipt(): ExtractedReceipt {
    const items = [
      { name: "Sut 1L", amount: 42.0 },
      { name: "Ekmek", amount: 18.5 },
      { name: "Yumurta 15'li", amount: 68.9 },
      { name: "Deterjan", amount: 126.0 },
      { name: "Domates 1kg", amount: 34.2 },
      { name: "Tavuk gogsu", amount: 96.9 },
    ];
    const total = items.reduce((s, it) => s + it.amount, 0);
    return { merchant: "Migros", total, date: new Date().toISOString(), items };
  }
}
