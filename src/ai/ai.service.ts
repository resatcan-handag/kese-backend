import { Injectable } from "@nestjs/common";

// AI icgorusu icin yerel + ucretsiz motor: Ollama (https://ollama.com).
// Kurulum: `ollama pull llama3.2` sonra `ollama serve` (genelde otomatik acik).
// Ollama calismiyorsa/erisilemezse her metod ucretsiz placeholder'a duser.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

interface ExtractedReceipt {
  merchant: string;
  total: number;
  date: string;
  items: Array<{ name: string; amount: number }>;
}

@Injectable()
export class AiService {
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

  // Fis gorselinden alanlari cikar. Gorsel LLM'i (Ollama'da llava/llama3.2-vision)
  // henuz bagli degil; simdilik ornek alanlar (ReceiptModal uctan uca calissin diye).
  async extractReceipt(_imageUrl: string): Promise<ExtractedReceipt> {
    return this.placeholderReceipt();
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
