import { Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CurrentUser } from "../auth/current-user";

@Injectable({ scope: Scope.REQUEST })
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly currentUser: CurrentUser,
  ) {}

  private async currentUserId(): Promise<string> {
    return this.currentUser.id;
  }

  // Ay penceresi: month "YYYY-MM" verilirse o ay; yoksa son islemin ayi
  // (seed Haziran'da, varsayilan bos kalmasin diye).
  private async monthWindow(userId: string, month?: string) {
    const m = month?.match(/^(\d{4})-(\d{2})$/);
    let ref: Date;
    if (m) {
      ref = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    } else {
      const latest = await this.prisma.transaction.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        select: { date: true },
      });
      ref = latest?.date ?? new Date();
    }
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    const label = start.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    return { start, end, daysInMonth, label };
  }

  async summary(month?: string) {
    const userId = await this.currentUserId();
    const { start, end, label } = await this.monthWindow(userId, month);
    const where = { userId, date: { gte: start, lt: end } };

    const totalAgg = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    });

    const grouped = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
    });

    const cats = await this.prisma.category.findMany({ where: { userId } });
    const categories = grouped
      .map((g) => {
        const cat = cats.find((c) => c.id === g.categoryId);
        return {
          category: cat?.name ?? "Diger",
          color: cat?.color ?? "#888888",
          amount: g._sum.amount ? g._sum.amount.toNumber() : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      total: totalAgg._sum.amount ? totalAgg._sum.amount.toNumber() : 0,
      categories,
      label,
    };
  }

  async insights(month?: string) {
    const userId = await this.currentUserId();
    const { total, categories, label } = await this.summary(month);
    // Veri imzasi: ay + toplam + kategori dagilimi. Degismedikce yeniden uretilmez.
    const sig = `${label}|${total}|` + categories.map((c) => `${c.category}:${c.amount}`).join(",");
    const text = await this.ai.generateInsight(
      { total, topCategory: categories[0]?.category },
      { userId, sig },
    );
    return { text };
  }

  // Gunluk harcama serisi (secili ay).
  async trend(month?: string) {
    const userId = await this.currentUserId();
    const { start, end, daysInMonth, label } = await this.monthWindow(userId, month);

    const txns = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { date: true, amount: true },
    });

    const sums = new Array<number>(daysInMonth).fill(0);
    for (const t of txns) {
      const day = new Date(t.date).getDate();
      sums[day - 1] += t.amount.toNumber();
    }

    return {
      label,
      points: sums.map((amount, i) => ({ day: i + 1, amount })),
    };
  }

  // Islemin bulundugu aylar (YYYY-MM), yeniden eskiye — ay secici icin.
  async months() {
    const userId = await this.currentUserId();
    const rows = await this.prisma.transaction.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: "desc" },
    });
    const seen = new Set<string>();
    for (const r of rows) {
      const d = new Date(r.date);
      seen.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return Array.from(seen);
  }
}
