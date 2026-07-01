import { Injectable } from "@nestjs/common";

/**
 * AI yer tutucu servisi.
 * Su an basit kural/sabit donuyor. Gercek LLM (or. Anthropic / OpenAI)
 * cagrilarini TODO'lari isaretli yerlere koyacaksin.
 */
@Injectable()
export class AiService {
  // Aciklamadan kategori oner.
  async suggestCategory(description: string, categories: string[]): Promise<string> {
    const d = (description || "").toLowerCase();
    // TODO: LLM cagrisi — aciklama + kategori listesini ver, en uygun kategoriyi al.
    if (d.includes("market") || d.includes("migros") || d.includes("sok")) return "Market";
    if (d.includes("taksi") || d.includes("otobus") || d.includes("metro")) return "Ulasim";
    if (d.includes("kahve") || d.includes("restoran") || d.includes("yemek")) return "Yemek";
    if (d.includes("fatura") || d.includes("elektrik") || d.includes("internet")) return "Faturalar";
    return categories[0] ?? "Diger";
  }

  // Aylik ozetten dogal dille icgoru uret.
  async generateInsight(stats: { total: number; topCategory?: string }): Promise<string> {
    // TODO: LLM cagrisi — ozet istatistikleri ver, kisa bir icgoru cumlesi al.
    const top = stats.topCategory ? ` En cok ${stats.topCategory} kategorisinde harcadin.` : "";
    return `Bu ay toplam ${stats.total.toLocaleString("tr-TR")} TL harcadin.${top} (AI icgorusu icin LLM baglanacak.)`;
  }

  // Fis gorselinden alanlari cikar.
  async extractReceipt(_imageUrl: string): Promise<{
    merchant: string;
    total: number;
    date: string;
    items: Array<{ name: string; amount: number }>;
  }> {
    // TODO: Goruntu LLM cagrisi — fis fotografini ver, yapisal alanlari al.
    return { merchant: "Bilinmiyor", total: 0, date: new Date().toISOString(), items: [] };
  }
}
